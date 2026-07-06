from rest_framework import serializers
from .models import School, Course, Semester, Unit, Element, CourseSession, Rubric, RubricCriterion, UnitRegistration, GradingSystem, GradeRange, UnitMarkComponent, StudentMark, ExamRepository
import re

def roman_to_int(s):
    roman = {'I': 1, 'V': 5, 'X': 10, 'L': 50, 'C': 100, 'D': 500, 'M': 1000}
    num = 0
    s = s.upper()
    for i in range(len(s)):
        if i > 0 and roman[s[i]] > roman[s[i - 1]]:
            num += roman[s[i]] - 2 * roman[s[i - 1]]
        else:
            num += roman[s[i]]
    return num

def semester_sort_key(name):
    if not name:
        return (2, "")
    name_upper = name.upper()
    
    # 1. Match numeric digits, e.g. "Semester 1", "Module 4"
    num_match = re.search(r'\b\d+\b', name_upper)
    if num_match:
        return (0, int(num_match.group(0)))
        
    # 2. Match Roman numerals, e.g. "MODULE IV"
    roman_pattern = r'\b[IVXLCDM]+\b'
    roman_match = re.search(roman_pattern, name_upper)
    if roman_match:
        try:
            val = roman_to_int(roman_match.group(0))
            return (0, val)
        except Exception:
            pass
            
    # 3. Fallback to alphabetical sorting
    return (1, name_upper)

class SemesterSerializer(serializers.ModelSerializer):
    course_name = serializers.ReadOnlyField(source='course.name')
    units = serializers.SerializerMethodField()

    class Meta:
        model = Semester
        fields = ('id', 'name', 'course', 'course_name', 'units')

    def get_units(self, obj):
        from .serializers import UnitSerializer
        units = obj.units.all()
        request = self.context.get('request')
        if request and request.user:
            if request.user.role in ['STUDENT', 'INSTRUCTOR', 'CDACC']:
                units = units.filter(is_approved=True)
        return UnitSerializer(units.order_by('name'), many=True, context=self.context).data

class CourseSessionSerializer(serializers.ModelSerializer):
    semester_name = serializers.ReadOnlyField(source='semester.name')

    class Meta:
        model = CourseSession
        fields = ('id', 'course', 'semester', 'semester_name', 'intake', 'is_active')

class CourseSerializer(serializers.ModelSerializer):
    school_name = serializers.ReadOnlyField(source='school.name')
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    semesters = serializers.SerializerMethodField()
    sessions = CourseSessionSerializer(many=True, read_only=True)
    unassigned_units = serializers.SerializerMethodField()
    students_detail = serializers.SerializerMethodField()
    instructors_detail = serializers.SerializerMethodField()
    instructor_name = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = (
            'id', 'name', 'school', 'school_name', 'level', 'level_display', 
            'semesters', 'sessions', 'unassigned_units', 'students_detail', 'instructors_detail',
            'instructor', 'instructor_name'
        )

    def get_semesters(self, obj):
        semesters = list(obj.semesters.all())
        request = self.context.get('request')
        if request and request.user:
            if request.user.role in ['STUDENT', 'INSTRUCTOR']:
                active_sem_ids = set(CourseSession.objects.filter(course=obj, is_active=True).values_list('semester_id', flat=True))
                semesters = [s for s in semesters if s.id in active_sem_ids]
        semesters.sort(key=lambda s: semester_sort_key(s.name))
        return SemesterSerializer(semesters, many=True, context=self.context).data

    def get_unassigned_units(self, obj):
        from .serializers import UnitSerializer
        units = obj.units.filter(semester__isnull=True)
        request = self.context.get('request')
        if request and request.user:
            if request.user.role in ['STUDENT', 'INSTRUCTOR', 'CDACC']:
                units = units.filter(is_approved=True)
        return UnitSerializer(units.order_by('name'), many=True, context=self.context).data

    def get_students_detail(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.students.filter(role='STUDENT').order_by('first_name', 'last_name', 'username'), many=True).data

    def get_instructors_detail(self, obj):
        from users.serializers import UserSerializer
        from django.contrib.auth import get_user_model
        User = get_user_model()
        # Instructors teaching any unit in this course
        instructors = User.objects.filter(taught_units__course=obj).distinct().order_by('first_name', 'last_name', 'username')
        return UserSerializer(instructors, many=True).data

    def get_instructor_name(self, obj):
        if obj.instructor:
            return obj.instructor.get_full_name()
        return None

class ElementSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = Element
        fields = ('id', 'name', 'unit')

    def to_internal_value(self, data):
        internal_data = super().to_internal_value(data)
        if 'name' in data:
            internal_data['name'] = str(data['name']).upper()
        return internal_data

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None
        
        if 'name' in attrs:
            attrs['name'] = attrs['name'].upper()
            
        if user and user.role == 'INSTRUCTOR':
            unit = attrs.get('unit')
            if unit and unit.course:
                allowed_schools = set()
                if user.course:
                    allowed_schools.add(user.course.school_id)
                for c in user.assigned_courses.all():
                    allowed_schools.add(c.school_id)
                
                if unit.course.school_id not in allowed_schools:
                    raise serializers.ValidationError("You cannot add entries for a school you are not enrolled in.")
        return attrs

    def get_name(self, obj):
        if obj.unit:
            elements = list(obj.unit.elements.all().order_by('id'))
            try:
                index = elements.index(obj) + 1
                return f"Element {index}: {obj.name}"
            except ValueError:
                return obj.name
        return obj.name

class CourseStructureSerializer(serializers.ModelSerializer):
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    semesters = serializers.SerializerMethodField()
    unassigned_units = serializers.SerializerMethodField()

    class Meta:
        model = Course
        fields = ('id', 'name', 'level', 'level_display', 'semesters', 'unassigned_units')

    def get_semesters(self, obj):
        semesters = list(obj.semesters.all())
        semesters.sort(key=lambda s: semester_sort_key(s.name))
        return SemesterSerializer(semesters, many=True, context=self.context).data

    def get_unassigned_units(self, obj):
        from .serializers import UnitSerializer
        units = obj.units.filter(semester__isnull=True)
        request = self.context.get('request')
        if request and request.user:
            if request.user.role in ['STUDENT', 'INSTRUCTOR', 'CDACC']:
                units = units.filter(is_approved=True)
        return UnitSerializer(units.order_by('name'), many=True, context=self.context).data

class SchoolSerializer(serializers.ModelSerializer):
    courses = CourseStructureSerializer(many=True, read_only=True)

    class Meta:
        model = School
        fields = ('id', 'name', 'courses')

class UnitSerializer(serializers.ModelSerializer):
    semester_name = serializers.ReadOnlyField(source='semester.name')
    course_name = serializers.ReadOnlyField(source='course.name')
    student_count = serializers.IntegerField(source='students.count', read_only=True)
    instructors_detail = serializers.SerializerMethodField()
    students_detail = serializers.SerializerMethodField()
    elements = ElementSerializer(many=True, read_only=True)
    is_locked = serializers.SerializerMethodField()
    theory_count = serializers.SerializerMethodField()
    practical_count = serializers.SerializerMethodField()
    oral_count = serializers.SerializerMethodField()
    overall_progress = serializers.SerializerMethodField()
    registered_semester = serializers.SerializerMethodField()

    class Meta:
        model = Unit
        fields = (
            'id', 'name', 'code', 'course', 'semester', 'semester_name', 
            'course_name', 'instructors', 'students', 'student_count',
            'instructors_detail', 'students_detail', 'elements', 'is_approved',
            'registered_semester', 'credit_hours',
            'is_locked', 'theory_count', 'practical_count', 'oral_count', 'overall_progress'
        )
        validators = [
            serializers.UniqueTogetherValidator(
                queryset=Unit.objects.all(),
                fields=['code', 'semester'],
                message="A unit with this code already exists in this semester/module."
            )
        ]

    def get_is_locked(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.role == 'STUDENT':
            student = request.user
            from academic.models import UnitRegistration
            reg = UnitRegistration.objects.filter(student=student, unit=obj).first()
            if not reg or reg.status != 'APPROVED':
                return True
            if student.semester and obj.semester_id != student.semester_id:
                return True
        return False

    def _get_element_counts(self, obj):
        elements_count = obj.elements.count()
        theory_total = elements_count
        practical_total = elements_count
        
        oral_total = 0
        if obj.name.lower() == 'default' or 'communication' in obj.name.lower():
            oral_total = 1
            
        return theory_total, practical_total, oral_total

    def get_theory_count(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.role == 'STUDENT':
            student = request.user
            from poe_core.models import Portfolio
            completed = Portfolio.objects.filter(
                learner=student, unit=obj, 
                assessment_type='WRITTEN', status='EVALUATED'
            ).count()
            total, _, _ = self._get_element_counts(obj)
            return f"{completed}/{total}"
        return "0/0"

    def get_practical_count(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.role == 'STUDENT':
            student = request.user
            from poe_core.models import Portfolio
            completed = Portfolio.objects.filter(
                learner=student, unit=obj, 
                assessment_type='PRACTICAL', status='EVALUATED'
            ).count()
            _, total, _ = self._get_element_counts(obj)
            return f"{completed}/{total}"
        return "0/0"

    def get_oral_count(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.role == 'STUDENT':
            student = request.user
            from poe_core.models import Portfolio
            completed = Portfolio.objects.filter(
                learner=student, unit=obj, 
                assessment_type='ORAL', status='EVALUATED'
            ).count()
            _, _, total = self._get_element_counts(obj)
            return f"{completed}/{total}"
        return "0/0"

    def get_overall_progress(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.role == 'STUDENT':
            student = request.user
            from poe_core.models import Portfolio
            completed_count = Portfolio.objects.filter(
                learner=student, unit=obj, status='EVALUATED'
            ).count()
            t_tot, p_tot, o_tot = self._get_element_counts(obj)
            total_expected = t_tot + p_tot + o_tot
            if total_expected > 0:
                return round((completed_count / total_expected * 100), 1)
        return 0.0

    def get_registered_semester(self, obj):
        request = self.context.get('request')
        if request and request.user and request.user.role == 'STUDENT':
            reg = obj.registrations.filter(student=request.user, status='APPROVED').first()
            if reg and reg.semester:
                return {
                    'id': reg.semester.id,
                    'name': reg.semester.name
                }
        return None

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user if request else None
        
        if 'name' in attrs:
            attrs['name'] = attrs['name'].upper()
        if 'code' in attrs:
            attrs['code'] = attrs['code'].upper()
            
        # Automatically populate course from semester if missing
        if not attrs.get('course') and attrs.get('semester'):
            attrs['course'] = attrs['semester'].course

        course = attrs.get('course')
        code = attrs.get('code')
        semester = attrs.get('semester')

        # Validate unique code per semester/module constraint
        if code:
            if semester:
                queryset = Unit.objects.filter(code=code, semester=semester)
                if self.instance:
                    queryset = queryset.exclude(id=self.instance.id)
                if queryset.exists():
                    raise serializers.ValidationError({
                        "code": "A unit with this code already exists in this semester/module."
                    })
            elif course:
                queryset = Unit.objects.filter(code=code, course=course, semester__isnull=True)
                if self.instance:
                    queryset = queryset.exclude(id=self.instance.id)
                if queryset.exists():
                    raise serializers.ValidationError({
                        "code": "A unit with this code already exists as an unassigned unit in this course."
                    })
            
        if user and user.role == 'INSTRUCTOR':
            if course:
                allowed_schools = set()
                if user.course:
                    allowed_schools.add(user.course.school_id)
                for c in user.assigned_courses.all():
                    allowed_schools.add(c.school_id)
                
                if course.school_id not in allowed_schools:
                    raise serializers.ValidationError("You cannot add entries for a school you are not enrolled in.")
        return attrs

    def create(self, validated_data):
        request = self.context.get('request')
        user = request.user if request else None
        
        if user and user.role == 'INSTRUCTOR':
            validated_data['is_approved'] = False
            
        unit = super().create(validated_data)
        
        if user and user.role == 'INSTRUCTOR':
            unit.instructors.add(user)
            
        return unit

    def get_instructors_detail(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.instructors.all().order_by('first_name', 'last_name', 'username'), many=True).data

    def get_students_detail(self, obj):
        from users.serializers import UserSerializer
        return UserSerializer(obj.students.filter(role='STUDENT').order_by('first_name', 'last_name', 'username'), many=True).data

class RubricCriterionSerializer(serializers.ModelSerializer):
    class Meta:
        model = RubricCriterion
        fields = ('id', 'rubric', 'description', 'is_critical')

class RubricSerializer(serializers.ModelSerializer):
    criteria = RubricCriterionSerializer(many=True, read_only=True)

    class Meta:
        model = Rubric
        fields = ('id', 'unit', 'element', 'title', 'criteria')

class UnitRegistrationSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField(read_only=True)
    student_registration_number = serializers.ReadOnlyField(source='student.registration_number')
    unit_code = serializers.ReadOnlyField(source='unit.code')
    unit_name = serializers.ReadOnlyField(source='unit.name')
    semester_name = serializers.ReadOnlyField(source='semester.name')
    course_name = serializers.ReadOnlyField(source='unit.course.name')
    status_display = serializers.ReadOnlyField(source='get_status_display')

    class Meta:
        model = UnitRegistration
        fields = (
            'id', 'student', 'student_name', 'student_registration_number', 'unit', 'unit_code', 
            'unit_name', 'semester', 'semester_name', 'course_name', 'status', 
            'status_display', 'registered_at', 'approved_by'
        )

    def get_student_name(self, obj):
        return obj.student.get_full_name()

class GradeRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = GradeRange
        fields = ('id', 'grading_system', 'min_score', 'max_score', 'grade', 'description')

class GradingSystemSerializer(serializers.ModelSerializer):
    ranges = GradeRangeSerializer(many=True, read_only=True)
    course_name = serializers.ReadOnlyField(source='course.name')

    class Meta:
        model = GradingSystem
        fields = ('id', 'name', 'course', 'course_name', 'ranges')

class UnitMarkComponentSerializer(serializers.ModelSerializer):
    class Meta:
        model = UnitMarkComponent
        fields = ('id', 'unit', 'name', 'weight', 'group_name', 'group_weight', 'formula')

class StudentMarkSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField(read_only=True)
    unit_code = serializers.ReadOnlyField(source='unit.code')
    unit_name = serializers.ReadOnlyField(source='unit.name')
    semester_name = serializers.ReadOnlyField(source='semester.name')

    class Meta:
        model = StudentMark
        fields = (
            'id', 'student', 'student_name', 'unit', 'unit_code', 
            'unit_name', 'semester', 'semester_name', 'component_marks', 
            'total_score', 'grade', 'updated_at'
        )

    def get_student_name(self, obj):
        return obj.student.get_full_name()

class ExamRepositorySerializer(serializers.ModelSerializer):
    instructor_name = serializers.SerializerMethodField(read_only=True)
    unit_code = serializers.ReadOnlyField(source='unit.code')
    unit_name = serializers.ReadOnlyField(source='unit.name')
    unit_semester_id = serializers.ReadOnlyField(source='unit.semester_id')

    class Meta:
        model = ExamRepository
        fields = (
            'id', 'unit', 'unit_code', 'unit_name', 'unit_semester_id', 'instructor', 
            'instructor_name', 'title', 'exam_paper', 'marking_scheme', 
            'uploaded_at'
        )
        read_only_fields = ('instructor',)

    def get_instructor_name(self, obj):
        return obj.instructor.get_full_name()
