from django.db import models
from django.conf import settings

class Notification(models.Model):
    class NotificationType(models.TextChoices):
        STATUS_CHANGE = 'STATUS_CHANGE', 'Status Change'
        GRADE_ASSIGNED = 'GRADE_ASSIGNED', 'Grade Assigned'
        SUBMISSION = 'SUBMISSION', 'New Submission'
        SYSTEM_ALERT = 'SYSTEM_ALERT', 'System Alert'

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    notification_type = models.CharField(
        max_length=20,
        choices=NotificationType.choices,
        default=NotificationType.SYSTEM_ALERT
    )
    is_read = models.BooleanField(default=False)
    target_url = models.CharField(max_length=255, null=True, blank=True)
    action_text = models.CharField(max_length=50, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} for {self.user.username}"
