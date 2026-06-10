from django.urls import path
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from .views import (
    UserRegistrationView, 
    UserProfileView, 
    CustomTokenObtainPairView, 
    UserListView, 
    AdminUserUpdateView, 
    AdminUserDeleteView,
    AdminUserCreateView,
    InstructorStudentListView,
    ChangePasswordView,
    SystemAnalyticsView,
    BulkStudentEnrollmentView,
    StudentExportView,
    StudentExportPdfView,
    InstructorExportPdfView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)

urlpatterns = [
    path('export-instructors-pdf/', InstructorExportPdfView.as_view(), name='export-instructors-pdf'),
    path('export-students/', StudentExportView.as_view(), name='export-students-csv'),
    path('export-students-pdf/', StudentExportPdfView.as_view(), name='export-students-pdf'),
    path('bulk-enroll/', BulkStudentEnrollmentView.as_view(), name='bulk-student-enroll'),
    path('analytics/', SystemAnalyticsView.as_view(), name='system-analytics'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('create/', AdminUserCreateView.as_view(), name='admin-user-create'),
    path('list-all/', UserListView.as_view(), name='user-list'),
    path('my-students/', InstructorStudentListView.as_view(), name='instructor-students'),
    path('update/<int:pk>/', AdminUserUpdateView.as_view(), name='admin-user-update'),
    path('delete/<int:pk>/', AdminUserDeleteView.as_view(), name='admin-user-delete'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password_reset_request'),
    path('password-reset/confirm/', PasswordResetConfirmView.as_view(), name='password_reset_confirm'),
]
