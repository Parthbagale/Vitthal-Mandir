"""
SMS OTP utility functions for phone verification using Fast2SMS
"""
import random
import string
import requests
from django.core.cache import cache
from django.conf import settings


def generate_sms_otp(length=6):
    """Generate a random 6-digit OTP for SMS"""
    return ''.join(random.choices(string.digits, k=length))


def send_sms_otp(mobile, otp):
    """
    Send OTP to user's mobile number via Fast2SMS
    
    Args:
        mobile (str): 10-digit mobile number
        otp (str): 6-digit OTP code
    
    Returns:
        bool: True if SMS sent successfully, False otherwise
    """
    # Fast2SMS API configuration
    api_key = getattr(settings, 'FAST2SMS_API_KEY', '')
    
    if not api_key:
        print("Error: FAST2SMS_API_KEY not configured in settings")
        return False
    
    # Fast2SMS API endpoint
    url = "https://www.fast2sms.com/dev/bulkV2"
    
    # Message template
    message = f"Your OTP for Shri Vitthal Rukmini Mandir booking is {otp}. Valid for 5 minutes. Do not share with anyone. - Vitthal Mandir"
    
    # API payload
    payload = {
        "sender_id": "FSTSMS",  # Fast2SMS default sender ID
        "message": message,
        "language": "english",
        "route": "q",  # 'q' for quick/promotional, 'p' for transactional
        "numbers": mobile,
    }
    
    # API headers
    headers = {
        "authorization": api_key,
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=10)
        response_data = response.json()
        
        # Check if SMS was sent successfully
        if response.status_code == 200 and response_data.get('return'):
            print(f"SMS OTP sent successfully to {mobile}")
            return True
        else:
            print(f"Failed to send SMS: {response_data}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"Error sending SMS: {e}")
        return False
    except Exception as e:
        print(f"Unexpected error: {e}")
        return False


def store_sms_otp(mobile, otp):
    """Store SMS OTP in cache with 5 minute expiry"""
    cache_key = f'sms_otp_{mobile}'
    cache.set(cache_key, otp, timeout=300)  # 5 minutes


def verify_sms_otp(mobile, otp):
    """Verify if the provided OTP matches the stored one"""
    cache_key = f'sms_otp_{mobile}'
    stored_otp = cache.get(cache_key)
    
    if stored_otp and stored_otp == otp:
        # OTP is correct, delete it from cache
        cache.delete(cache_key)
        return True
    return False


def delete_sms_otp(mobile):
    """Delete SMS OTP from cache"""
    cache_key = f'sms_otp_{mobile}'
    cache.delete(cache_key)


def get_otp_attempts(mobile):
    """Get number of OTP send attempts for rate limiting"""
    cache_key = f'sms_otp_attempts_{mobile}'
    attempts = cache.get(cache_key, 0)
    return attempts


def increment_otp_attempts(mobile):
    """Increment OTP send attempts counter"""
    cache_key = f'sms_otp_attempts_{mobile}'
    attempts = cache.get(cache_key, 0)
    cache.set(cache_key, attempts + 1, timeout=600)  # 10 minutes


def can_send_otp(mobile):
    """Check if user can send OTP (rate limiting)"""
    attempts = get_otp_attempts(mobile)
    return attempts < 3  # Max 3 attempts per 10 minutes
