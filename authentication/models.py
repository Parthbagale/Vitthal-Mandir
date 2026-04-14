from django.contrib.auth.models import AbstractUser
from django.db import models
import base64
from django.core.files.base import ContentFile
from django.contrib.auth.hashers import make_password, identify_hasher

class User(AbstractUser):
    email = models.EmailField(unique=True)
    full_name = models.CharField(max_length=255)
    mobile = models.CharField(max_length=10, null=True, blank=True)
    aadhaar = models.CharField(max_length=12, null=True, blank=True)
    profile_image_data = models.BinaryField(null=True, blank=True)
    profile_image_name = models.CharField(max_length=255, null=True, blank=True)
    profile_image_type = models.CharField(max_length=50, null=True, blank=True)
    is_devotee = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def set_profile_image(self, image_file):
        """Store image as binary data in database"""
        if image_file:
            self.profile_image_data = image_file.read()
            self.profile_image_name = image_file.name
            self.profile_image_type = image_file.content_type
    
    def get_profile_image_base64(self):
        """Return image as base64 string for frontend display"""
        if self.profile_image_data:
            return base64.b64encode(self.profile_image_data).decode('utf-8')
        return None

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email', 'full_name']

    def __str__(self):
        return f"{self.full_name} ({self.username})"

    class Meta:
        db_table = 'auth_user'


class AdminAccount(models.Model):
    """Simple admin credential store independent of the regular User table."""
    username = models.CharField(max_length=150, unique=True)
    password = models.CharField(max_length=255)  # store hashed
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'admin_account'
        ordering = ['-created_at']

    def __str__(self):
        return self.username

    def save(self, *args, **kwargs):
        # If password appears to be raw (not a recognized hasher), hash it
        try:
            identify_hasher(self.password)
        except Exception:

            self.password = make_password(self.password)
        super().save(*args, **kwargs)
