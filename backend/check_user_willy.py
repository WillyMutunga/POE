import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("=== DATABASE USER CHECK ===")

try:
    # Try finding by username
    u = User.objects.filter(username__iexact="Willy").first()
    if u:
        print(f"Found user by username 'Willy' (case-insensitive):")
        print(f"ID: {u.id}")
        print(f"Username: {u.username}")
        print(f"Email: {u.email}")
        print(f"Role: {u.role}")
        print(f"Registration Number: {u.registration_number}")
        print(f"Is Active: {u.is_active}")
        print(f"Is Staff: {u.is_staff}")
        print(f"Is Superuser: {u.is_superuser}")
        print(f"Password Check 'William#20': {u.check_password('William#20')}")
        print(f"Password Check 'william#20': {u.check_password('william#20')}")
    else:
        print("No user found by username 'Willy'.")
        
    # Search all users that contain 'willy'
    all_willys = User.objects.filter(username__icontains="willy")
    print(f"\nAll users containing 'willy' ({all_willys.count()} found):")
    for u in all_willys:
        print(f"- {u.username} (Email: {u.email}, Role: {u.role}, Reg: {u.registration_number}, Active: {u.is_active})")
        
    # Also search by email
    by_email = User.objects.filter(email__icontains="willy")
    print(f"\nAll users with email containing 'willy' ({by_email.count()} found):")
    for u in by_email:
        print(f"- {u.username} (Email: {u.email}, Role: {u.role}, Reg: {u.registration_number}, Active: {u.is_active})")
except Exception as ex:
    print(f"CRASH: {ex}")

