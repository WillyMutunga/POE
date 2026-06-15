import os
import django

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from django.contrib.auth import get_user_model

def create_admin():
    User = get_user_model()
    
    # Define admin credentials
    username = 'superadmin'
    email = 'admin@headwaycollege.ac.ke'
    password = 'AdminPassword2026!'  # Change this immediately after first login
    
    print(f"Checking if user '{username}' exists...")
    
    user_exists = User.objects.filter(username=username).exists()
    if not user_exists:
        print(f"Creating superuser '{username}'...")
        user = User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            role='ADMIN'
        )
        print(f"SUCCESS: Admin user '{username}' created successfully!")
    else:
        print(f"User '{username}' already exists. Updating to ensure superuser/admin privileges...")
        user = User.objects.get(username=username)
        user.is_superuser = True
        user.is_staff = True
        user.role = 'ADMIN'
        user.set_password(password)
        user.save()
        print(f"SUCCESS: Admin user '{username}' privileges and password updated!")

if __name__ == '__main__':
    create_admin()
