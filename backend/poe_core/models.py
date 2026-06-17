from django.db import models
from django.conf import settings

class Portfolio(models.Model):
    STATUS_CHOICES = (
        ('DRAFT', 'Draft'),
        ('SUBMITTED', 'Submitted'),
        ('EVALUATED', 'Evaluated'),
        ('REDO', 'Redo Required'),
    )
    
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    learner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='portfolios')
    unit = models.ForeignKey('academic.Unit', on_delete=models.CASCADE, related_name='portfolios', null=True, blank=True)
    element = models.ForeignKey('academic.Element', on_delete=models.CASCADE, related_name='portfolios', null=True, blank=True)
    assessment_type = models.CharField(
        max_length=50,
        choices=(
            ('PRACTICAL', 'Practical Assessments'),
            ('ORAL', 'Oral Assessments'),
            ('WRITTEN', 'Written Assessments'),
            ('ASSIGNMENT', 'Assignments'),
            ('SUPERVISED', 'Supervised Assessments'),
        ),
        default='PRACTICAL'
    )
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='DRAFT')
    submission_round = models.IntegerField(default=1)
    verification_status = models.CharField(
        max_length=20,
        choices=(
            ('PENDING', 'Pending Audit'),
            ('VERIFIED', 'Verified'),
            ('REJECTED', 'Rejected'),
        ),
        default='PENDING'
    )
    verifier = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='verified_portfolios')
    verified_at = models.DateTimeField(null=True, blank=True)
    verification_feedback = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if self.id:
            try:
                original = Portfolio.objects.get(pk=self.pk)
                if original.status != 'REDO' and self.status == 'REDO':
                    if self.submission_round <= original.submission_round:
                        self.submission_round = original.submission_round + 1
                elif self.status == 'REDO':
                    self.submission_round = max(self.submission_round, original.submission_round)
                else:
                    self.submission_round = original.submission_round
            except Portfolio.DoesNotExist:
                pass
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title

class Evidence(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='evidence')
    file = models.FileField(upload_to='evidence/')
    description = models.TextField(blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    submission_round = models.IntegerField(default=1)
    file_hash = models.CharField(max_length=64, blank=True, db_index=True)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order', 'id']

    def save(self, *args, **kwargs):
        if not self.id and self.portfolio:
            self.submission_round = self.portfolio.submission_round
            
        # Calculate SHA-256 hash of the file if not already set
        if self.file and not self.file_hash:
            import hashlib
            hasher = hashlib.sha256()
            try:
                if hasattr(self.file, 'chunks'):
                    for chunk in self.file.chunks():
                        hasher.update(chunk)
                else:
                    self.file.seek(0)
                    for chunk in iter(lambda: self.file.read(4096), b""):
                        hasher.update(chunk)
            except Exception:
                pass
            self.file_hash = hasher.hexdigest()
            
        super().save(*args, **kwargs)
        
        # Check for duplicates from other students
        if self.file_hash:
            duplicates = Evidence.objects.filter(file_hash=self.file_hash).exclude(id=self.id)
            other_student_duplicates = duplicates.exclude(portfolio__learner=self.portfolio.learner)
            for dup in other_student_duplicates:
                PlagiarismFlag.objects.get_or_create(evidence=self, duplicate_of=dup)
                PlagiarismFlag.objects.get_or_create(evidence=dup, duplicate_of=self)

    def __str__(self):
        return f"Evidence for {self.portfolio.title}"

class Assessment(models.Model):
    portfolio = models.OneToOneField(Portfolio, on_delete=models.CASCADE, related_name='assessment')
    assessor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assessments')
    grade = models.CharField(max_length=50)
    feedback = models.TextField(blank=True)
    is_redo_request = models.BooleanField(default=False)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Assessment for {self.portfolio.title}"

class Comment(models.Model):
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.user.username} on {self.portfolio.title}"

class PlagiarismFlag(models.Model):
    evidence = models.ForeignKey(Evidence, on_delete=models.CASCADE, related_name='plagiarism_flags')
    duplicate_of = models.ForeignKey(Evidence, on_delete=models.CASCADE, related_name='duplicates')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('evidence', 'duplicate_of')

    def __str__(self):
        return f"Plagiarism Flag: {self.evidence.id} duplicate of {self.duplicate_of.id}"

class ActivityLog(models.Model):
    EVENT_CHOICES = (
        ('CREATED', 'Portfolio Created'),
        ('SUBMITTED', 'Portfolio Submitted'),
        ('EVALUATED', 'Portfolio Evaluated'),
        ('REDO_REQUESTED', 'Redo Requested'),
        ('EVIDENCE_ADDED', 'Evidence Uploaded'),
        ('EVIDENCE_DELETED', 'Evidence Deleted'),
        ('VERIFIED', 'CDACC Verified'),
        ('REJECTED', 'CDACC Rejected'),
    )
    portfolio = models.ForeignKey(Portfolio, on_delete=models.CASCADE, related_name='logs')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    event_type = models.CharField(max_length=20, choices=EVENT_CHOICES)
    description = models.TextField()
    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.event_type} on {self.portfolio.title} by {self.user.username}"

class AssessmentCriterionScore(models.Model):
    assessment = models.ForeignKey(Assessment, on_delete=models.CASCADE, related_name='criterion_scores')
    criterion = models.ForeignKey('academic.RubricCriterion', on_delete=models.CASCADE)
    is_satisfied = models.BooleanField(default=False)

    class Meta:
        unique_together = ('assessment', 'criterion')

    def __str__(self):
        return f"{self.assessment.portfolio.title} - {self.criterion.description[:20]} - {'Satisfied' if self.is_satisfied else 'Not Satisfied'}"
