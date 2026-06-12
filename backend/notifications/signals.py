from django.db.models.signals import post_save
from django.dispatch import receiver
from poe_core.models import Portfolio, Assessment, Evidence, Comment
from .models import Notification

@receiver(post_save, sender=Comment)
def comment_notification(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created:
        portfolio = instance.portfolio
        # If student commented, notify instructors
        if instance.user == portfolio.learner:
            if portfolio.unit:
                instructors = portfolio.unit.instructors.all()
                for instructor in instructors:
                    Notification.objects.create(
                        user=instructor,
                        title="New Comment on Portfolio",
                        message=f"{instance.user.get_full_name()} commented on '{portfolio.title}'.",
                        notification_type=Notification.NotificationType.STATUS_CHANGE,
                        target_url=f"/evaluation/{portfolio.id}",
                        action_text="Read Comment"
                    )
        # If anyone else (instructor/admin) commented, notify student
        else:
            Notification.objects.create(
                user=portfolio.learner,
                title="New Feedback/Comment",
                message=f"{instance.user.get_full_name()} commented on your portfolio '{portfolio.title}'.",
                notification_type=Notification.NotificationType.STATUS_CHANGE,
                target_url=f"/portfolios/{portfolio.id}",
                action_text="Read Comment"
            )

@receiver(post_save, sender=Portfolio)
def portfolio_status_notification(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if not created:
        # Student Notifications
        if instance.status == 'SUBMITTED':
            Notification.objects.get_or_create(
                user=instance.learner,
                title="Portfolio Submitted",
                message=f"Your portfolio '{instance.title}' has been submitted for evaluation.",
                notification_type=Notification.NotificationType.STATUS_CHANGE,
                target_url=f"/portfolios/{instance.id}",
                action_text="View Portfolio"
            )
            # Notify all instructors for this unit
            if instance.unit:
                instructors = instance.unit.instructors.all()
                for instructor in instructors:
                    Notification.objects.create(
                        user=instructor,
                        title="New Portfolio Submission",
                        message=f"{instance.learner.get_full_name()} has submitted a portfolio for {instance.unit.name}.",
                        notification_type=Notification.NotificationType.SUBMISSION,
                        target_url=f"/evaluation/{instance.id}",
                        action_text="Review Portfolio"
                    )
        elif instance.status == 'EVALUATED':
            Notification.objects.get_or_create(
                user=instance.learner,
                title="Portfolio Evaluated",
                message=f"Your portfolio '{instance.title}' has been evaluated. Check your grade and feedback.",
                notification_type=Notification.NotificationType.STATUS_CHANGE,
                target_url=f"/portfolios/{instance.id}",
                action_text="View Feedback"
            )
        elif instance.status == 'REDO':
            Notification.objects.get_or_create(
                user=instance.learner,
                title="Redo Required",
                message=f"Instructor has requested a redo for your portfolio '{instance.title}'. Please check feedback.",
                notification_type=Notification.NotificationType.GRADE_ASSIGNED,
                target_url=f"/portfolios/{instance.id}",
                action_text="Fix Portfolio"
            )

@receiver(post_save, sender=Assessment)
def assessment_notification(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created:
        Notification.objects.create(
            user=instance.portfolio.learner,
            title="Grade Assigned",
            message=f"You have received a grade for '{instance.portfolio.title}': {instance.grade}.",
            notification_type=Notification.NotificationType.GRADE_ASSIGNED,
            target_url=f"/portfolios/{instance.portfolio.id}",
            action_text="View Grade"
        )

@receiver(post_save, sender=Evidence)
def evidence_updated_notification(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created:
        portfolio = instance.portfolio
        if portfolio.status in ['SUBMITTED', 'REDO']:
            # Notify all instructors for this unit
            if portfolio.unit:
                instructors = portfolio.unit.instructors.all()
                for instructor in instructors:
                    Notification.objects.create(
                        user=instructor,
                        title="Portfolio Updated",
                        message=f"{portfolio.learner.get_full_name()} has updated evidence for '{portfolio.title}'.",
                        notification_type=Notification.NotificationType.SUBMISSION,
                        target_url=f"/evaluation/{portfolio.id}",
                        action_text="Review Update"
                    )
