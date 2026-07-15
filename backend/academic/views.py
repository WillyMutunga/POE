from django.db import models
from django.db.models import Count
from rest_framework import viewsets, permissions
from .models import School, Course, Semester, Unit, Element, CourseSession, Rubric, UnitRegistration, GradingSystem, GradeRange, UnitMarkComponent, StudentMark, ExamRepository
from .serializers import SchoolSerializer, CourseSerializer, SemesterSerializer, UnitSerializer, ElementSerializer, CourseSessionSerializer, RubricSerializer, UnitRegistrationSerializer, GradingSystemSerializer, GradeRangeSerializer, UnitMarkComponentSerializer, StudentMarkSerializer, ExamRepositorySerializer

def get_student_current_semester(student):
    if student.semester:
        return student.semester
    from .models import UnitRegistration
    regs = UnitRegistration.objects.filter(student=student, status='APPROVED').select_related('semester')
    if regs.exists():
        semesters = list(set(r.semester for r in regs if r.semester))
        if semesters:
            from .serializers import semester_sort_key
            semesters.sort(key=lambda s: semester_sort_key(s.name))
            return semesters[-1]
    return None
class SchoolViewSet(viewsets.ModelViewSet):
    queryset = School.objects.annotate(
        student_count=Count('courses__students')
    ).order_by('-student_count', 'name')
    serializer_class = SchoolSerializer
    permission_classes = [permissions.IsAuthenticated]

import csv
from django.http import HttpResponse
from rest_framework.decorators import action

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        queryset = Course.objects.annotate(
            student_count=Count('students')
        ).order_by('-student_count', 'name')
        level = self.request.query_params.get('level')
        if level:
            queryset = queryset.filter(level=level)
        return queryset

    @action(detail=True, methods=['get'])
    def export_units(self, request, pk=None):
        from .serializers import semester_sort_key
        course = self.get_object()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{course.name}_units.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Semester', 'Unit Code', 'Unit Name'])
        
        # Unassigned units first
        unassigned = course.units.filter(semester__isnull=True).order_by('name')
        first = True
        for unit in unassigned:
            writer.writerow(['Unassigned' if first else '', unit.code, unit.name])
            first = False
            
        # Units by semester (sorted naturally)
        semesters = list(course.semesters.all())
        semesters.sort(key=lambda s: semester_sort_key(s.name))
        
        for semester in semesters:
            first = True
            for unit in semester.units.all().order_by('name'):
                writer.writerow([semester.name if first else '', unit.code, unit.name])
                first = False
                
        return response

    @action(detail=True, methods=['get'])
    def export_students(self, request, pk=None):
        course = self.get_object()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{course.name}_students.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Registration Number', 'Full Name', 'Email', 'Semester', 'Intake'])
        
        for student in course.students.filter(role='STUDENT'):
            writer.writerow([
                student.registration_number,
                student.get_full_name(),
                student.email,
                student.semester.name if student.semester else 'N/A',
                student.get_intake_display() if student.intake else 'N/A'
            ])
            
        return response

    @action(detail=True, methods=['get'])
    def export_units_pdf(self, request, pk=None):
        from utils.pdf_utils import generate_pdf_report
        from .serializers import semester_sort_key
        course = self.get_object()
        headers = ['Semester', 'Unit Code', 'Unit Name']
        data = []
        
        # Unassigned units first
        unassigned = course.units.filter(semester__isnull=True).order_by('name')
        first = True
        for unit in unassigned:
            data.append(['Unassigned' if first else '', unit.code, unit.name])
            first = False
            
        # Units by semester (sorted naturally)
        semesters = list(course.semesters.all())
        semesters.sort(key=lambda s: semester_sort_key(s.name))
        
        for semester in semesters:
            first = True
            for unit in semester.units.all().order_by('name'):
                data.append([semester.name if first else '', unit.code, unit.name])
                first = False
                
        pdf_content = generate_pdf_report(
            f"{course.name} - Academic Structure",
            f"Institutional Academic Units and Semesters",
            headers,
            data,
            f"{course.name}_structure.pdf"
        )
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{course.name}_structure.pdf"'
        response.write(pdf_content)
        return response

    @action(detail=True, methods=['get'])
    def export_students_pdf(self, request, pk=None):
        from utils.pdf_utils import generate_pdf_report
        course = self.get_object()
        headers = ['Reg No.', 'Full Name', 'Email', 'Semester', 'Intake']
        data = []
        
        for student in course.students.filter(role='STUDENT'):
            data.append([
                student.registration_number or 'N/A',
                student.get_full_name(),
                student.email,
                student.semester.name if student.semester else 'N/A',
                student.get_intake_display() if student.intake else 'N/A'
            ])
            
        pdf_content = generate_pdf_report(
            f"{course.name} - Registered Learners",
            f"Comprehensive list of students enrolled in {course.name}",
            headers,
            data,
            f"{course.name}_students.pdf"
        )
        
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{course.name}_students.pdf"'
        response.write(pdf_content)
        return response

    @action(detail=True, methods=['get'])
    def export_comprehensive_structure(self, request, pk=None):
        from .serializers import semester_sort_key
        course = self.get_object()
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="{course.name}_comprehensive_structure.csv"'
        
        writer = csv.writer(response)
        writer.writerow(['Semester', 'Unit Code', 'Unit Name', 'Element Number', 'Element Name'])
        
        # Unassigned units first
        unassigned = course.units.filter(semester__isnull=True).order_by('name')
        first_sem = True
        for unit in unassigned:
            first_unit = True
            elements = unit.elements.all().order_by('id')
            if not elements.exists():
                sem_val = 'Unassigned' if first_sem else ''
                unit_code = unit.code if first_unit else ''
                unit_name = unit.name if first_unit else ''
                writer.writerow([sem_val, unit_code, unit_name, 'N/A', 'No elements defined'])
                first_sem = False
            else:
                for idx, element in enumerate(elements, 1):
                    sem_val = 'Unassigned' if (first_sem and first_unit) else ''
                    unit_code = unit.code if first_unit else ''
                    unit_name = unit.name if first_unit else ''
                    writer.writerow([sem_val, unit_code, unit_name, f"Element {idx}", element.name])
                    first_sem = False
                    first_unit = False
            
        # Units by semester (sorted naturally)
        semesters = list(course.semesters.all())
        semesters.sort(key=lambda s: semester_sort_key(s.name))
        
        for semester in semesters:
            first_sem = True
            for unit in semester.units.all().order_by('name'):
                first_unit = True
                elements = unit.elements.all().order_by('id')
                if not elements.exists():
                    sem_val = semester.name if first_sem else ''
                    unit_code = unit.code if first_unit else ''
                    unit_name = unit.name if first_unit else ''
                    writer.writerow([sem_val, unit_code, unit_name, 'N/A', 'No elements defined'])
                    first_sem = False
                else:
                    for idx, element in enumerate(elements, 1):
                        sem_val = semester.name if (first_sem and first_unit) else ''
                        unit_code = unit.code if first_unit else ''
                        unit_name = unit.name if first_unit else ''
                        writer.writerow([sem_val, unit_code, unit_name, f"Element {idx}", element.name])
                        first_sem = False
                        first_unit = False
                        
        return response

    @action(detail=True, methods=['get'])
    def export_comprehensive_structure_pdf(self, request, pk=None):
        from utils.pdf_utils import generate_comprehensive_pdf_report
        from .serializers import semester_sort_key
        course = self.get_object()
        
        semesters_data = []
        
        # Unassigned units first
        unassigned_units = course.units.filter(semester__isnull=True).order_by('name')
        if unassigned_units.exists():
            units_list = []
            for unit in unassigned_units:
                elements = list(unit.elements.all().order_by('id').values_list('name', flat=True))
                units_list.append({
                    'code': unit.code,
                    'name': unit.name,
                    'elements': elements
                })
            semesters_data.append({
                'semester_name': 'Unassigned',
                'units': units_list
            })
            
        # Units by semester (sorted naturally)
        semesters = list(course.semesters.all())
        semesters.sort(key=lambda s: semester_sort_key(s.name))
        
        for semester in semesters:
            units_list = []
            for unit in semester.units.all().order_by('name'):
                elements = list(unit.elements.all().order_by('id').values_list('name', flat=True))
                units_list.append({
                    'code': unit.code,
                    'name': unit.name,
                    'elements': elements
                })
            semesters_data.append({
                'semester_name': semester.name,
                'units': units_list
            })
            
        pdf_content = generate_comprehensive_pdf_report(
            course.school.name,
            course.name,
            semesters_data,
            f"{course.name}_comprehensive_structure.pdf"
        )
        
        response = HttpResponse(pdf_content, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{course.name}_comprehensive_structure.pdf"'
        return response

class SemesterViewSet(viewsets.ModelViewSet):
    queryset = Semester.objects.all()
    serializer_class = SemesterSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        from .serializers import semester_sort_key
        queryset = Semester.objects.all()
        course_id = self.request.query_params.get('course')
        if course_id:
            queryset = queryset.filter(course_id=course_id)
        return queryset

from rest_framework.decorators import action
from rest_framework.response import Response

class UnitViewSet(viewsets.ModelViewSet):
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            # Return all units in the student's course OR units they are registered/assigned to (and approved)
            registered_unit_ids = UnitRegistration.objects.filter(
                student=user, 
                status='APPROVED'
            ).values_list('unit_id', flat=True)
            
            q = models.Q(is_approved=True)
            if user.course:
                q = q & (models.Q(course=user.course) | models.Q(id__in=registered_unit_ids))
                return Unit.objects.filter(q).distinct()
            return Unit.objects.filter(id__in=registered_unit_ids, is_approved=True)
        elif user.role == 'INSTRUCTOR':
            active_semesters = CourseSession.objects.filter(is_active=True).values_list('semester_id', flat=True)
            return Unit.objects.filter(
                models.Q(is_approved=True) & (
                    models.Q(instructors=user) | 
                    (models.Q(course__instructors=user) & models.Q(semester__in=active_semesters))
                )
            ).distinct()
        elif user.role == 'CDACC':
            return Unit.objects.filter(is_approved=True)
        # ADMIN, MANAGER, DIRECTOR see all
        return Unit.objects.all()

    @action(detail=False, methods=['get'])
    def my_units(self, request):
        # Return units where the current user is an instructor (explicitly or via course) and approved,
        # but only if their semester is currently active/unlocked
        user = request.user
        active_semesters = CourseSession.objects.filter(is_active=True).values_list('semester_id', flat=True)
        units = Unit.objects.filter(
            models.Q(is_approved=True) & (
                models.Q(instructors=user) | 
                (models.Q(course__instructors=user) & models.Q(semester__in=active_semesters))
            )
        ).distinct()
        serializer = self.get_serializer(units, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def registration_list(self, request):
        user = request.user
        if user.role != 'STUDENT':
            return Response({"error": "Only students can fetch registration list."}, status=403)
        
        if not user.course:
            return Response([])

        # Fetch all approved units in the student's course
        units = Unit.objects.filter(course=user.course, is_approved=True).select_related('semester')
        
        # Filter out completed units (where they have portfolios with status EVALUATED)
        from poe_core.models import Portfolio
        completed_unit_ids = Portfolio.objects.filter(
            learner=user,
            status='EVALUATED'
        ).values_list('unit_id', flat=True)
        
        units = units.exclude(id__in=completed_unit_ids)
        
        serializer = self.get_serializer(units, many=True)
        data = serializer.data
        regs = {r.unit_id: r.status for r in UnitRegistration.objects.filter(student=user)}
        for item in data:
            item['registration_status'] = regs.get(item['id'], None)
            
        return Response(data)

    @action(detail=False, methods=['get'])
    def student_units_for_assignment(self, request):
        instructor = request.user
        student_id = request.query_params.get('student_id')
        if not student_id:
            return Response({"error": "student_id query param is required"}, status=400)
            
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            student = User.objects.get(id=student_id, role='STUDENT')
        except User.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)
            
        if not student.course:
            return Response([])

        # All units in the student's course
        units = Unit.objects.filter(course=student.course, is_approved=True).select_related('semester')
        
        # Filter out completed units
        from poe_core.models import Portfolio
        completed_unit_ids = Portfolio.objects.filter(
            learner=student,
            status='EVALUATED'
        ).values_list('unit_id', flat=True)
        
        units = units.exclude(id__in=completed_unit_ids)
        
        serializer = self.get_serializer(units, many=True)
        data = serializer.data
        
        regs = {r.unit_id: r.status for r in UnitRegistration.objects.filter(student=student)}
        for item in data:
            item['registration_status'] = regs.get(item['id'], None)
            
            # Check if this unit is already assigned to a DIFFERENT instructor
            current_instructors = Unit.objects.get(id=item['id']).instructors.all()
            if current_instructors.exists() and instructor not in current_instructors:
                item['assigned_instructor'] = current_instructors.first().username
                item['can_assign'] = False
            else:
                item['assigned_instructor'] = None
                item['can_assign'] = True
                
        return Response(data)

    @action(detail=True, methods=['post'])
    def enroll_students(self, request, pk=None):
        unit = self.get_object()
        student_ids = request.data.get('student_ids', [])
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        students = User.objects.filter(id__in=student_ids, role='STUDENT')
        
        unit.students.add(*students)
        return Response({"status": "students enrolled"}, status=200)

    @action(detail=True, methods=['post'])
    def remove_student(self, request, pk=None):
        unit = self.get_object()
        student_id = request.data.get('student_id')
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            student = User.objects.get(id=student_id, role='STUDENT')
            unit.students.remove(student)
            return Response({"status": "student removed"}, status=200)
        except User.DoesNotExist:
            return Response({"error": "Student not found"}, status=404)

    @action(detail=False, methods=['post'])
    def bulk_create(self, request):
        units_data = request.data.get('units', [])
        course_id = request.data.get('course')
        
        if not course_id:
            return Response({"error": "Course ID is required"}, status=400)
            
        created_units = []
        for unit_data in units_data:
            unit_data['course'] = course_id
            serializer = self.get_serializer(data=unit_data)
            if serializer.is_valid():
                serializer.save()
                created_units.append(serializer.data)
            else:
                return Response(serializer.errors, status=400)
                
        return Response(created_units, status=201)

    @action(detail=True, methods=['post'])
    def assign_semester(self, request, pk=None):
        unit = self.get_object()
        semester_id = request.data.get('semester_id')
        
        if not semester_id:
            # Check if there is already an unassigned unit with the same code in this course
            if Unit.objects.filter(code=unit.code, course=unit.course, semester__isnull=True).exclude(id=unit.id).exists():
                return Response({"error": "A unit with this code already exists as an unassigned unit in this course."}, status=400)
            unit.semester = None
        else:
            try:
                semester = Semester.objects.get(id=semester_id)
                # Check if there is already a unit with the same code in this semester
                if Unit.objects.filter(code=unit.code, semester=semester).exclude(id=unit.id).exists():
                    return Response({"error": f"A unit with code {unit.code} already exists in {semester.name}."}, status=400)
                unit.semester = semester
            except Semester.DoesNotExist:
                return Response({"error": "Semester not found"}, status=404)
        
        unit.save()
        return Response(self.get_serializer(unit).data)

    @action(detail=True, methods=['get'])
    def get_components(self, request, pk=None):
        unit = self.get_object()
        components = unit.mark_components.all().order_by('id')
        return Response(UnitMarkComponentSerializer(components, many=True).data)

    @action(detail=True, methods=['post'])
    def save_components(self, request, pk=None):
        unit = self.get_object()
        components_data = request.data.get('components', [])
        
        # Validate total weight: (Sum of unique group weights) + (Sum of standalone weights)
        unique_groups = {}
        standalone_weight = 0
        for c in components_data:
            g_name = c.get('group_name')
            if g_name and g_name.strip():
                g_weight = int(c.get('group_weight') or 0)
                unique_groups[g_name.strip().upper()] = g_weight
            else:
                standalone_weight += int(c.get('weight') or 0)
                
        total_weight = sum(unique_groups.values()) + standalone_weight
        if total_weight != 100 and len(components_data) > 0:
            return Response({"error": f"Aggregated weight must sum to 100%. Current sum: {total_weight}% (Unique group weights sum + standalone weights)"}, status=400)
            
        # Delete existing and recreate
        unit.mark_components.all().delete()
        created = []
        for c in components_data:
            g_name = c.get('group_name')
            g_weight = c.get('group_weight')
            obj = UnitMarkComponent.objects.create(
                unit=unit,
                name=c.get('name').strip().upper(),
                weight=int(c.get('weight')),
                group_name=g_name.strip().upper() if g_name and g_name.strip() else None,
                group_weight=int(g_weight) if g_weight else None,
                formula=c.get('formula') or 'SUM'
            )
            created.append(obj)
            
        return Response(UnitMarkComponentSerializer(created, many=True).data, status=200)

class ElementViewSet(viewsets.ModelViewSet):
    queryset = Element.objects.all()
    serializer_class = ElementSerializer
    permission_classes = [permissions.IsAuthenticated]

class CourseSessionViewSet(viewsets.ModelViewSet):
    queryset = CourseSession.objects.all()
    serializer_class = CourseSessionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course')
        if course_id:
            return CourseSession.objects.filter(course_id=course_id)
        return CourseSession.objects.all()

    def create(self, request, *args, **kwargs):
        course_id = request.data.get('course')
        semester_id = request.data.get('semester')
        intake = request.data.get('intake')
        is_active = request.data.get('is_active', True)

        if not course_id or not semester_id or not intake:
            return Response({"error": "course, semester and intake are required"}, status=400)

        # Check if a session already exists for this course, semester and intake
        session = CourseSession.objects.filter(
            course_id=course_id,
            semester_id=semester_id,
            intake=intake
        ).first()

        if session:
            # If it exists, update it to active (which will trigger its custom save() logic and reassign students)
            session.is_active = is_active
            session.save()
            serializer = self.get_serializer(session)
            return Response(serializer.data, status=200)

        # Otherwise, proceed with default creation
        return super().create(request, *args, **kwargs)

    @action(detail=False, methods=['post'])
    def lock_session(self, request):
        course_id = request.data.get('course')
        intake = request.data.get('intake')
        if not course_id or not intake:
            return Response({"error": "course and intake are required"}, status=400)
            
        CourseSession.objects.filter(course_id=course_id, intake=intake).update(is_active=False)
        from django.contrib.auth import get_user_model
        User = get_user_model()
        User.objects.filter(role='STUDENT', course_id=course_id, intake=intake).update(semester=None)
        return Response({"status": "session locked"})

class RubricViewSet(viewsets.ModelViewSet):
    queryset = Rubric.objects.all()
    serializer_class = RubricSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        unit_id = self.request.query_params.get('unit')
        if unit_id:
            return Rubric.objects.filter(unit_id=unit_id)
        return Rubric.objects.all()

class UnitRegistrationViewSet(viewsets.ModelViewSet):
    queryset = UnitRegistration.objects.all()
    serializer_class = UnitRegistrationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            return UnitRegistration.objects.filter(student=user)
        elif user.role == 'INSTRUCTOR':
            # Return pending registrations for units they teach,
            # or units in their course that have no instructor yet
            return UnitRegistration.objects.filter(
                models.Q(unit__instructors=user) | 
                models.Q(unit__instructors__isnull=True, unit__course__in=user.assigned_courses.all()),
                status='PENDING'
            ).distinct()
        
        # For Admin / Manager / CDACC, allow filtering by student query param
        queryset = UnitRegistration.objects.all()
        student_id = self.request.query_params.get('student')
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        registration = self.get_object()
        instructor = request.user

        if instructor.role != 'INSTRUCTOR' and instructor.role != 'ADMIN':
            return Response({"error": "Only instructors or admins can approve registrations."}, status=403)

        unit = registration.unit
        current_instructors = unit.instructors.all()
        if instructor.role not in ['ADMIN', 'MANAGER', 'DIRECTOR'] and current_instructors.exists() and instructor not in current_instructors:
            other_inst = current_instructors.first()
            return Response({
                "error": f"This unit is already assigned to {other_inst.first_name or other_inst.username}. Only they can approve it."
            }, status=400)

        registration.status = 'APPROVED'
        registration.approved_by = instructor
        registration.save()

        if instructor not in current_instructors and instructor.role == 'INSTRUCTOR':
            unit.instructors.add(instructor)

        unit.students.add(registration.student)

        from poe_core.models import Portfolio
        if not Portfolio.objects.filter(learner=registration.student, unit=unit).exists():
            Portfolio.objects.create(
                title=f"Portfolio - {unit.name}",
                learner=registration.student,
                unit=unit,
                status='DRAFT'
            )

        return Response(self.get_serializer(registration).data)

    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        registration = self.get_object()
        instructor = request.user

        if instructor.role != 'INSTRUCTOR' and instructor.role != 'ADMIN':
            return Response({"error": "Only instructors or admins can reject registrations."}, status=403)

        registration.status = 'REJECTED'
        registration.save()
        
        # Also remove the student from unit's student list when deactivating/rejecting!
        unit = registration.unit
        unit.students.remove(registration.student)
        
        # Delete draft portfolios for this unit registration
        from poe_core.models import Portfolio
        Portfolio.objects.filter(learner=registration.student, unit=unit, status='DRAFT').delete()
        
        return Response(self.get_serializer(registration).data)

    @action(detail=False, methods=['post'])
    def bulk_approve(self, request):
        registration_ids = request.data.get('registration_ids', [])
        if not registration_ids:
            return Response({"error": "No registrations provided."}, status=400)
        
        instructor = request.user
        if instructor.role != 'INSTRUCTOR' and instructor.role != 'ADMIN':
            return Response({"error": "Only instructors or admins can approve registrations."}, status=403)
        
        registrations = UnitRegistration.objects.filter(id__in=registration_ids)
        approved_regs = []
        
        for registration in registrations:
            unit = registration.unit
            current_instructors = unit.instructors.all()
            if instructor.role not in ['ADMIN', 'MANAGER', 'DIRECTOR'] and current_instructors.exists() and instructor not in current_instructors:
                continue
            
            registration.status = 'APPROVED'
            registration.approved_by = instructor
            registration.save()
            
            if instructor not in current_instructors and instructor.role == 'INSTRUCTOR':
                unit.instructors.add(instructor)
            
            unit.students.add(registration.student)
            
            from poe_core.models import Portfolio
            if not Portfolio.objects.filter(learner=registration.student, unit=unit).exists():
                Portfolio.objects.create(
                    title=f"Portfolio - {unit.name}",
                    learner=registration.student,
                    unit=unit,
                    status='DRAFT'
                )
            approved_regs.append(registration)
            
        return Response(self.get_serializer(approved_regs, many=True).data)

    @action(detail=False, methods=['post'])
    def bulk_reject(self, request):
        registration_ids = request.data.get('registration_ids', [])
        if not registration_ids:
            return Response({"error": "No registrations provided."}, status=400)
        
        instructor = request.user
        if instructor.role != 'INSTRUCTOR' and instructor.role != 'ADMIN':
            return Response({"error": "Only instructors or admins can reject registrations."}, status=403)
        
        registrations = UnitRegistration.objects.filter(id__in=registration_ids)
        
        for r in registrations:
            r.status = 'REJECTED'
            r.save()
            # Also remove the student from unit's student list when rejecting!
            unit = r.unit
            unit.students.remove(r.student)
            # Delete draft portfolios
            from poe_core.models import Portfolio
            Portfolio.objects.filter(learner=r.student, unit=unit, status='DRAFT').delete()
            
        return Response(self.get_serializer(registrations, many=True).data)

    @action(detail=False, methods=['post'])
    def bulk_register(self, request):
        student = request.user
        if student.role != 'STUDENT':
            return Response({"error": "Only students can submit registrations."}, status=403)

        unit_ids = request.data.get('unit_ids', [])
        semester_id = request.data.get('semester_id')
        created_regs = []

        semester = None
        if semester_id:
            try:
                semester = Semester.objects.get(id=semester_id)
            except Semester.DoesNotExist:
                pass
        if not semester:
            semester = student.semester

        from poe_core.models import Portfolio
        completed_unit_ids = Portfolio.objects.filter(
            learner=student,
            status='EVALUATED'
        ).values_list('unit_id', flat=True)

        for uid in unit_ids:
            if uid in completed_unit_ids:
                continue

            try:
                unit = Unit.objects.get(id=uid)
                reg, created = UnitRegistration.objects.get_or_create(
                    student=student,
                    unit=unit,
                    defaults={'status': 'PENDING', 'semester': semester}
                )
                if not created:
                    reg.semester = semester
                    if reg.status != 'APPROVED':
                        reg.status = 'PENDING'
                    reg.save()
                created_regs.append(reg)
            except Unit.DoesNotExist:
                pass

        return Response(self.get_serializer(created_regs, many=True).data, status=201)

    @action(detail=False, methods=['post'])
    def direct_assign(self, request):
        requester = request.user
        is_admin = requester.role in ['ADMIN', 'MANAGER']
        if requester.role != 'INSTRUCTOR' and not is_admin:
            return Response({"error": "Only instructors or admins can assign units."}, status=403)

        student_id = request.data.get('student_id')
        unit_ids = request.data.get('unit_ids', [])
        semester_id = request.data.get('semester_id')

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            student = User.objects.get(id=student_id, role='STUDENT')
        except User.DoesNotExist:
            return Response({"error": "Student not found."}, status=404)

        semester = None
        if semester_id:
            try:
                semester = Semester.objects.get(id=semester_id)
            except Semester.DoesNotExist:
                pass
        if not semester:
            semester = student.semester

        replace_existing = request.data.get('replace_existing', False)
        if replace_existing:
            # Reject all registrations not in the new unit_ids
            old_regs = UnitRegistration.objects.filter(student=student).exclude(unit_id__in=unit_ids)
            for reg in old_regs:
                reg.status = 'REJECTED'
                reg.save()
                reg.unit.students.remove(student)
                from poe_core.models import Portfolio
                Portfolio.objects.filter(learner=student, unit=reg.unit, status='DRAFT').delete()

        assigned_regs = []
        for uid in unit_ids:
            try:
                unit = Unit.objects.get(id=uid)
                current_instructors = unit.instructors.all()

                # Admins bypass instructor ownership restrictions
                if not is_admin:
                    if current_instructors.exists() and requester not in current_instructors:
                        other_inst = current_instructors.first()
                        return Response({
                            "error": f"Unit {unit.code} is already assigned to {other_inst.first_name or other_inst.username}. You cannot assign students to it."
                        }, status=400)
                    # Only add requester as instructor when they're an actual instructor (not admin)
                    if requester not in current_instructors:
                        unit.instructors.add(requester)

                unit.students.add(student)

                reg, created = UnitRegistration.objects.update_or_create(
                    student=student,
                    unit=unit,
                    defaults={'status': 'APPROVED', 'approved_by': requester, 'semester': semester}
                )

                from poe_core.models import Portfolio
                if not Portfolio.objects.filter(learner=student, unit=unit).exists():
                    Portfolio.objects.create(
                        title=f"Portfolio - {unit.name}",
                        learner=student,
                        unit=unit,
                        status='DRAFT'
                    )

                assigned_regs.append(reg)
            except Unit.DoesNotExist:
                pass

        return Response(self.get_serializer(assigned_regs, many=True).data, status=200)

class GradingSystemViewSet(viewsets.ModelViewSet):
    queryset = GradingSystem.objects.all()
    serializer_class = GradingSystemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        course_id = self.request.query_params.get('course')
        if course_id:
            return GradingSystem.objects.filter(course_id=course_id)
        return GradingSystem.objects.all()

    @action(detail=True, methods=['post'])
    def add_range(self, request, pk=None):
        grading_system = self.get_object()
        min_score = request.data.get('min_score')
        max_score = request.data.get('max_score')
        grade = request.data.get('grade')
        description = request.data.get('description', '')

        if min_score is None or max_score is None or not grade:
            return Response({"error": "min_score, max_score and grade are required."}, status=400)

        # Create range
        range_obj = GradeRange.objects.create(
            grading_system=grading_system,
            min_score=int(min_score),
            max_score=int(max_score),
            grade=grade.upper(),
            description=description
        )
        return Response(GradeRangeSerializer(range_obj).data, status=201)

    @action(detail=True, methods=['post'])
    def delete_range(self, request, pk=None):
        range_id = request.data.get('range_id')
        if not range_id:
            return Response({"error": "range_id is required."}, status=400)
        GradeRange.objects.filter(grading_system_id=pk, id=range_id).delete()
        return Response({"status": "range deleted"})

class StudentMarkViewSet(viewsets.ModelViewSet):
    queryset = StudentMark.objects.all()
    serializer_class = StudentMarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'STUDENT':
            qs = StudentMark.objects.filter(student=user)
        elif user.role == 'INSTRUCTOR':
            qs = StudentMark.objects.filter(unit__course__in=user.assigned_courses.all()).distinct()
        else:
            qs = StudentMark.objects.all()

        # Allow filtering by unit_id, student_id
        unit_id = self.request.query_params.get('unit_id')
        student_id = self.request.query_params.get('student_id')
        if unit_id:
            qs = qs.filter(unit_id=unit_id)
        if student_id:
            qs = qs.filter(student_id=student_id)
        return qs

    @action(detail=False, methods=['post'])
    def enter_marks(self, request):
        instructor = request.user
        if instructor.role != 'INSTRUCTOR' and instructor.role != 'ADMIN':
            return Response({"error": "Only instructors or admins can enter marks."}, status=403)

        student_id = request.data.get('student_id')
        unit_id = request.data.get('unit_id')
        marks_dict = request.data.get('marks', {})  # Dict of component_id_str to score (0-100)

        if not student_id or not unit_id:
            return Response({"error": "student_id and unit_id are required."}, status=400)

        from django.contrib.auth import get_user_model
        User = get_user_model()
        try:
            student = User.objects.get(id=student_id, role='STUDENT')
            unit = Unit.objects.get(id=unit_id)
        except (User.DoesNotExist, Unit.DoesNotExist):
            return Response({"error": "Student or Unit not found."}, status=404)

        # Enforce that only assigned instructors can grade
        current_instructors = unit.instructors.all()
        if current_instructors.exists() and instructor not in current_instructors and instructor.role != 'ADMIN':
            return Response({"error": "You are not assigned to teach this unit."}, status=403)

        # Get components to calculate weighted total
        components = unit.mark_components.all()
        if not components.exists():
            return Response({"error": "No mark components are defined for this unit. Please configure them first."}, status=400)

        # Group components by group_name
        groups = {}
        standalone = []
        for comp in components:
            if comp.group_name:
                g_name_upper = comp.group_name.upper().strip()
                if g_name_upper not in groups:
                    groups[g_name_upper] = {
                        'weight': comp.group_weight or comp.weight,
                        'formula': comp.formula or 'SUM',
                        'components': []
                    }
                groups[g_name_upper]['components'].append(comp)
            else:
                standalone.append(comp)

        # Calculate weighted total
        total_score = 0.0

        # Process groups
        for g_name, g_info in groups.items():
            comp_scores = []
            max_marks = []
            for comp in g_info['components']:
                score = marks_dict.get(str(comp.id)) or marks_dict.get(comp.name) or marks_dict.get(comp.name.upper()) or 0
                try:
                    score = float(score)
                except ValueError:
                    return Response({"error": f"Invalid mark value for component {comp.name}."}, status=400)
                if score < 0 or score > comp.weight:
                    return Response({"error": f"Mark for component {comp.name} cannot be less than 0 or exceed the max component mark ({comp.weight})."}, status=400)
                comp_scores.append(score)
                max_marks.append(comp.weight)

            if not comp_scores:
                continue

            formula = g_info['formula']
            g_weight = float(g_info['weight'])
            
            if formula == 'BEST_OF':
                best_pct = 0.0
                for s, m in zip(comp_scores, max_marks):
                    pct = (s / m) if m > 0 else 0
                    if pct > best_pct:
                        best_pct = pct
                weighted_score = best_pct * g_weight
            else:
                raw_sum = sum(comp_scores)
                raw_max = sum(max_marks)
                weighted_score = (raw_sum / raw_max) * g_weight if raw_max > 0 else 0.0

            total_score += min(weighted_score, g_weight)

        # Process standalone components
        for comp in standalone:
            score = marks_dict.get(str(comp.id)) or marks_dict.get(comp.name) or marks_dict.get(comp.name.upper()) or 0
            try:
                score = float(score)
            except ValueError:
                return Response({"error": f"Invalid mark value for component {comp.name}."}, status=400)
            if score < 0 or score > comp.weight:
                return Response({"error": f"Mark for component {comp.name} cannot be less than 0 or exceed the component weight ({comp.weight}%)."}, status=400)
            total_score += score

        # Dynamic scaling if max possible weight is not exactly 100%
        max_possible_weight = 0.0
        for g_name, g_info in groups.items():
            max_possible_weight += float(g_info['weight'])
        for comp in standalone:
            max_possible_weight += float(comp.weight)

        if max_possible_weight > 0 and max_possible_weight != 100.0:
            total_score = (total_score / max_possible_weight) * 100.0

        # Query grading system for the course
        grading_system = unit.course.grading_systems.first()
        grade_assigned = "NYC" # Default
        if grading_system:
            # Find matching grade range
            matching_range = grading_system.ranges.filter(
                min_score__lte=round(total_score),
                max_score__gte=round(total_score)
            ).first()
            if matching_range:
                grade_assigned = matching_range.grade
        else:
            # Standard Level 5 & 6 fallback if none configured
            if total_score >= 80:
                grade_assigned = "AM"
            elif total_score >= 65:
                grade_assigned = "P"
            elif total_score >= 50:
                grade_assigned = "C"
            else:
                grade_assigned = "NYC"

        # Determine target semester
        # Find if student has a registration for this unit, use its semester
        from .models import UnitRegistration
        reg = UnitRegistration.objects.filter(student=student, unit=unit).first()
        semester = reg.semester if reg else student.semester

        # Save student mark
        student_mark, created = StudentMark.objects.update_or_create(
            student=student,
            unit=unit,
            defaults={
                'semester': semester,
                'component_marks': marks_dict,
                'total_score': round(total_score, 2),
                'grade': grade_assigned
            }
        )

        return Response(StudentMarkSerializer(student_mark).data, status=200)

    @action(detail=False, methods=['get'])
    def provisional_results_pdf(self, request):
        from utils.pdf_utils import generate_provisional_results_pdf
        student = request.user
        semester_id = request.query_params.get('semester_id')

        # Allow instructors or admins to check a specific student's results too
        student_id = request.query_params.get('student_id')
        if student_id and (student.role in ['INSTRUCTOR', 'ADMIN', 'CDACC']):
            from django.contrib.auth import get_user_model
            User = get_user_model()
            student = User.objects.get(id=student_id, role='STUDENT')

        if not student or student.role != 'STUDENT':
            return Response({"error": "Student context is required."}, status=400)

        if not semester_id:
            return Response({"error": "semester_id query param is required."}, status=400)

        try:
            semester = Semester.objects.get(id=semester_id)
        except Semester.DoesNotExist:
            return Response({"error": "Semester not found."}, status=404)

        # Get all approved registered units for this student in this semester
        from .models import UnitRegistration
        registered_unit_ids = UnitRegistration.objects.filter(
            student=student,
            semester=semester,
            status='APPROVED'
        ).values_list('unit_id', flat=True)

        if not registered_unit_ids:
            return Response({"error": "No approved units registered for this semester."}, status=404)

        # Fetch student marks for these units
        marks = StudentMark.objects.filter(
            student=student,
            unit_id__in=registered_unit_ids,
            semester=semester
        ).select_related('unit')

        # Get active grading system for the course to extract legend
        grading_system = semester.course.grading_systems.first()
        legend_data = []
        if grading_system:
            ranges = grading_system.ranges.all().order_by('-min_score')
            for r in ranges:
                legend_data.append({
                    'grade': r.grade,
                    'min': r.min_score,
                    'max': r.max_score,
                    'desc': r.description or ''
                })
        else:
            # Fallback standard legend
            legend_data = [
                {'grade': 'AM', 'min': 80, 'max': 100, 'desc': 'Attained Mastery'},
                {'grade': 'P', 'min': 65, 'max': 79, 'desc': 'Proficient'},
                {'grade': 'C', 'min': 50, 'max': 64, 'desc': 'Competent'},
                {'grade': 'NYC', 'min': 0, 'max': 49, 'desc': 'Not Yet Competent'}
            ]

        # Generate ReportLab PDF report
        pdf_bytes = generate_provisional_results_pdf(student, semester, marks, legend_data)

        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'inline; filename="ProvisionalResults_{student.registration_number or student.username}.pdf"'
        return response

    @action(detail=False, methods=['get', 'post'], permission_classes=[permissions.AllowAny])
    def run_migrations(self, request):
        secret = request.query_params.get('secret')
        if secret != 'headway_migration_key_2026':
            return Response({"detail": "Authentication credentials were not provided."}, status=401)

        from django.core.management import call_command
        from io import StringIO
        import traceback
        out = StringIO()
        err = StringIO()
        try:
            call_command('migrate', stdout=out, stderr=err)
            return Response({
                "status": "success",
                "stdout": out.getvalue(),
                "stderr": err.getvalue()
            })
        except Exception as e:
            return Response({
                "status": "error",
                "detail": str(e),
                "traceback": traceback.format_exc()
            }, status=500)

class ExamRepositoryViewSet(viewsets.ModelViewSet):
    queryset = ExamRepository.objects.all()
    serializer_class = ExamRepositorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'INSTRUCTOR':
            # Instructors can see exams for their taught units
            return ExamRepository.objects.filter(
                models.Q(unit__instructors=user) | 
                models.Q(unit__course__instructors=user)
            ).distinct()
        elif user.role == 'STUDENT':
            curr_sem = get_student_current_semester(user)
            if not curr_sem or not user.course:
                return ExamRepository.objects.none()
            semesters = list(user.course.semesters.all())
            from .serializers import semester_sort_key
            semesters.sort(key=lambda s: semester_sort_key(s.name))
            try:
                curr_idx = semesters.index(curr_sem)
                allowed_semester_ids = [s.id for s in semesters[:curr_idx + 1]]
                return ExamRepository.objects.filter(
                    unit__course=user.course,
                    unit__semester_id__in=allowed_semester_ids
                )
            except ValueError:
                return ExamRepository.objects.none()
        return ExamRepository.objects.all()

    def perform_create(self, serializer):
        serializer.save(instructor=self.request.user)

from django.utils import timezone
from .models import OnlineExam, OnlineExamAttendance
from .serializers import OnlineExamSerializer, OnlineExamAttendanceSerializer

class OnlineExamViewSet(viewsets.ModelViewSet):
    queryset = OnlineExam.objects.all()
    serializer_class = OnlineExamSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Admins see all exams. Students only see what they are registered for.
        if self.request.user.role == 'STUDENT':
            reg_no = getattr(self.request.user, 'registration_number', '')
            if not reg_no:
                return OnlineExam.objects.none()
            exam_ids = OnlineExamAttendance.objects.filter(student_reg_no=reg_no).values_list('exam_id', flat=True)
            return OnlineExam.objects.filter(id__in=exam_ids, is_active=True)
        return OnlineExam.objects.all()

    @action(detail=False, methods=['get'], url_path='my-pending')
    def my_pending(self, request):
        if request.user.role != 'STUDENT':
            return Response({"error": "Only students have pending exams."}, status=400)
        reg_no = getattr(request.user, 'registration_number', '')
        if not reg_no:
            return Response([])
        
        # Fetch active exams where the student is in attendance and has not submitted yet
        attendance_records = OnlineExamAttendance.objects.filter(
            student_reg_no=reg_no,
            exam__is_active=True,
            has_submitted=False
        ).select_related('exam')
        
        # Check time limit for those already started
        valid_records = []
        for r in attendance_records:
            if r.has_started and r.started_at:
                elapsed_minutes = (timezone.now() - r.started_at).total_seconds() / 60.0
                if elapsed_minutes > (r.exam.duration_minutes + 1):  # 1 minute grace period
                    # Auto-submit if time expired but not submitted
                    r.has_submitted = True
                    r.submitted_at = timezone.now()
                    r.score = 0.0  # Or compute score if some answers exist
                    r.save()
                    continue
            valid_records.append(r)
            
        serializer = OnlineExamAttendanceSerializer(valid_records, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        exam = self.get_object()
        if not exam.is_active:
            return Response({"error": "This exam is not active."}, status=400)
            
        reg_no = getattr(request.user, 'registration_number', '')
        if not reg_no:
            return Response({"error": "Student registration number is required to start the exam."}, status=400)
            
        try:
            attendance = OnlineExamAttendance.objects.get(exam=exam, student_reg_no=reg_no)
        except OnlineExamAttendance.DoesNotExist:
            return Response({"error": "You are not registered for this exam."}, status=403)
            
        if attendance.has_submitted:
            return Response({"error": "You have already submitted this exam."}, status=400)
            
        if not attendance.has_started:
            attendance.has_started = True
            attendance.started_at = timezone.now()
            attendance.save()
            
        # Return exam questions and duration (excluding correct_option_index and correct_answer_text for security!)
        safe_questions = []
        for q in exam.questions:
            safe_questions.append({
                "question_text": q.get("question_text", ""),
                "question_type": q.get("question_type", "multiple_choice"),
                "options": q.get("options", [])
            })
            
        return Response({
            "exam_id": exam.id,
            "title": exam.title,
            "class_name": exam.class_name,
            "duration_minutes": exam.duration_minutes,
            "started_at": attendance.started_at,
            "questions": safe_questions
        })

    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        exam = self.get_object()
        reg_no = getattr(request.user, 'registration_number', '')
        if not reg_no:
            return Response({"error": "Student registration number is required."}, status=400)
            
        try:
            attendance = OnlineExamAttendance.objects.get(exam=exam, student_reg_no=reg_no)
        except OnlineExamAttendance.DoesNotExist:
            return Response({"error": "Registration record not found."}, status=403)
            
        if attendance.has_submitted:
            return Response({"error": "You have already submitted this exam."}, status=400)
            
        if not attendance.has_started:
            return Response({"error": "You cannot submit an exam you have not started."}, status=400)
            
        # Optional: check if time has lapsed significantly beyond duration
        elapsed_seconds = (timezone.now() - attendance.started_at).total_seconds()
        max_allowed_seconds = (exam.duration_minutes * 60) + 60  # 1 min grace
        if elapsed_seconds > max_allowed_seconds:
            # Still grade whatever is submitted or force 0. We'll grade what's in the request.
            pass
            
        submitted_answers = request.data.get("answers", {})  # e.g. {"0": "my text"} or {"0": 1}
        attendance.answers = submitted_answers
        
        # Grade questions
        correct_count = 0
        total_questions = len(exam.questions)
        for idx, q in enumerate(exam.questions):
            q_type = q.get("question_type", "multiple_choice")
            student_ans = submitted_answers.get(str(idx))
            if student_ans is None:
                student_ans = submitted_answers.get(idx)
            if student_ans is not None:
                if q_type == "text":
                    correct_text = q.get("correct_answer_text") or ""
                    if str(student_ans).strip().lower() == str(correct_text).strip().lower():
                        correct_count += 1
                else:
                    correct_idx = q.get("correct_option_index")
                    try:
                        if int(student_ans) == int(correct_idx):
                            correct_count += 1
                    except (ValueError, TypeError):
                        pass
                    
        score_pct = (correct_count / total_questions * 100.0) if total_questions > 0 else 0.0
        
        attendance.has_submitted = True
        attendance.submitted_at = timezone.now()
        attendance.score = score_pct
        attendance.save()
        
        return Response({
            "score": score_pct,
            "correct_count": correct_count,
            "total_questions": total_questions
        })

    @action(detail=True, methods=['get', 'post'], url_path='attendance')
    def attendance_list(self, request, pk=None):
        exam = self.get_object()
        if request.method == 'GET':
            # View attendance list and results
            records = OnlineExamAttendance.objects.filter(exam=exam)
            serializer = OnlineExamAttendanceSerializer(records, many=True)
            return Response(serializer.data)
        elif request.method == 'POST':
            # Add or update attendance list
            reg_numbers = request.data.get("registration_numbers", [])  # list of strings
            created_count = 0
            
            from notifications.models import Notification
            from django.contrib.auth import get_user_model
            User = get_user_model()
            
            for reg in reg_numbers:
                reg_clean = reg.strip().upper()
                if reg_clean:
                    attendance, created = OnlineExamAttendance.objects.get_or_create(
                        exam=exam,
                        student_reg_no=reg_clean
                    )
                    if created:
                        created_count += 1
                        # Find student user to send popup notification
                        student_user = User.objects.filter(registration_number=reg_clean, role='STUDENT').first()
                        if student_user:
                            Notification.objects.create(
                                user=student_user,
                                title="New Online Exam Assigned",
                                message=f"You have been registered for the online exam: {exam.title} for class {exam.class_name}. Please complete it before expiration.",
                                notification_type=Notification.NotificationType.SYSTEM_ALERT,
                                target_url="/dashboard",
                                action_text="Start Exam Now"
                            )
            return Response({
                "status": "success",
                "created_count": created_count
            })

    @action(detail=True, methods=['delete'], url_path='remove-attendance')
    def remove_attendance(self, request, pk=None):
        exam = self.get_object()
        reg_no = request.query_params.get("student_reg_no")
        if not reg_no:
            return Response({"error": "student_reg_no query param is required."}, status=400)
            
        OnlineExamAttendance.objects.filter(exam=exam, student_reg_no=reg_no.upper()).delete()
        return Response({"status": "student removed from attendance list"})

from .models import CertificateTemplate, Certificate
from .serializers import CertificateTemplateSerializer, CertificateSerializer
from django.http import HttpResponse

class CertificateTemplateViewSet(viewsets.ModelViewSet):
    queryset = CertificateTemplate.objects.all()
    serializer_class = CertificateTemplateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [permissions.IsAuthenticated()]
        # Only admins can create/update/delete templates
        return [permissions.IsAuthenticated(), permissions.IsAdminUser()]

class CertificateViewSet(viewsets.ModelViewSet):
    queryset = Certificate.objects.all().order_by('-created_at')
    serializer_class = CertificateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return Certificate.objects.all().order_by('-created_at')
        elif user.role == 'STUDENT':
            reg_no = getattr(user, 'registration_number', '')
            if reg_no:
                return Certificate.objects.filter(
                    models.Q(student=user) | models.Q(registration_no=reg_no)
                ).order_by('-created_at')
            return Certificate.objects.filter(student=user).order_by('-created_at')
        return Certificate.objects.none()

    @action(detail=True, methods=['get'], permission_classes=[permissions.AllowAny], url_path='download-pdf')
    def download_pdf(self, request, pk=None):
        if not request.user or request.user.is_anonymous:
            token = request.query_params.get('token')
            if token:
                from rest_framework_simplejwt.authentication import JWTAuthentication
                from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
                try:
                    validated_token = JWTAuthentication().get_validated_token(token)
                    user = JWTAuthentication().get_user(validated_token)
                    request.user = user
                except (InvalidToken, TokenError):
                    return Response({"detail": "Invalid or expired download token."}, status=401)

        if not request.user or request.user.is_anonymous:
            return Response({"detail": "Authentication credentials were not provided."}, status=401)

        certificate = self.get_object()
        if request.user.role != 'ADMIN':
            reg_no = getattr(request.user, 'registration_number', '')
            is_owner = (certificate.student == request.user) or (reg_no and certificate.registration_no == reg_no)
            if not is_owner:
                return Response({"detail": "You do not have permission to download this certificate."}, status=403)
        
        template = CertificateTemplate.objects.first()
        if not template:
            template = CertificateTemplate.objects.create()
            
        from utils.pdf_utils import generate_certificate_pdf
        pdf_bytes = generate_certificate_pdf(certificate, template)
        
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        filename = f"Certificate_{certificate.cert_ref_no}_{certificate.student_name.replace(' ', '_')}.pdf"
        response['Content-Disposition'] = f'inline; filename="{filename}"'
        return response
