from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Assessment

@receiver(post_save, sender=Assessment)
def update_portfolio_status(sender, instance, created, **kwargs):
    if kwargs.get('raw'):
        return
    if created:
        portfolio = instance.portfolio
        if instance.is_redo_request:
            portfolio.status = 'REDO'
        else:
            portfolio.status = 'EVALUATED'
        portfolio.save()
