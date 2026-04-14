from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.hashers import check_password
from django.utils.crypto import get_random_string
from .models import User, AdminAccount
from datetime import date
from .serializers import UserRegistrationSerializer, UserLoginSerializer, UserSerializer, UserProfileUpdateSerializer
from .otp_utils import generate_otp, send_otp_email, store_otp, verify_otp

import os
import json
import urllib.parse
import urllib.request
import urllib.error

from google.oauth2 import id_token
from google.auth.transport import requests as google_requests

@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """Send OTP to user's email for verification"""
    email = request.data.get('email', '').strip().lower()
    
    if not email:
        return Response({'detail': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if email already exists
    if User.objects.filter(email=email).exists():
        return Response({'detail': 'This email is already registered'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Generate and send OTP
    otp = generate_otp()
    
    if send_otp_email(email, otp):
        store_otp(email, otp)
        return Response({
            'message': 'OTP sent successfully to your email',
            'email': email
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'detail': 'Failed to send OTP. Please check your email address and try again.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp_endpoint(request):
    """Verify the OTP provided by user"""
    email = request.data.get('email', '').strip().lower()
    otp = request.data.get('otp', '').strip()
    
    if not email or not otp:
        return Response({'detail': 'Email and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if verify_otp(email, otp):
        return Response({
            'message': 'Email verified successfully',
            'verified': True
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'detail': 'Invalid or expired OTP',
            'verified': False
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = UserRegistrationSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Registration successful! Welcome to our temple community!',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = UserLoginSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.validated_data['user']
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Welcome back! Login successful.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def google_login(request):
    credential = request.data.get('credential')
    if not credential:
        return Response({'detail': 'credential is required'}, status=status.HTTP_400_BAD_REQUEST)

    google_client_id = None
    try:
        import os
        google_client_id = os.environ.get('GOOGLE_CLIENT_ID') or os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
    except Exception:
        google_client_id = None

    if not google_client_id:
        return Response({'detail': 'Google login not configured (missing GOOGLE_CLIENT_ID).'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    try:
        # Allow 60 seconds of clock skew for Google token validation
        info = id_token.verify_oauth2_token(
            credential, 
            google_requests.Request(), 
            google_client_id,
            clock_skew_in_seconds=60
        )
    except Exception as e:
        print(f"Google Token Verification Error: {e}")
        return Response({'detail': f'Invalid Google credential: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

    email = (info.get('email') or '').strip().lower()
    if not email:
        return Response({'detail': 'Google account email not available.'}, status=status.HTTP_400_BAD_REQUEST)

    full_name = (info.get('name') or info.get('given_name') or 'Devotee').strip()

    user = User.objects.filter(email=email).first()
    created = False
    if not user:
        base_username = (email.split('@', 1)[0] or 'devotee').strip().lower()
        base_username = ''.join(ch for ch in base_username if ch.isalnum() or ch in ['_', '.'])
        if not base_username:
            base_username = 'devotee'
        username = base_username
        i = 0
        while User.objects.filter(username=username).exists():
            i += 1
            username = f"{base_username}{i}"

        user = User(username=username, email=email, full_name=full_name)
        user.set_password(get_random_string(32))
        user.is_active = True
        user.save()
        created = True

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Welcome! Google login successful.' if created else 'Welcome back! Google login successful.',
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    }, status=status.HTTP_200_OK)


@api_view(['POST'])
@permission_classes([AllowAny])
def google_code_login(request):
    code = request.data.get('code')
    if not code:
        return Response({'detail': 'code is required'}, status=status.HTTP_400_BAD_REQUEST)

    google_client_id = os.environ.get('GOOGLE_CLIENT_ID') or os.environ.get('GOOGLE_OAUTH_CLIENT_ID')
    google_client_secret = os.environ.get('GOOGLE_CLIENT_SECRET') or os.environ.get('GOOGLE_OAUTH_CLIENT_SECRET')

    if not google_client_id or not google_client_secret:
        return Response({'detail': 'Google OAuth not configured (missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET).'}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

    redirect_uri = request.data.get('redirect_uri') or 'postmessage'

    payload = urllib.parse.urlencode({
        'code': code,
        'client_id': google_client_id,
        'client_secret': google_client_secret,
        'redirect_uri': redirect_uri,
        'grant_type': 'authorization_code',
    }).encode('utf-8')

    req = urllib.request.Request(
        url='https://oauth2.googleapis.com/token',
        data=payload,
        headers={'Content-Type': 'application/x-www-form-urlencoded'},
        method='POST',
    )

    try:
        with urllib.request.urlopen(req, timeout=15) as resp:
            body = resp.read().decode('utf-8')
            token_data = json.loads(body or '{}')
    except urllib.error.HTTPError as e:
        raw = ''
        try:
            raw = e.read().decode('utf-8')
        except Exception:
            raw = ''
        parsed = None
        try:
            parsed = json.loads(raw or '{}')
        except Exception:
            parsed = None
        return Response({
            'detail': 'Failed to exchange Google auth code.',
            'google_error': parsed if parsed else raw,
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        return Response({
            'detail': 'Failed to exchange Google auth code.',
            'error': str(e),
        }, status=status.HTTP_401_UNAUTHORIZED)

    google_id_token = token_data.get('id_token')
    if not google_id_token:
        safe_subset = {}
        try:
            for k in ['error', 'error_description', 'scope', 'token_type', 'expires_in']:
                if k in token_data:
                    safe_subset[k] = token_data.get(k)
        except Exception:
            safe_subset = {}
        return Response({
            'detail': 'Google token exchange did not return an id_token.',
            'google_error': safe_subset or token_data,
        }, status=status.HTTP_401_UNAUTHORIZED)

    try:
        # Allow 60 seconds of clock skew for Google token validation
        info = id_token.verify_oauth2_token(
            google_id_token, 
            google_requests.Request(), 
            google_client_id,
            clock_skew_in_seconds=60
        )
    except Exception as e:
        print(f"Google ID Token Verification Error: {e}")
        return Response({'detail': f'Invalid Google id_token: {str(e)}'}, status=status.HTTP_401_UNAUTHORIZED)

    email = (info.get('email') or '').strip().lower()
    if not email:
        return Response({'detail': 'Google account email not available.'}, status=status.HTTP_400_BAD_REQUEST)

    full_name = (info.get('name') or info.get('given_name') or 'Devotee').strip()

    user = User.objects.filter(email=email).first()
    created = False
    if not user:
        base_username = (email.split('@', 1)[0] or 'devotee').strip().lower()
        base_username = ''.join(ch for ch in base_username if ch.isalnum() or ch in ['_', '.'])
        if not base_username:
            base_username = 'devotee'
        username = base_username
        i = 0
        while User.objects.filter(username=username).exists():
            i += 1
            username = f"{base_username}{i}"

        user = User(username=username, email=email, full_name=full_name)
        user.set_password(get_random_string(32))
        user.is_active = True
        user.save()
        created = True

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Welcome! Google login successful.' if created else 'Welcome back! Google login successful.',
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    }, status=status.HTTP_200_OK)

@api_view(['POST'])
def logout(request):
    try:
        refresh_token = request.data["refresh"]
        token = RefreshToken(refresh_token)
        token.blacklist()
        return Response({'message': 'Successfully logged out!'}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    if request.method == 'PATCH':
        update_serializer = UserProfileUpdateSerializer(request.user, data=request.data, partial=True)
        if update_serializer.is_valid():
            user = update_serializer.save()
            return Response({'user': UserSerializer(user).data}, status=status.HTTP_200_OK)
        return Response(update_serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    serializer = UserSerializer(request.user)
    user_data = serializer.data

    # Lazy import to avoid any potential circulars
    from booking.models import PassBooking

    # Booking history count for this user
    total_bookings = PassBooking.objects.filter(user=request.user).count()

    # Upcoming passes: today or future, ordered by date then slot
    upcoming_qs = (
        PassBooking.objects
        .filter(user=request.user, darshan_date__gte=date.today())
        .order_by('darshan_date', 'slot')
    )

    def serialize_booking(b: PassBooking):
        return {
            'booking_id': b.booking_id,
            'darshan_date': b.darshan_date.isoformat(),
            'slot': b.slot,
            'full_name': b.full_name,
            'created_at': b.created_at.isoformat(),
        }

    upcoming = [serialize_booking(b) for b in upcoming_qs]

    return Response({
        'user': user_data,
        'booking_stats': {
            'total': total_bookings,
            'upcoming_count': len(upcoming),
        },
        'upcoming_passes': upcoming,
    })

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_by_id(request, user_id):
    if int(user_id) != int(getattr(request.user, 'id', 0)):
        return Response({'detail': 'You can only access your own profile.'}, status=status.HTTP_403_FORBIDDEN)
    return profile(request)

@api_view(['POST'])
@permission_classes([AllowAny])
def admin_login(request):
    username = request.data.get('username')
    password = request.data.get('password')
    if not username or not password:
        return Response({'detail': 'username and password are required'}, status=status.HTTP_400_BAD_REQUEST)

    # 1) Prefer Django auth (works with createsuperuser / admin-created staff users)
    user = authenticate(request, username=username, password=password)
    if user and user.is_active and user.is_staff:
        refresh = RefreshToken.for_user(user)
        return Response({
            'message': 'Admin login successful.',
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_200_OK)

    # 2) Fallback: legacy AdminAccount table
    try:
        admin_acc = AdminAccount.objects.get(username=username)
    except AdminAccount.DoesNotExist:
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    if not check_password(password, admin_acc.password):
        return Response({'detail': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

    user, created = User.objects.get_or_create(username=username, defaults={
        'email': f'{username}@example.com',
        'full_name': username,
    })
    if created:
        user.set_password(get_random_string(32))
    if not user.is_staff:
        user.is_staff = True
    user.is_active = True
    user.save()

    refresh = RefreshToken.for_user(user)
    return Response({
        'message': 'Admin login successful.',
        'user': UserSerializer(user).data,
        'tokens': {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
        }
    }, status=status.HTTP_200_OK)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_verify(request):
    if getattr(request.user, "is_staff", False) and getattr(request.user, "is_active", False):
        return Response({'detail': 'admin_ok'}, status=status.HTTP_200_OK)

    try:
        AdminAccount.objects.get(username=request.user.username)
        return Response({'detail': 'admin_ok'}, status=status.HTTP_200_OK)
    except AdminAccount.DoesNotExist:
        return Response({'detail': 'not_admin'}, status=status.HTTP_403_FORBIDDEN)