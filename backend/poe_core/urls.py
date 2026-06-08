from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PortfolioViewSet, EvidenceViewSet, AssessmentViewSet, CommentViewSet, CohortAnalyticsView

router = DefaultRouter()
router.register(r'portfolios', PortfolioViewSet)
router.register(r'evidence', EvidenceViewSet)
router.register(r'assessments', AssessmentViewSet)
router.register(r'comments', CommentViewSet)

urlpatterns = [
    path('cohort-analytics/', CohortAnalyticsView.as_view(), name='cohort-analytics'),
    path('', include(router.urls)),
]
