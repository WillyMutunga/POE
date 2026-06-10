from django.db import models
from django.conf import settings

class School(models.Model):
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class Course(models.Model):
    LEVEL_CHOICES = (
        ('GRADE_I', 'Grade I'),
        ('GRADE_II', 'Grade II'),
        ('GRADE_III', 'Grade III'),
        ('LEVEL_3', 'Level 3'),
        ('LEVEL_4', 'Level 4'),
        ('LEVEL_5', 'Level 5'),
        ('LEVEL_6', 'Level 6'),
        ('HEADWAY', 'Headway'),
    )
    name = models.CharField(max_length=255)
    school = models.ForeignKey(School, on_delete=models.CASCADE, related_name='courses')
    level = models.CharField(max_length=20, choices=LEVEL_CHOICES, default='LEVEL_6')
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='courses_instructing')

    def __str__(self):
        return f"{self.name} ({self.get_level_display()})"

class Semester(models.Model):
    name = models.CharField(max_length=50)  # e.g., "Semester 1", "Jan-April 2024"
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='semesters')

    def __str__(self):
        return f"{self.course.name} - {self.name}"

class Unit(models.Model):
    name = models.CharField(max_length=255)
    code = models.CharField(max_length=20)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='units', null=True)
    semester = models.ForeignKey(Semester, on_delete=models.SET_NULL, related_name='units', null=True, blank=True)
    instructors = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='taught_units', blank=True)
    students = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='enrolled_units', blank=True)
    is_approved = models.BooleanField(default=True)
    credit_hours = models.IntegerField(default=45)

    class Meta:
        unique_together = ('code', 'semester')

    def __str__(self):
        return f"{self.code}: {self.name}"

class Element(models.Model):
    name = models.CharField(max_length=255)
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='elements')

    class Meta:
        unique_together = ('name', 'unit')

    def __str__(self):
        return f"{self.unit.name} - {self.name}"

class CourseSession(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='sessions')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='sessions')
    intake = models.CharField(
        max_length=20,
        choices=(
            ('JANUARY', 'January Intake'),
            ('MAY', 'May Intake'),
            ('SEPTEMBER', 'September Intake'),
        )
    )
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('course', 'intake', 'semester')

    def save(self, *args, **kwargs):
        if self.is_active:
            # Deactivate other active sessions for the same course and intake
            CourseSession.objects.filter(
                course=self.course,
                intake=self.intake,
                is_active=True
            ).exclude(id=self.id).update(is_active=False)
            
            # Automatically update the semester of all students in this course and intake
            from django.contrib.auth import get_user_model
            User = get_user_model()
            User.objects.filter(
                role='STUDENT',
                course=self.course,
                intake=self.intake
            ).update(semester=self.semester)
            
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.course.name} - {self.intake} - {self.semester.name} ({'Active' if self.is_active else 'Inactive'})"

class Rubric(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='rubrics')
    element = models.ForeignKey(Element, on_delete=models.CASCADE, related_name='rubrics', null=True, blank=True)
    title = models.CharField(max_length=255)

    def __str__(self):
        return f"{self.unit.code} - {self.title}"

class RubricCriterion(models.Model):
    rubric = models.ForeignKey(Rubric, on_delete=models.CASCADE, related_name='criteria')
    description = models.TextField()
    is_critical = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.rubric.title} - {self.description[:30]}"

class UnitRegistration(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending Approval'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    )
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='unit_registrations')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='registrations')
    semester = models.ForeignKey(Semester, on_delete=models.CASCADE, related_name='registrations', null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    registered_at = models.DateTimeField(auto_now_add=True)
    approved_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='approved_registrations')

    class Meta:
        unique_together = ('student', 'unit')

    def __str__(self):
        return f"{self.student.username} - {self.unit.code} ({self.status})"

class GradingSystem(models.Model):
    name = models.CharField(max_length=255)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='grading_systems')

    def __str__(self):
        return f"{self.course.name} - {self.name}"

class GradeRange(models.Model):
    grading_system = models.ForeignKey(GradingSystem, on_delete=models.CASCADE, related_name='ranges')
    min_score = models.IntegerField()
    max_score = models.IntegerField()
    grade = models.CharField(max_length=50)  # e.g., "AM", "NYC", "A", etc.
    description = models.CharField(max_length=255, blank=True)  # e.g., "Attained Mastery"

    def __str__(self):
        return f"{self.grading_system.name}: {self.min_score}-{self.max_score} -> {self.grade}"

class UnitMarkComponent(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='mark_components')
    name = models.CharField(max_length=100)  # e.g., "CAM 1"
    weight = models.IntegerField()  # e.g., 30

    def __str__(self):
        return f"{self.unit.code} - {self.name} ({self.weight}%)"

class StudentMark(models.Model):
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='unit_marks')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='unit_marks')
    semester = models.ForeignKey(Semester, on_delete=models.SET_NULL, null=True, blank=True)
    component_marks = models.JSONField(default=dict)  # e.g. {"ComponentID": ScoreOutof100}
    total_score = models.FloatField(default=0.0)
    grade = models.CharField(max_length=50, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('student', 'unit')

    def __str__(self):
        return f"{self.student.username} - {self.unit.code}: {self.total_score} ({self.grade})"

class ExamRepository(models.Model):
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='exams')
    instructor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='uploaded_exams')
    title = models.CharField(max_length=255)
    exam_paper = models.FileField(upload_to='exams/papers/')
    marking_scheme = models.FileField(upload_to='exams/schemes/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.unit.code} - {self.title}"
