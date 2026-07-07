from rest_framework import generics, permissions, status
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import UserSerializer, UserRegistrationSerializer, CustomTokenObtainPairSerializer, ChangePasswordSerializer
from rest_framework.views import APIView
from academic.models import School, Course, Unit
from poe_core.models import Portfolio
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.core.mail import send_mail
from django.conf import settings

User = get_user_model()

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class AdminUserCreateView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAdminUser,)

class UserRegistrationView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = (permissions.AllowAny,)

class UserListView(generics.ListAPIView):
    queryset = User.objects.all().order_by('-date_joined')
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        user = self.request.user
        queryset = User.objects.all().order_by('first_name', 'last_name', 'username')
        
        # Filtering
        course_id = self.request.query_params.get('course')
        school_id = self.request.query_params.get('school')
        intake = self.request.query_params.get('intake')
        role = self.request.query_params.get('role')
        user_id = self.request.query_params.get('id')
        
        if user_id:
            queryset = queryset.filter(id=user_id)
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        if school_id:
            queryset = queryset.filter(course__school_id=school_id)
        if intake:
            queryset = queryset.filter(intake=intake)
        if role:
            queryset = queryset.filter(role=role)
            
        if user.role in ['ADMIN', 'MANAGER', 'DIRECTOR', 'CDACC']:
            return queryset
        return queryset.filter(role='STUDENT')

class AdminUserUpdateView(generics.UpdateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAdminUser,)

class AdminUserDeleteView(generics.DestroyAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.IsAdminUser,)

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)
        data = dict(serializer.data)

        # Inject effective_semester_id so frontend lock logic matches backend
        # Uses same logic as get_student_current_semester() in academic/views.py
        effective_semester_id = instance.semester_id  # may be None
        if not effective_semester_id and instance.role == 'STUDENT':
            from academic.models import UnitRegistration
            from academic.serializers import semester_sort_key
            regs = UnitRegistration.objects.filter(
                student=instance, status='APPROVED'
            ).select_related('semester').exclude(semester__isnull=True)
            if regs.exists():
                semesters = list({r.semester for r in regs})
                semesters.sort(key=lambda s: semester_sort_key(s.name))
                effective_semester_id = semesters[-1].id

        data['effective_semester_id'] = effective_semester_id
        return Response(data)

class InstructorStudentListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        # Return all students enrolled in any course assigned to this instructor
        instructor = self.request.user
        if instructor.role != 'INSTRUCTOR':
            return User.objects.none()

        return User.objects.filter(
            role='STUDENT',
            course__in=instructor.assigned_courses.all()
        ).distinct()

class ChangePasswordView(generics.UpdateAPIView):
    serializer_class = ChangePasswordSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        self.object = self.get_object()
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            # Check old password ONLY if provided
            old_pwd = serializer.data.get("old_password")
            if old_pwd:
                if not self.object.check_password(old_pwd):
                    return Response({"old_password": ["Wrong password."]}, status=400)
            
            # set_password also hashes the password that the user will get
            self.object.set_password(serializer.data.get("new_password"))
            self.object.save()
            return Response({"detail": "Password updated successfully"}, status=200)

        return Response(serializer.errors, status=400)

class BulkStudentEnrollmentView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        if user.role not in ['ADMIN', 'MANAGER', 'INSTRUCTOR']:
            return Response({"detail": "Not authorized"}, status=403)
            
        students_data = request.data.get('students', [])
        course_id = request.data.get('course')
        semester_id = request.data.get('semester')
        intake = request.data.get('intake', 'JANUARY')
        
        if not students_data or not course_id:
            return Response({"detail": "Missing students data or course ID"}, status=400)
            
        created_count = 0
        errors = []
        
        for student in students_data:
            try:
                username = student.get('username')
                email = student.get('email')
                reg_no = student.get('registration_number')
                
                if not username or not email:
                    errors.append(f"Missing username or email for {student}")
                    continue
                    
                if User.objects.filter(username=username).exists() or User.objects.filter(email=email).exists():
                    errors.append(f"User {username} or email {email} already exists")
                    continue
                
                password = reg_no if reg_no else username
                
                new_student = User.objects.create_user(
                    username=username,
                    email=email,
                    password=password,
                    role='STUDENT',
                    registration_number=reg_no,
                    course_id=course_id,
                    semester_id=semester_id,
                    intake=intake
                )
                created_count += 1
            except Exception as e:
                errors.append(f"Error creating {student.get('username')}: {str(e)}")
                
        return Response({
            "detail": f"Successfully enrolled {created_count} students",
            "created_count": created_count,
            "errors": errors
        }, status=status.HTTP_201_CREATED)

import csv
from django.http import HttpResponse

class StudentExportView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ['ADMIN', 'MANAGER', 'DIRECTOR']:
             return Response({"detail": "Not authorized"}, status=403)
             
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="all_students.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Registration Number', 'Full Name', 'Email', 'Course', 'Semester', 'Intake'])
        
        students = User.objects.filter(role='STUDENT').select_related('course', 'semester')
        for student in students:
            writer.writerow([
                student.registration_number,
                student.get_full_name(),
                student.email,
                student.course.name if student.course else 'N/A',
                student.semester.name if student.semester else 'N/A',
                student.get_intake_display() if student.intake else 'N/A'
            ])
            
        return response

class StudentExportPdfView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from utils.pdf_utils import generate_pdf_report
        user = request.user
        if user.role not in ['ADMIN', 'MANAGER', 'DIRECTOR', 'INSTRUCTOR']:
             return Response({"detail": "Not authorized"}, status=403)
             
        headers = ['Reg No.', 'Full Name', 'Course', 'Semester', 'Intake']
        data = []
        
        if user.role == 'INSTRUCTOR':
            # Only students taught by this instructor (via active semester or direct M2M)
            from academic.models import Unit
            units = Unit.objects.filter(instructors=user)
            semesters = units.filter(semester__isnull=False).values_list('semester', flat=True)
            from django.db.models import Q
            students = User.objects.filter(
                Q(role='STUDENT') & (
                    Q(semester__in=semesters) | Q(enrolled_units__in=units)
                )
            ).distinct().select_related('course', 'semester')
            full_name = user.get_full_name()
            title = f"My Learners Registry - {full_name}"
            subtitle = f"List of students enrolled in units taught by {full_name}"
        else:
            students = User.objects.filter(role='STUDENT').select_related('course', 'semester')
            title = "Institutional Learner Registry"
            subtitle = "Comprehensive list of all registered students across all courses"

        for student in students:
            data.append([
                student.registration_number or 'N/A',
                student.get_full_name(),
                student.course.name if student.course else 'N/A',
                student.semester.name if student.semester else 'N/A',
                student.get_intake_display() if student.intake else 'N/A'
            ])
            
        pdf_content = generate_pdf_report(
            title,
            subtitle,
            headers,
            data,
            "students_report.pdf"
        )
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="students_report.pdf"'
        response.write(pdf_content)
        return response

class InstructorExportPdfView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from utils.pdf_utils import generate_pdf_report
        user = request.user
        if user.role not in ['ADMIN', 'MANAGER', 'DIRECTOR']:
             return Response({"detail": "Not authorized"}, status=403)
             
        headers = ['Name', 'Email', 'Assigned Courses', 'Assigned Units']
        data = []
        
        instructors = User.objects.filter(role='INSTRUCTOR').prefetch_related('assigned_courses', 'taught_units')
        
        for inst in instructors:
            courses_list = [c.name for c in inst.assigned_courses.all()]
            units_list = [u.name for u in inst.taught_units.all()]
            
            # Format as numbered lists with HTML line breaks for PDF Paragraphs
            courses_str = "<br/>".join([f"{i+1}. {name}" for i, name in enumerate(courses_list)]) if courses_list else 'N/A'
            units_str = "<br/>".join([f"{i+1}. {name}" for i, name in enumerate(units_list)]) if units_list else 'N/A'
                
            data.append([
                inst.get_full_name(),
                inst.email,
                courses_str,
                units_str
            ])
            
        pdf_content = generate_pdf_report(
            "Institutional Instructor Registry",
            "Complete directory of teaching staff and their assigned curriculum responsibilities",
            headers,
            data,
            "instructors_report.pdf"
        )
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = 'attachment; filename="instructors_report.pdf"'
        response.write(pdf_content)
        return response

class SystemAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        if user.role not in ['ADMIN', 'MANAGER', 'DIRECTOR']:
             return Response({"detail": "Not authorized"}, status=403)
             
        data = {
            "total_students": User.objects.filter(role='STUDENT').count(),
            "total_instructors": User.objects.filter(role='INSTRUCTOR').count(),
            "total_schools": School.objects.count(),
            "total_courses": Course.objects.count(),
            "total_portfolios": Portfolio.objects.count(),
            "pending_evaluations": Portfolio.objects.filter(status='SUBMITTED').count(),
        }
        return Response(data)

class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        user = User.objects.filter(email=email).first()
        
        if user:
            if user.role == 'STUDENT':
                from notifications.models import Notification
                admins = User.objects.filter(role='ADMIN')
                
                # Create a system alert notification for all admins
                for admin in admins:
                    Notification.objects.create(
                        user=admin,
                        title="Password Reset Request",
                        message=f"Student {user.get_full_name()} ({user.registration_number or user.username}) has requested a password reset. Please reset their password to their registration number.",
                        notification_type=Notification.NotificationType.SYSTEM_ALERT,
                        target_url=f"/admin/users?role=STUDENT&search={user.registration_number or user.username}",
                        action_text="Go to User Management"
                    )
                
                return Response(
                    {"detail": "Your password reset request has been submitted to the administrator. They will reset your password to your registration number."},
                    status=status.HTTP_200_OK
                )

            token = default_token_generator.make_token(user)
            uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
            
            frontend_url = request.data.get('frontend_url', 'http://localhost:5173')
            reset_link = f"{frontend_url.rstrip('/')}/reset-password?uidb64={uidb64}&token={token}"
            
            from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@headwaycollege.ac.ke')
            subject = "Password Reset Request - POE System"
            message = (
                f"Hello {user.first_name or user.username},\n\n"
                f"You requested a password reset for your POE Management System account. "
                f"Please click the link below to set a new password:\n\n"
                f"{reset_link}\n\n"
                f"If you did not request this, please ignore this email.\n\n"
                f"Best regards,\n"
                f"Headway College POE Team"
            )
            
            try:
                send_mail(subject, message, from_email, [email], fail_silently=False)
            except Exception as e:
                return Response(
                    {"detail": "Error sending email. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

        return Response(
            {"detail": "If a matching account exists, a password reset link has been sent to your email."},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        uidb64 = request.data.get('uidb64')
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not uidb64 or not token or not new_password:
            return Response(
                {"detail": "uidb64, token, and new_password are required."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            user = None
            
        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(new_password)
            user.save()
            return Response(
                {"detail": "Your password has been successfully reset. You can now log in with your new password."},
                status=status.HTTP_200_OK
            )
        else:
            return Response(
                {"detail": "The reset link is invalid or has expired."},
                status=status.HTTP_400_BAD_REQUEST
            )

