from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import HttpResponse
from .models import Portfolio, Evidence, Assessment, Comment, ActivityLog, AssessmentCriterionScore, PlagiarismFlag
from .serializers import PortfolioSerializer, EvidenceSerializer, AssessmentSerializer, CommentSerializer
from .utils import generate_portfolio_pdf

class CommentViewSet(viewsets.ModelViewSet):
    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        user = self.request.user
        portfolio_id = self.request.query_params.get('portfolio')
        
        queryset = Comment.objects.all()
        if portfolio_id:
            queryset = queryset.filter(portfolio_id=portfolio_id)
            
        if user.role == 'STUDENT':
            return queryset.filter(portfolio__learner=user)
        if user.role == 'INSTRUCTOR':
            return queryset.filter(portfolio__unit__instructors=user)
        return queryset

class IsStudent(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role == 'STUDENT'

class CanEvaluate(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.role in ['INSTRUCTOR', 'MANAGER', 'DIRECTOR', 'CDACC', 'ADMIN']

class CanManagePortfolio(permissions.BasePermission):
    message = "Cannot modify a locked portfolio or its evidence."

    def has_permission(self, request, view):
        user = request.user
        
        # Check locking for creating evidence
        if request.method == 'POST' and view.__class__.__name__ == 'EvidenceViewSet':
            portfolio_id = request.data.get('portfolio')
            if portfolio_id:
                try:
                    portfolio = Portfolio.objects.get(id=portfolio_id)
                    if portfolio.verification_status == 'VERIFIED':
                        self.message = "This portfolio has been verified by CDACC and is permanently locked."
                        return False
                    if user.role == 'STUDENT' and portfolio.status in ['SUBMITTED', 'EVALUATED']:
                        self.message = "Cannot add evidence to a locked portfolio."
                        return False
                except Portfolio.DoesNotExist:
                    pass

        if user.role == 'STUDENT':
            return True
        if user.role == 'INSTRUCTOR':
            if request.method == 'POST':
                unit_id = request.data.get('unit')
                return user.assigned_units.filter(id=unit_id).exists()
            return True
        return user.role in ['ADMIN', 'MANAGER', 'DIRECTOR', 'CDACC']

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Resolve portfolio if obj is Evidence
        portfolio = obj.portfolio if hasattr(obj, 'portfolio') else obj
        
        # Verified portfolio lock (applies to everyone, even instructors/admins)
        if portfolio.verification_status == 'VERIFIED' and request.method not in permissions.SAFE_METHODS:
            self.message = "This portfolio has been verified by CDACC and is permanently locked."
            return False
            
        if request.method == 'DELETE':
            if portfolio.status != 'DRAFT':
                self.message = "Only draft portfolios can be deleted."
                return False
            if user.role == 'STUDENT':
                return portfolio.learner == user
            if user.role == 'INSTRUCTOR':
                return portfolio.unit.instructors.filter(id=user.id).exists()
            return user.role in ['ADMIN', 'MANAGER', 'DIRECTOR']
            
        if user.role == 'STUDENT':
            # Check locking for write requests
            if request.method not in permissions.SAFE_METHODS:
                if portfolio.status in ['SUBMITTED', 'EVALUATED']:
                    self.message = "Cannot modify a locked portfolio or its evidence."
                    return False
            return portfolio.learner == user
        if user.role == 'INSTRUCTOR':
            return portfolio.unit.instructors.filter(id=user.id).exists()
        return user.role in ['ADMIN', 'MANAGER', 'DIRECTOR', 'CDACC']

class PortfolioViewSet(viewsets.ModelViewSet):
    queryset = Portfolio.objects.all()
    serializer_class = PortfolioSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [permissions.IsAuthenticated(), CanManagePortfolio()]
        return [permissions.IsAuthenticated()]

    def perform_create(self, serializer):
        element_id = self.request.data.get('element')
        unit_id = self.request.data.get('unit')
        
        if element_id and not unit_id:
            from academic.models import Element
            try:
                element = Element.objects.get(id=element_id)
                unit_id = element.unit_id
            except Element.DoesNotExist:
                pass

        extra_kwargs = {}
        if unit_id:
            extra_kwargs['unit_id'] = unit_id

        if self.request.user.role == 'INSTRUCTOR':
            # Instructor must specify a learner
            learner_id = self.request.data.get('learner')
            portfolio = serializer.save(learner_id=learner_id, **extra_kwargs)
        else:
            portfolio = serializer.save(learner=self.request.user, **extra_kwargs)
            
        # Log event
        ActivityLog.objects.create(
            portfolio=portfolio,
            user=self.request.user,
            event_type='CREATED',
            description=f"Portfolio created for unit {portfolio.unit.name if portfolio.unit else 'N/A'}."
        )

    def perform_update(self, serializer):
        original_status = self.get_object().status
        portfolio = serializer.save()
        
        if original_status != 'SUBMITTED' and portfolio.status == 'SUBMITTED':
            # Log event
            ActivityLog.objects.create(
                portfolio=portfolio,
                user=self.request.user,
                event_type='SUBMITTED',
                description="Portfolio submitted for evaluation."
            )
            # Send email to instructor
            try:
                from django.core.mail import send_mail
                instructors = portfolio.unit.instructors.all()
                emails = [inst.email for inst in instructors if inst.email]
                if emails:
                    send_mail(
                        subject=f"New Portfolio Submission: {portfolio.title}",
                        message=f"{portfolio.learner.get_full_name()} has submitted a portfolio for {portfolio.unit.code}: {portfolio.unit.name}.\nLog in to grade it.",
                        from_email="noreply@headwaycollege.ac.ke",
                        recipient_list=emails,
                        fail_silently=True
                    )
            except Exception:
                pass

    def get_queryset(self):
        user = self.request.user
        queryset = Portfolio.objects.all()
        
        # Filter by role
        if user.role == 'STUDENT':
            queryset = queryset.filter(learner=user)
        elif user.role == 'INSTRUCTOR':
            # Instructors only see portfolios for units they are assigned to
            queryset = queryset.filter(unit__instructors=user)
        # ADMIN, MANAGER, DIRECTOR, CDACC see all
            


        # Optional filters
        status_filter = self.request.query_params.get('status')
        unit_id = self.request.query_params.get('unit')
        
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        if unit_id:
            queryset = queryset.filter(unit_id=unit_id)
            
        return queryset

    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        portfolio = self.get_object()
        buffer = generate_portfolio_pdf(portfolio, user=request.user)
        
        reg_no = portfolio.learner.registration_number or "N/A"
        filename = f"{reg_no}_Portfolio.pdf".replace("/", "_") # Sanitize filename
        
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def verify(self, request, pk=None):
        user = request.user
        if user.role not in ['CDACC', 'ADMIN']:
            return Response({"detail": "Not authorized to verify portfolios."}, status=403)
            
        portfolio = self.get_object()
        if portfolio.status != 'EVALUATED':
            return Response({"detail": "Only evaluated portfolios can be audited/verified by CDACC."}, status=400)
            
        v_status = request.data.get('status') # 'VERIFIED' or 'REJECTED'
        feedback = request.data.get('feedback', '')
        
        if v_status not in ['VERIFIED', 'REJECTED']:
            return Response({"detail": "Invalid verification status. Must be VERIFIED or REJECTED."}, status=400)
            
        portfolio.verification_status = v_status
        portfolio.verifier = user
        import django.utils.timezone
        portfolio.verified_at = django.utils.timezone.now()
        portfolio.verification_feedback = feedback
        portfolio.save()
        
        # Log event
        ActivityLog.objects.create(
            portfolio=portfolio,
            user=user,
            event_type='VERIFIED' if v_status == 'VERIFIED' else 'REJECTED',
            description=f"CDACC auditor verified the portfolio. Decision: {v_status}. Feedback: {feedback}"
        )
        
        # Send email to student
        try:
            from django.core.mail import send_mail
            if portfolio.learner.email:
                send_mail(
                    subject=f"Portfolio Verification Audit Result: {portfolio.title}",
                    message=f"Hi {portfolio.learner.username},\nYour portfolio for {portfolio.unit.code} has been audited by CDACC verifier {user.username}.\nAudit Status: {portfolio.get_verification_status_display()}\nFeedback: {feedback}",
                    from_email="noreply@headwaycollege.ac.ke",
                    recipient_list=[portfolio.learner.email],
                    fail_silently=True
                )
        except Exception:
            pass
            
        return Response(PortfolioSerializer(portfolio, context={'request': request}).data)

class EvidenceViewSet(viewsets.ModelViewSet):
    queryset = Evidence.objects.all()
    serializer_class = EvidenceSerializer
    permission_classes = [permissions.IsAuthenticated, CanManagePortfolio]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return Evidence.objects.filter(portfolio__learner=user)
        if user.role == 'INSTRUCTOR':
            return Evidence.objects.filter(portfolio__unit__instructors=user)
        return Evidence.objects.all()

    def perform_create(self, serializer):
        evidence = serializer.save()
        # Log event
        ActivityLog.objects.create(
            portfolio=evidence.portfolio,
            user=self.request.user,
            event_type='EVIDENCE_ADDED',
            description=f"Evidence file uploaded: {evidence.file.name.split('/')[-1]}."
        )

    def destroy(self, request, *args, **kwargs):
        evidence = self.get_object()
        portfolio = evidence.portfolio
        filename = evidence.file.name.split('/')[-1]
        
        response = super().destroy(request, *args, **kwargs)
        
        # Log event
        ActivityLog.objects.create(
            portfolio=portfolio,
            user=request.user,
            event_type='EVIDENCE_DELETED',
            description=f"Evidence file deleted: {filename}."
        )
        return response

class AssessmentViewSet(viewsets.ModelViewSet):
    queryset = Assessment.objects.all()
    serializer_class = AssessmentSerializer
    permission_classes = [permissions.IsAuthenticated, CanEvaluate]

    def create(self, request, *args, **kwargs):
        portfolio_id = request.data.get('portfolio')
        try:
            portfolio = Portfolio.objects.get(id=portfolio_id)
        except Portfolio.DoesNotExist:
            return Response({"detail": "Portfolio not found."}, status=status.HTTP_404_NOT_FOUND)

        # Validation: Only submitted portfolios can be evaluated
        if portfolio.status != 'SUBMITTED':
            return Response({"detail": "Only portfolios in 'SUBMITTED' status can be evaluated."}, status=status.HTTP_400_BAD_REQUEST)

        # Process rubric scores
        criterion_scores = request.data.get('criterion_scores', [])
        is_redo = request.data.get('is_redo_request', False)
        
        # Enforce that all critical rubric criteria must be checked/satisfied
        from academic.models import RubricCriterion
        unsatisfied_critical = []
        for cs in criterion_scores:
            c_id = cs.get('criterion')
            is_sat = cs.get('is_satisfied', False)
            if not is_sat:
                try:
                    crit = RubricCriterion.objects.get(id=c_id)
                    if crit.is_critical:
                        unsatisfied_critical.append(crit)
                except RubricCriterion.DoesNotExist:
                    pass
                    
        # Force REDO status if any critical criteria are failed
        if unsatisfied_critical:
            is_redo = True

        existing_assessment = Assessment.objects.filter(portfolio=portfolio).first()
        
        if existing_assessment:
            # Delete old score records
            AssessmentCriterionScore.objects.filter(assessment=existing_assessment).delete()
            serializer = self.get_serializer(existing_assessment, data=request.data, partial=True)
        else:
            serializer = self.get_serializer(data=request.data)
            
        serializer.is_valid(raise_exception=True)
        assessment = serializer.save(assessor=self.request.user)
        
        # Save new score records
        for cs in criterion_scores:
            c_id = cs.get('criterion')
            is_sat = cs.get('is_satisfied', False)
            AssessmentCriterionScore.objects.create(
                assessment=assessment,
                criterion_id=c_id,
                is_satisfied=is_sat
            )
        
        # Update portfolio status
        if is_redo:
            portfolio.status = 'REDO'
        else:
            portfolio.status = 'EVALUATED'
        portfolio.save()
        
        # Log event
        ActivityLog.objects.create(
            portfolio=portfolio,
            user=self.request.user,
            event_type='REDO_REQUESTED' if is_redo else 'EVALUATED',
            description=f"Portfolio evaluated. Status: {portfolio.get_status_display()}. Grade: {assessment.grade}. Feedback: {assessment.feedback}"
        )
        
        # Send email to student
        try:
            from django.core.mail import send_mail
            if portfolio.learner.email:
                send_mail(
                    subject=f"Portfolio Evaluated: {portfolio.title}",
                    message=f"Hi {portfolio.learner.username},\nYour portfolio for {portfolio.unit.code} has been evaluated by {self.request.user.username}.\nStatus: {portfolio.get_status_display()}\nGrade: {assessment.grade}\nFeedback: {assessment.feedback}",
                    from_email="noreply@headwaycollege.ac.ke",
                    recipient_list=[portfolio.learner.email],
                    fail_silently=True
                )
        except Exception:
            pass
        
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def perform_create(self, serializer):
        serializer.save(assessor=self.request.user)


from rest_framework.views import APIView
from django.db.models import Avg
from django.contrib.auth import get_user_model
from academic.models import Course, CourseSession

class CohortAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if request.user.role not in ['ADMIN', 'MANAGER', 'DIRECTOR']:
            return Response({"detail": "Not authorized to view analytics."}, status=403)

        User = get_user_model()
        cohorts_data = []
        courses = Course.objects.all()
        intakes = ['JANUARY', 'MAY', 'SEPTEMBER']
        
        for course in courses:
            for intake in intakes:
                students = User.objects.filter(role='STUDENT', course=course, intake=intake)
                total_students = students.count()
                if total_students == 0:
                    continue
                
                # Portfolios for students in this cohort
                portfolios = Portfolio.objects.filter(learner__in=students)
                total_portfolios = portfolios.count()
                evaluated_portfolios = portfolios.filter(status='EVALUATED').count()
                
                completion_rate = round((evaluated_portfolios / total_portfolios * 100), 2) if total_portfolios > 0 else 0
                
                # Average submission rounds for this cohort
                avg_rounds = portfolios.aggregate(Avg('submission_round'))['submission_round__avg']
                avg_rounds = round(avg_rounds, 2) if avg_rounds else 1.00
                
                cohorts_data.append({
                    'course_id': course.id,
                    'course_name': course.name,
                    'intake': intake,
                    'intake_display': dict(User.Intake.choices).get(intake, intake),
                    'total_students': total_students,
                    'total_portfolios': total_portfolios,
                    'evaluated_portfolios': evaluated_portfolios,
                    'completion_rate': completion_rate,
                    'avg_rounds': avg_rounds
                })

        # 2. Average submission rounds overall
        overall_avg_rounds = Portfolio.objects.all().aggregate(Avg('submission_round'))['submission_round__avg']
        overall_avg_rounds = round(overall_avg_rounds, 2) if overall_avg_rounds else 1.00

        # 3. At-risk student list (zero submissions in active semesters)
        active_semesters = CourseSession.objects.filter(is_active=True).values_list('semester_id', flat=True)
        active_students = User.objects.filter(role='STUDENT', semester__in=active_semesters)
        
        at_risk_students = []
        for student in active_students:
            portfolio_submissions_count = Portfolio.objects.filter(
                learner=student, 
                unit__semester=student.semester
            ).exclude(status='DRAFT').count()
            
            if portfolio_submissions_count == 0:
                at_risk_students.append({
                    'id': student.id,
                    'username': student.username,
                    'full_name': student.get_full_name(),
                    'course_name': student.course.name if student.course else 'N/A',
                    'intake': dict(User.Intake.choices).get(student.intake, student.intake) if student.intake else 'N/A',
                    'semester_name': student.semester.name if student.semester else 'N/A'
                })

        return Response({
            'cohorts': cohorts_data,
            'overall_avg_rounds': overall_avg_rounds,
            'at_risk_students': at_risk_students
        })
