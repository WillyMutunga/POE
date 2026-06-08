from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class UserAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('register')
        self.login_url = reverse('token_obtain_pair')
        self.user_data = {
            'registration_number': 'REG123',
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'testpassword123',
            'role': 'STUDENT'
        }

    def test_user_registration(self):
        response = self.client.post(self.register_url, self.user_data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(User.objects.count(), 1)
        self.assertEqual(User.objects.get().registration_number, 'REG123')

    def test_user_login(self):
        # Create user first
        User.objects.create_user(
            registration_number=self.user_data['registration_number'],
            username=self.user_data['username'],
            email=self.user_data['email'],
            password=self.user_data['password'],
            role=self.user_data['role']
        )
        
        # Try login
        login_data = {
            'username': self.user_data['registration_number'],
            'password': self.user_data['password']
        }
        response = self.client.post(self.login_url, login_data)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

