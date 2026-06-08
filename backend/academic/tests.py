from django.test import TestCase
from .models import School, Course, Semester, Unit

class AcademicStructureTests(TestCase):
    def setUp(self):
        self.school = School.objects.create(name="School of Health Sciences")
        self.course_cert = Course.objects.create(name="Nursing Certificate", school=self.school, level='LEVEL_5')
        self.course_dip = Course.objects.create(name="Nursing Diploma", school=self.school, level='LEVEL_6')
        self.semester = Semester.objects.create(name="Semester 1", course=self.course_dip)
        self.unit = Unit.objects.create(name="Human Anatomy", code="HS101", semester=self.semester)

    def test_course_levels(self):
        self.assertEqual(self.course_cert.level, 'LEVEL_5')
        self.assertEqual(self.course_dip.level, 'LEVEL_6')
        self.assertIn("(Level 5)", str(self.course_cert))
        self.assertIn("(Level 6)", str(self.course_dip))

    def test_course_link(self):
        self.assertEqual(self.course_dip.school, self.school)
        self.assertEqual(self.school.courses.count(), 2)

    def test_semester_link(self):
        self.assertEqual(self.semester.course, self.course_dip)
        self.assertEqual(self.course_dip.semesters.count(), 1)

    def test_unit_link(self):
        self.assertEqual(self.unit.semester, self.semester)
        self.assertEqual(self.semester.units.count(), 1)
        self.assertEqual(str(self.unit), "HS101: Human Anatomy")
