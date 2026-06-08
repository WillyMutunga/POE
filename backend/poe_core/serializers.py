from rest_framework import serializers
from .models import Portfolio, Evidence, Assessment, Comment, PlagiarismFlag, ActivityLog, AssessmentCriterionScore

class PlagiarismFlagSerializer(serializers.ModelSerializer):
    duplicate_of_student = serializers.ReadOnlyField(source='duplicate_of.portfolio.learner.username')
    duplicate_of_portfolio = serializers.ReadOnlyField(source='duplicate_of.portfolio.title')
    duplicate_of_portfolio_id = serializers.ReadOnlyField(source='duplicate_of.portfolio.id')
    duplicate_of_file_url = serializers.SerializerMethodField()

    class Meta:
        model = PlagiarismFlag
        fields = (
            'id', 'evidence', 'duplicate_of', 'duplicate_of_student', 
            'duplicate_of_portfolio', 'duplicate_of_portfolio_id', 'duplicate_of_file_url', 'created_at'
        )

    def get_duplicate_of_file_url(self, obj):
        if obj.duplicate_of and obj.duplicate_of.file:
            return obj.duplicate_of.file.url
        return None

class EvidenceSerializer(serializers.ModelSerializer):
    plagiarism_flags = PlagiarismFlagSerializer(many=True, read_only=True)

    class Meta:
        model = Evidence
        fields = ('id', 'portfolio', 'file', 'description', 'uploaded_at', 'submission_round', 'file_hash', 'plagiarism_flags')

class AssessmentCriterionScoreSerializer(serializers.ModelSerializer):
    criterion_description = serializers.ReadOnlyField(source='criterion.description')
    is_critical = serializers.ReadOnlyField(source='criterion.is_critical')

    class Meta:
        model = AssessmentCriterionScore
        fields = ('id', 'assessment', 'criterion', 'criterion_description', 'is_critical', 'is_satisfied')

class AssessmentSerializer(serializers.ModelSerializer):
    assessor_name = serializers.ReadOnlyField(source='assessor.username')
    criterion_scores = AssessmentCriterionScoreSerializer(many=True, read_only=True)

    class Meta:
        model = Assessment
        fields = ('id', 'portfolio', 'assessor', 'assessor_name', 'grade', 'feedback', 'is_redo_request', 'date', 'criterion_scores')
        read_only_fields = ('assessor',)

class CommentSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_role = serializers.ReadOnlyField(source='user.role')

    class Meta:
        model = Comment
        fields = ('id', 'portfolio', 'user', 'user_name', 'user_role', 'message', 'created_at')
        read_only_fields = ('user',)

class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.username')
    user_role = serializers.ReadOnlyField(source='user.role')
    event_type_display = serializers.CharField(source='get_event_type_display', read_only=True)

    class Meta:
        model = ActivityLog
        fields = ('id', 'portfolio', 'user', 'user_name', 'user_role', 'event_type', 'event_type_display', 'description', 'timestamp')

class PortfolioSerializer(serializers.ModelSerializer):
    learner_display = serializers.ReadOnlyField(source='learner.username')
    learner_registration_number = serializers.ReadOnlyField(source='learner.registration_number')
    unit_display = serializers.ReadOnlyField(source='unit.name')
    element_display = serializers.SerializerMethodField()
    element_number = serializers.SerializerMethodField()
    assessment_type_display = serializers.CharField(source='get_assessment_type_display', read_only=True)
    evidence_count = serializers.SerializerMethodField()
    evidence = serializers.SerializerMethodField()
    assessment = AssessmentSerializer(read_only=True)
    comments = CommentSerializer(many=True, read_only=True)
    verifier_name = serializers.ReadOnlyField(source='verifier.username')
    logs = ActivityLogSerializer(many=True, read_only=True)
    plagiarism_count = serializers.SerializerMethodField()

    class Meta:
        model = Portfolio
        fields = (
            'id', 'title', 'description', 'learner', 'learner_display', 
            'learner_registration_number', 'unit', 'unit_display', 
            'element', 'element_display', 'element_number', 'assessment_type', 'assessment_type_display', 
            'status', 'submission_round', 'evidence', 'evidence_count', 'assessment', 
            'comments', 'verification_status', 'verifier', 'verifier_name', 'verified_at', 
            'verification_feedback', 'logs', 'plagiarism_count', 'created_at', 'updated_at'
        )
        read_only_fields = ('learner',)

    def get_element_display(self, obj):
        if obj.unit and obj.element:
            elements = list(obj.unit.elements.all().order_by('id'))
            try:
                index = elements.index(obj.element) + 1
                return f"Element {index}: {obj.element.name}"
            except ValueError:
                return obj.element.name
        return obj.element.name if obj.element else None

    def get_element_number(self, obj):
        if obj.unit and obj.element:
            elements = list(obj.unit.elements.all().order_by('id'))
            try:
                return elements.index(obj.element) + 1
            except ValueError:
                return None
        return None

    def get_evidence(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        
        if user and user.role in ['STUDENT', 'INSTRUCTOR']:
            queryset = obj.evidence.all()
        else:
            queryset = obj.evidence.filter(submission_round=obj.submission_round)
            
        return EvidenceSerializer(queryset, many=True, read_only=True, context=self.context).data

    def get_evidence_count(self, obj):
        request = self.context.get('request')
        user = request.user if request else None
        
        if user and user.role in ['STUDENT', 'INSTRUCTOR']:
            return obj.evidence.count()
        else:
            return obj.evidence.filter(submission_round=obj.submission_round).count()

    def get_plagiarism_count(self, obj):
        return PlagiarismFlag.objects.filter(evidence__portfolio=obj).count()
