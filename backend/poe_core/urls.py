from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, EvidenceViewSet, AssessmentViewSet, CommentViewSet, CohortAnalyticsView, AdminPoeManagementView, AdminPoeReportsView

router = DefaultRouter()
router.register(r'portfolios', PortfolioViewSet)
router.register(r'evidence', EvidenceViewSet)
router.register(r'assessments', AssessmentViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('cohort-analytics/', CohortAnalyticsView.as_view(), name='cohort-analytics'),
    path('poe-management-analytics/', AdminPoeManagementView.as_view(), name='poe-management-analytics'),
    path('reports-analytics/', AdminPoeReportsView.as_view(), name='reports-analytics'),
    path('', include(router.urls)),
]
