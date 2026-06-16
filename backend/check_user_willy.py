import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

print("=== DATABASE USER CHECK & RESET ===")

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
        
        # Reset password
        print("Resetting password to 'William#20'...")
        u.set_password('William#20')
        u.save()
        print("SUCCESS: Password has been successfully reset to 'William#20'!")
    else:
        print("No user found by username 'Willy'.")
except Exception as ex:
    print(f"CRASH: {ex}")
