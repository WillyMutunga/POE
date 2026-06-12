from rest_framework import serializers
from django.contrib.auth import get_user_model

from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()

from django.db.models import Q

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # The 'username' field in 'attrs' actually contains whatever the user typed in the login form
        login_identifier = attrs.get('username')
        password = attrs.get('password')

        # Try to find user by username OR registration_number OR email
        user = User.objects.filter(
            Q(username=login_identifier) | Q(registration_number=login_identifier) | Q(email=login_identifier)
        ).first()

        if user and user.check_password(password):
            # If user found, set the username to the actual username for the base class
            attrs['username'] = user.username
            return super().validate(attrs)
        
        raise serializers.ValidationError('No active account found with the given credentials')

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        token['username'] = user.username
        token['registration_number'] = user.registration_number
        return token

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    assigned_units = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    assigned_courses = serializers.ListField(
        child=serializers.IntegerField(),
        write_only=True,
        required=False
    )
    course_display = serializers.ReadOnlyField(source='course.name')
    semester_display = serializers.ReadOnlyField(source='semester.name')
    school_name = serializers.ReadOnlyField(source='course.school.name')
    school = serializers.ReadOnlyField(source='course.school.id')
    course_name = serializers.ReadOnlyField(source='course.name')
    course_level = serializers.ReadOnlyField(source='course.level')
    full_name = serializers.SerializerMethodField()

    def get_full_name(self, obj):
        return obj.get_full_name()

    class Meta:
        model = User
        fields = (
            'id', 'registration_number', 'cdacc_registration_number', 'username', 'email', 'role', 'password', 
            'first_name', 'last_name', 'phone_number', 'assigned_units', 'assigned_courses', 'course', 'semester', 'intake',
            'course_display', 'semester_display', 'school', 'school_name', 'course_name', 'full_name', 'course_level'
        )
        extra_kwargs = {
            'password': {'write_only': True},
            'username': {'validators': []}
        }


    def create(self, validated_data):
        assigned_units = validated_data.pop('assigned_units', [])
        assigned_courses = validated_data.pop('assigned_courses', [])
        password = validated_data.pop('password', None)
        
        # Ensure empty registration_number and cdacc_registration_number are None to avoid unique constraint issues with empty strings
        if not validated_data.get('registration_number'):
            validated_data['registration_number'] = None
        if not validated_data.get('cdacc_registration_number'):
            validated_data['cdacc_registration_number'] = None
            
        username = validated_data.get('username')
        if username:
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1
            validated_data['username'] = username
            
        user = User(**validated_data)
        
        # For students, if no password is provided or as per requirement, default to reg number or username
        if user.role == 'STUDENT' and not password:
            password = user.registration_number or user.username

        if password:
            user.set_password(password)
        else:
            user.set_unusable_password()
        user.save()
        
        if assigned_units and user.role == 'INSTRUCTOR':
            from academic.models import Unit
            units = Unit.objects.filter(id__in=assigned_units)
            for unit in units:
                unit.instructors.add(user)
        
        if assigned_courses and user.role == 'INSTRUCTOR':
            from academic.models import Course
            courses = Course.objects.filter(id__in=assigned_courses)
            user.assigned_courses.add(*courses)
            
        if user.role == 'INSTRUCTOR' and user.course:
            user.assigned_courses.add(user.course)
                
        return user

    def update(self, instance, validated_data):
        assigned_units = validated_data.pop('assigned_units', None)
        assigned_courses = validated_data.pop('assigned_courses', None)
        password = validated_data.pop('password', None)

        if 'registration_number' in validated_data and not validated_data['registration_number']:
            validated_data['registration_number'] = None
        if 'cdacc_registration_number' in validated_data and not validated_data['cdacc_registration_number']:
            validated_data['cdacc_registration_number'] = None

        username = validated_data.get('username')
        if username and username != instance.username:
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exclude(id=instance.id).exists():
                username = f"{base_username}{counter}"
                counter += 1
            validated_data['username'] = username

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()

        if assigned_units is not None and instance.role == 'INSTRUCTOR':
            from academic.models import Unit
            # This logic might need to be more sophisticated (adding vs replacing)
            # For now, let's replace
            units = Unit.objects.filter(id__in=assigned_units)
            for unit in Unit.objects.filter(instructors=instance):
                unit.instructors.remove(instance)
            for unit in units:
                unit.instructors.add(instance)

        if assigned_courses is not None and instance.role == 'INSTRUCTOR':
            from academic.models import Course
            courses = Course.objects.filter(id__in=assigned_courses)
            instance.assigned_courses.set(courses)
            
        if instance.role == 'INSTRUCTOR':
            if instance.course:
                instance.assigned_courses.set([instance.course])
            else:
                instance.assigned_courses.clear()
            
        return instance

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})

    class Meta:
        model = User
        fields = ('registration_number', 'cdacc_registration_number', 'username', 'email', 'password', 'role', 'first_name', 'last_name', 'course', 'semester', 'intake')


    def create(self, validated_data):
        user = User.objects.create_user(
            registration_number=validated_data.get('registration_number'),
            cdacc_registration_number=validated_data.get('cdacc_registration_number'),
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            role=validated_data.get('role', User.Role.STUDENT),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            course=validated_data.get('course'),
            semester=validated_data.get('semester'),
            intake=validated_data.get('intake')
        )
        if user.role == 'INSTRUCTOR' and user.course:
            user.assigned_courses.add(user.course)
        return user

class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=False)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"confirm_password": "Passwords do not match."})
        return data
