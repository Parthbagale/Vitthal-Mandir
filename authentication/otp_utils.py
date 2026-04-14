"""
OTP (One-Time Password) utility functions for email verification
"""
import random
import string
from django.core.cache import cache
from django.core.mail import send_mail
from django.conf import settings


def generate_otp(length=6):
    """Generate a random 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=length))


def send_otp_email(email, otp):
    """Send OTP to user's email"""
    subject = 'Verify Your Email - Shri Vitthal Rukmini Mandir'
    message = f"""
    Namaste! 🙏
    
    Welcome to Shri Vitthal Rukmini Mandir, Pandharpur!
    
    Your One-Time Password (OTP) for email verification is:
    
    {otp}
    
    This OTP is valid for 10 minutes.
    
    If you didn't request this, please ignore this email.
    
    Jai Vitthal! 🚩
    
    ---
    Shri Vitthal Rukmini Mandir
    Pandharpur, Maharashtra
    """
    
    try:
        send_mail(
            subject=subject,
            message=message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[email],
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Error sending OTP email: {e}")
        return False


def store_otp(email, otp):
    """Store OTP in cache with 10 minute expiry"""
    cache_key = f'otp_{email}'
    cache.set(cache_key, otp, timeout=600)  # 10 minutes


def verify_otp(email, otp):
    """Verify if the provided OTP matches the stored one"""
    cache_key = f'otp_{email}'
    stored_otp = cache.get(cache_key)
    
    if stored_otp and stored_otp == otp:
        # OTP is correct, delete it from cache
        cache.delete(cache_key)
        return True
    return False


def delete_otp(email):
    """Delete OTP from cache"""
    cache_key = f'otp_{email}'
    cache.delete(cache_key)
