import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

output_path = "/home1/headwayc/public_html/test_user.txt"

with open(output_path, "w") as f:
    f.write("=== DATABASE USER CHECK ===\n")
    
    # Try finding by username
    u = User.objects.filter(username__iexact="Willy").first()
    if u:
        f.write(f"Found user by username 'Willy' (case-insensitive):\n")
        f.write(f"ID: {u.id}\n")
        f.write(f"Username: {u.username}\n")
        f.write(f"Email: {u.email}\n")
        f.write(f"Role: {u.role}\n")
        f.write(f"Registration Number: {u.registration_number}\n")
        f.write(f"Is Active: {u.is_active}\n")
        f.write(f"Is Staff: {u.is_staff}\n")
        f.write(f"Is Superuser: {u.is_superuser}\n")
        f.write(f"Password Check 'William#20': {u.check_password('William#20')}\n")
        f.write(f"Password Check 'william#20': {u.check_password('william#20')}\n")
    else:
        f.write("No user found by username 'Willy'.\n")
        
    # Search all users that contain 'willy'
    all_willys = User.objects.filter(username__icontains="willy")
    f.write(f"\nAll users containing 'willy' ({all_willys.count()} found):\n")
    for u in all_willys:
        f.write(f"- {u.username} (Email: {u.email}, Role: {u.role}, Reg: {u.registration_number}, Active: {u.is_active})\n")
        
    # Also search by email
    by_email = User.objects.filter(email__icontains="willy")
    f.write(f"\nAll users with email containing 'willy' ({by_email.count()} found):\n")
    for u in by_email:
        f.write(f"- {u.username} (Email: {u.email}, Role: {u.role}, Reg: {u.registration_number}, Active: {u.is_active})\n")
