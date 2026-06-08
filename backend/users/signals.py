from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User
from academic.models import Unit

@receiver(post_save, sender=User)
def auto_enroll_student(sender, instance, created, **kwargs):
    """
    Automatically enroll students in units of their assigned semester when student is saved.
    """
    if kwargs.get('raw'):
        return
    if instance.role == 'STUDENT' and instance.semester:
        # Get all units for this semester
        units = Unit.objects.filter(semester=instance.semester)
        # Clear old units that are NOT in this semester? 
        # Actually, let's just add new ones. 
        # If they changed semesters, they might still have old units, which is okay for history.
        # But if we want a clean sync:
        # instance.enrolled_units.clear() # Optional: careful with this if they have portfolios
        for unit in units:
            unit.students.add(instance)

@receiver(post_save, sender=Unit)
def enroll_existing_students(sender, instance, created, **kwargs):
    """
    When a NEW unit is added to a semester, enroll all students in that semester.
    """
    if kwargs.get('raw'):
        return
    from .models import User
    students = User.objects.filter(role='STUDENT', semester=instance.semester)
    for student in students:
        instance.students.add(student)
