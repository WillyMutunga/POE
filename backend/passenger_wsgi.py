import os
import sys
import traceback

sys.path.insert(0, "/home1/headwayc/poe_backend")
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

def run_diagnostic():
    import django
    django.setup()
    
    from django.core.management import call_command
    from io import StringIO
    
    out = StringIO()
    err = StringIO()
    
    try:
        call_command('migrate', stdout=out, stderr=err)
        return f"MIGRATION STDOUT:\n{out.getvalue()}\nSTDERR:\n{err.getvalue()}"
    except Exception as e:
        return f"MIGRATION ERROR: {e}\n{traceback.format_exc()}"

def application(environ, start_response):
    start_response("200 OK", [("Content-Type", "text/plain; charset=utf-8")])
    try:
        res = run_diagnostic()
    except Exception as e:
        res = f"WSGI ERROR: {e}\n{traceback.format_exc()}"
    return [res.encode('utf-8')]
