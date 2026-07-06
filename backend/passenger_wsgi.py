import os
import sys
import json
import traceback

sys.path.insert(0, "/home1/headwayc/poe_backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

def run_diagnostic():
    import django
    django.setup()
    
    from academic.models import Unit, UnitMarkComponent, StudentMark
    dump = []
    unit = Unit.objects.filter(code="ME/CU/BJ/CR/13/6/MA").first()
    if unit:
        components = UnitMarkComponent.objects.filter(unit=unit)
        for c in components:
            dump.append({
                "id": c.id,
                "name": c.name,
                "weight": c.weight,
                "group_name": c.group_name,
                "group_weight": c.group_weight,
                "formula": c.formula
            })
            
        marks_dump = []
        marks = StudentMark.objects.filter(unit=unit)
        for m in marks:
            marks_dump.append({
                "student": m.student.username,
                "total_score": m.total_score,
                "grade": m.grade,
                "raw_marks": m.component_marks
            })
    else:
        components = []
        marks_dump = []
        
    res_dict = {
        "components": dump,
        "marks": marks_dump
    }
    
    with open('/home1/headwayc/poe.headwaycollege.ac.ke/db_dump.json', 'w', encoding='utf-8') as f:
        json.dump(res_dict, f, indent=2)

try:
    run_diagnostic()
except Exception as e:
    with open('/home1/headwayc/poe.headwaycollege.ac.ke/db_dump.json', 'w', encoding='utf-8') as f:
        f.write(f"ERROR: {e}\n{traceback.format_exc()}")

from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
