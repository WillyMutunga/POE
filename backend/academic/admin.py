from django.contrib import admin
from .models import School, Course, Semester, Unit

@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('name',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('name', 'school')
    list_filter = ('school',)

@admin.register(Semester)
class SemesterAdmin(admin.ModelAdmin):
    list_display = ('name', 'course')
    list_filter = ('course',)

@admin.register(Unit)
class UnitAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'semester')
    list_filter = ('semester__course', 'semester')
    filter_horizontal = ('instructors',)
