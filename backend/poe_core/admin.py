from django.contrib import admin
from .models import Portfolio, Evidence, Assessment

@admin.register(Portfolio)
class PortfolioAdmin(admin.ModelAdmin):
    list_display = ('title', 'learner', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('title', 'learner__username')

@admin.register(Evidence)
class EvidenceAdmin(admin.ModelAdmin):
    list_display = ('portfolio', 'file', 'uploaded_at')

@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('portfolio', 'assessor', 'grade', 'date')
