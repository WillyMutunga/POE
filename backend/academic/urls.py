from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import SchoolViewSet, CourseViewSet, SemesterViewSet, UnitViewSet, ElementViewSet, CourseSessionViewSet, RubricViewSet, UnitRegistrationViewSet, GradingSystemViewSet, StudentMarkViewSet, ExamRepositoryViewSet, OnlineExamViewSet, CertificateTemplateViewSet, CertificateViewSet

router = DefaultRouter()
router.register(r'schools', SchoolViewSet)
router.register(r'courses', CourseViewSet)
router.register(r'semesters', SemesterViewSet)
router.register(r'units', UnitViewSet)
router.register(r'elements', ElementViewSet)
router.register(r'sessions', CourseSessionViewSet)
router.register(r'rubrics', RubricViewSet)
router.register(r'registrations', UnitRegistrationViewSet)
router.register(r'grading-systems', GradingSystemViewSet)
router.register(r'student-marks', StudentMarkViewSet)
router.register(r'exams', ExamRepositoryViewSet)
router.register(r'online-exams', OnlineExamViewSet)
router.register(r'certificate-templates', CertificateTemplateViewSet)
router.register(r'certificates', CertificateViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
