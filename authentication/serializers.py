from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth import authenticate
from .models import User


def validate_aadhaar_checksum(aadhaar):
    """
    Validate Aadhaar number using Verhoeff algorithm.
    Returns True if valid, False otherwise.
    """
    if not aadhaar or len(aadhaar) != 12 or not aadhaar.isdigit():
        return False
    
    # Verhoeff algorithm tables
    d = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 2, 3, 4, 0, 6, 7, 8, 9, 5],
        [2, 3, 4, 0, 1, 7, 8, 9, 5, 6],
        [3, 4, 0, 1, 2, 8, 9, 5, 6, 7],
        [4, 0, 1, 2, 3, 9, 5, 6, 7, 8],
        [5, 9, 8, 7, 6, 0, 4, 3, 2, 1],
        [6, 5, 9, 8, 7, 1, 0, 4, 3, 2],
        [7, 6, 5, 9, 8, 2, 1, 0, 4, 3],
        [8, 7, 6, 5, 9, 3, 2, 1, 0, 4],
        [9, 8, 7, 6, 5, 4, 3, 2, 1, 0]
    ]
    
    p = [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],
        [1, 5, 7, 6, 2, 8, 3, 0, 9, 4],
        [5, 8, 0, 3, 7, 9, 6, 1, 4, 2],
        [8, 9, 1, 6, 0, 4, 3, 5, 2, 7],
        [9, 4, 5, 3, 1, 2, 6, 8, 7, 0],
        [4, 2, 8, 6, 5, 7, 3, 9, 0, 1],
        [2, 7, 9, 3, 8, 0, 6, 4, 1, 5],
        [7, 0, 4, 6, 9, 1, 3, 2, 5, 8]
    ]
    
    c = 0
    digits = [int(x) for x in reversed(aadhaar)]
    
    for i, digit in enumerate(digits):
        c = d[c][p[i % 8][digit]]
    
    return c == 0


class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    profile_image = serializers.ImageField(required=False, allow_null=True)
    mobile = serializers.CharField(required=False, allow_blank=True, max_length=10)
    aadhaar = serializers.CharField(required=False, allow_blank=True, max_length=12)

    class Meta:
        model = User
        fields = ('username', 'email', 'full_name', 'mobile', 'aadhaar', 'password', 'password_confirm', 'profile_image')

    def validate_mobile(self, value):
        """Validate mobile number format"""
        if value:
            value = value.strip()
            if not value.isdigit():
                raise serializers.ValidationError("Mobile number must contain only digits")
            if len(value) != 10:
                raise serializers.ValidationError("Mobile number must be exactly 10 digits")
            if value[0] not in ['6', '7', '8', '9']:
                raise serializers.ValidationError("Mobile number must start with 6, 7, 8, or 9")
        return value

    def validate_aadhaar(self, value):
        """Validate Aadhaar number format and checksum"""
        if value:
            value = value.strip()
            if not value.isdigit():
                raise serializers.ValidationError("Aadhaar number must contain only digits")
            if len(value) != 12:
                raise serializers.ValidationError("Aadhaar number must be exactly 12 digits")
            if not validate_aadhaar_checksum(value):
                raise serializers.ValidationError("Please enter a valid Aadhaar card number")
        return value

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Passwords don't match")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        profile_image = validated_data.pop('profile_image', None)
        
        user = User.objects.create_user(**validated_data)
        
        # Store image as binary data in database
        if profile_image:
            user.set_profile_image(profile_image)
            user.save()
            
        return user

class UserLoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Invalid credentials')
            if not user.is_active:
                raise serializers.ValidationError('User account is disabled')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Must include username and password')

class UserSerializer(serializers.ModelSerializer):
    profile_image_base64 = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = (
            'id', 'username', 'email', 'full_name',
            'is_devotee', 'is_active',
            'created_at', 'updated_at', 'last_login',
            'profile_image_base64',
        )
        read_only_fields = ('id', 'created_at', 'updated_at', 'last_login', 'is_active')
    
    def get_profile_image_base64(self, obj):
        return obj.get_profile_image_base64()


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    profile_image = serializers.ImageField(required=False, allow_null=True, write_only=True)

    class Meta:
        model = User
        fields = ('full_name', 'email', 'profile_image')

    def validate_email(self, value):
        value = (value or '').strip().lower()
        if not value:
            return value

        qs = User.objects.filter(email=value)
        if self.instance is not None:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError('This email is already in use.')

        return value

    def update(self, instance, validated_data):
        profile_image = validated_data.pop('profile_image', None)

        for attr, val in validated_data.items():
            setattr(instance, attr, val)

        if profile_image is not None:
            instance.set_profile_image(profile_image)

        instance.save()
        return instance
