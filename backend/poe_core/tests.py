from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from poe_core.models import Portfolio, Assessment, Evidence
from academic.models import School, Course, Semester, Unit

User = get_user_model()

class GradingWorkflowTests(APITestCase):
    def setUp(self):
        # Setup academic structure
        self.school = School.objects.create(name="Engineering")
        self.course = Course.objects.create(name="Software Engineering", school=self.school)
        self.semester = Semester.objects.create(name="Semester 1", course=self.course)
        self.unit = Unit.objects.create(name="Python", code="CS101", semester=self.semester)
        
        # Setup Users
        self.student = User.objects.create_user(
            registration_number='STUD001', username='student1', password='password', role='STUDENT'
        )
        self.instructor = User.objects.create_user(
            registration_number='INST001', username='instructor1', password='password', role='INSTRUCTOR'
        )
        
        # Assign instructor to unit
        self.unit.instructors.add(self.instructor)
        
        # Setup URLs
        self.assessment_url = reverse('assessment-list')
        self.portfolio_url = reverse('portfolio-list')

    def test_grading_workflow(self):
        # 1. Student creates a portfolio
        self.client.force_authenticate(user=self.student)
        portfolio = Portfolio.objects.create(title="My Work", learner=self.student, unit=self.unit, status='SUBMITTED')
        
        # 2. Instructor grades the portfolio
        self.client.force_authenticate(user=self.instructor)
        data = {
            "portfolio": portfolio.id,
            "grade": "Pass",
            "feedback": "Well done!"
        }
        response = self.client.post(self.assessment_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # 3. Verify portfolio status changed to EVALUATED
        portfolio.refresh_from_db()
        self.assertEqual(portfolio.status, "EVALUATED")
        self.assertEqual(Assessment.objects.count(), 1)

    def test_cannot_grade_draft_portfolio(self):
        # Student has a draft portfolio
        portfolio = Portfolio.objects.create(title="Draft Work", learner=self.student, unit=self.unit, status='DRAFT')
        
        self.client.force_authenticate(user=self.instructor)
        data = {
            "portfolio": portfolio.id,
            "grade": "Fail",
            "feedback": "Incomplete"
        }
        response = self.client.post(self.assessment_url, data)
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Only portfolios in 'SUBMITTED' status can be evaluated.", str(response.data))

        # Another instructor not assigned to this unit
        other_instructor = User.objects.create_user(
            registration_number='INST002', username='instructor2', password='password', role='INSTRUCTOR'
        )
        portfolio = Portfolio.objects.create(title="My Work", learner=self.student, unit=self.unit, status='SUBMITTED')
        
        self.client.force_authenticate(user=other_instructor)
        
        # Should not see the portfolio in their queryset
        response = self.client.get(self.portfolio_url)
        self.assertEqual(len(response.data), 0)

    def test_submission_round_increment_on_redo(self):
        # Student creates a portfolio
        portfolio = Portfolio.objects.create(title="My Work", learner=self.student, unit=self.unit, status='SUBMITTED')
        
        # Student uploads round 1 evidence
        evidence1 = Evidence.objects.create(portfolio=portfolio, file="dummy1.pdf")
        self.assertEqual(evidence1.submission_round, 1)
        self.assertEqual(portfolio.submission_round, 1)
        
        # Instructor evaluates and requests REDO
        self.client.force_authenticate(user=self.instructor)
        data = {
            "portfolio": portfolio.id,
            "grade": "REDO",
            "feedback": "Please improve this work",
            "is_redo_request": True
        }
        response = self.client.post(self.assessment_url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        portfolio.refresh_from_db()
        self.assertEqual(portfolio.status, "REDO")
        self.assertEqual(portfolio.submission_round, 2)
        
        # Student uploads round 2 evidence
        evidence2 = Evidence.objects.create(portfolio=portfolio, file="dummy2.pdf")
        self.assertEqual(evidence2.submission_round, 2)
        self.assertEqual(evidence1.submission_round, 1)

    def test_role_based_evidence_filtering(self):
        # Setup portfolio in round 2
        portfolio = Portfolio.objects.create(title="My Work", learner=self.student, unit=self.unit, status='REDO', submission_round=2)
        evidence1 = Evidence.objects.create(portfolio=portfolio, file="dummy1.pdf")
        # Explicitly force evidence1 to round 1 (since save auto-inherits current portfolio round)
        evidence1.submission_round = 1
        evidence1.save()
        
        evidence2 = Evidence.objects.create(portfolio=portfolio, file="dummy2.pdf") # gets round 2
        
        detail_url = reverse('portfolio-detail', kwargs={'pk': portfolio.id})
        
        # 1. Student should see all evidence
        self.client.force_authenticate(user=self.student)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['evidence']), 2)
        self.assertEqual(response.data['evidence_count'], 2)
        
        # 2. Instructor should see all evidence
        self.client.force_authenticate(user=self.instructor)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['evidence']), 2)
        self.assertEqual(response.data['evidence_count'], 2)
        
        # 3. Manager/CDACC/Admin should only see current round evidence (round 2)
        manager = User.objects.create_user(
            registration_number='MGR001', username='manager1', password='password', role='MANAGER'
        )
        self.client.force_authenticate(user=manager)
        response = self.client.get(detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['evidence']), 1)
        self.assertEqual(response.data['evidence_count'], 1)
        self.assertEqual(response.data['evidence'][0]['id'], evidence2.id)

