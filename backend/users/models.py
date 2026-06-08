from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    class Role(models.TextChoices):
        ADMIN = 'ADMIN', 'Administrator'
        STUDENT = 'STUDENT', 'Student'
        INSTRUCTOR = 'INSTRUCTOR', 'Instructor'
        MANAGER = 'MANAGER', 'Manager'
        DIRECTOR = 'DIRECTOR', 'Director'
        CDACC = 'CDACC', 'CDACC'
        
    registration_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    cdacc_registration_number = models.CharField(max_length=50, unique=True, null=True, blank=True)
    role = models.CharField(
        max_length=20,
        choices=Role.choices,
        default=Role.STUDENT
    )
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    assigned_courses = models.ManyToManyField('academic.Course', blank=True, related_name='instructors')
    
    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['registration_number', 'email']
    class Intake(models.TextChoices):
        JANUARY = 'JANUARY', 'January Intake'
        MAY = 'MAY', 'May Intake'
        SEPTEMBER = 'SEPTEMBER', 'September Intake'

    # Academic linking for students
    course = models.ForeignKey('academic.Course', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    semester = models.ForeignKey('academic.Semester', on_delete=models.SET_NULL, null=True, blank=True, related_name='students')
    intake = models.CharField(
        max_length=20,
        choices=Intake.choices,
        null=True,
        blank=True
    )

    def clean(self):
        super().clean()
        if self.role == 'STUDENT' and self.course:
            if self.course.level in ['LEVEL_5', 'LEVEL_6'] and not self.cdacc_registration_number:
                from django.core.exceptions import ValidationError
                raise ValidationError({'cdacc_registration_number': 'CDACC registration number is required for Level 5 and Level 6 students.'})

    def save(self, *args, **kwargs):
        if not self.registration_number:
            self.registration_number = None
        if not self.cdacc_registration_number:
            self.cdacc_registration_number = None
            
        if self.role == 'STUDENT' and self.course and self.intake and not self.semester:
            from academic.models import CourseSession
            active_session = CourseSession.objects.filter(course=self.course, intake=self.intake, is_active=True).first()
            if active_session:
                self.semester = active_session.semester
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.get_role_display()})"
