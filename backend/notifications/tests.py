from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from poe_core.models import Portfolio, Assessment
from academic.models import School, Course, Semester, Unit
from notifications.models import Notification

User = get_user_model()

class NotificationTests(APITestCase):
    def setUp(self):
        # Setup academic structure
        self.school = School.objects.create(name="Engineering")
        self.course = Course.objects.create(name="Software Engineering", school=self.school)
        self.semester = Semester.objects.create(name="Semester 1", course=self.course)
        self.unit = Unit.objects.create(name="Python", code="CS101", semester=self.semester)
        
        # Setup Users
        self.student = User.objects.create_user(
            registration_number='STUD_NOTIF', username='student_notif', password='password', role='STUDENT'
        )
        self.instructor = User.objects.create_user(
            registration_number='INST_NOTIF', username='instructor_notif', password='password', role='INSTRUCTOR'
        )
        self.unit.instructors.add(self.instructor)

    def test_notification_on_status_change(self):
        # 1. Student creates a portfolio
        portfolio = Portfolio.objects.create(title="Test Notif", learner=self.student, unit=self.unit, status='DRAFT')
        
        # 2. Change status to SUBMITTED
        portfolio.status = 'SUBMITTED'
        portfolio.save()
        
        # 3. Check if notification was created
        self.assertEqual(Notification.objects.filter(user=self.student, notification_type='STATUS_CHANGE').count(), 1)
        notif = Notification.objects.get(user=self.student, notification_type='STATUS_CHANGE')
        self.assertIn("Portfolio Submitted", notif.title)

    def test_notification_on_grading(self):
        portfolio = Portfolio.objects.create(title="Grade Test", learner=self.student, unit=self.unit, status='SUBMITTED')
        
        # Instructor grades it
        Assessment.objects.create(
            portfolio=portfolio,
            assessor=self.instructor,
            grade="Pass",
            feedback="Good"
        )
        
        # Check for Grade Assigned notification
        self.assertEqual(Notification.objects.filter(user=self.student, notification_type='GRADE_ASSIGNED').count(), 1)
        
        # Check if portfolio status change also triggered a notification (EVALUATED)
        portfolio.refresh_from_db()
        # Status change to EVALUATED is handled in poe_core.views.AssessmentViewSet.perform_create
        # Wait, if it's handled in the view, my signal will catch it.
        self.assertEqual(portfolio.status, 'EVALUATED')
        self.assertEqual(Notification.objects.filter(user=self.student, title="Portfolio Evaluated").count(), 1)

    def test_mark_as_read(self):
        notif = Notification.objects.create(user=self.student, title="Test", message="Test")
        self.client.force_authenticate(user=self.student)
        
        url = reverse('notification-mark-as-read', args=[notif.id])
        response = self.client.post(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        notif.refresh_from_db()
        self.assertTrue(notif.is_read)
