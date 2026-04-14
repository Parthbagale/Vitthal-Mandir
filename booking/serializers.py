from rest_framework import serializers
from .models import PassBooking, EntryVerification, PoojaBooking, BhaktaNivasPhoto, Donation
import base64
##Adharcard validation

class PassBookingSerializer(serializers.ModelSerializer):
    # Accept upload as "photo" in multipart; expose base64 for convenience
    photo = serializers.ImageField(write_only=True, required=True)
    image_base64 = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PassBooking
        fields = [
            'id', 'booking_id', 'full_name', 'email', 'mobile', 'aadhaar', 'children_count', 'gender',
            'darshan_date', 'slot', 'photo', 'image_base64', 'created_at'
        ]
        read_only_fields = ['id', 'booking_id', 'created_at']

    def validate_aadhaar(self, value):
        """Validate Aadhaar number format"""
        if value:
            value = value.strip()
            if not value.isdigit():
                raise serializers.ValidationError("Aadhaar number must contain only digits")
            if len(value) != 12:
                raise serializers.ValidationError("Aadhaar number must be exactly 12 digits")
        else:
            raise serializers.ValidationError("Aadhaar number is required")
        return value

    def get_image_base64(self, obj):
        if obj.image_data:
            return f"data:{obj.image_type};base64,{base64.b64encode(obj.image_data).decode('utf-8')}"
        return None

    def create(self, validated_data):
        upload = validated_data.pop('photo')
        # Set image binary and meta
        image_data = upload.read()
        instance = PassBooking(**validated_data)
        instance.image_data = image_data
        instance.image_name = upload.name
        instance.image_type = getattr(upload, 'content_type', 'application/octet-stream')
        # booking_id: allow view to set; fallback here if missing
        if not instance.booking_id:
            from uuid import uuid4
            instance.booking_id = f"PS{uuid4().hex[:10].upper()}"
        instance.save()
        return instance


class BhaktaNivasPhotoSerializer(serializers.ModelSerializer):
    image_base64 = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = BhaktaNivasPhoto
        fields = [
            'id', 'booking_code',
            'full_name', 'email', 'mobile', 'aadhaar', 'children_count', 'gender',
            'room_type', 'ac_type', 'people_count', 'member_names',
            'checkin_date', 'checkin_time', 'checkout_date', 'checkout_time',
            'image_name', 'image_type', 'image_base64', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def get_image_base64(self, obj):
        if obj.image_data:
            return f"data:{obj.image_type};base64,{base64.b64encode(obj.image_data).decode('utf-8')}"
        return None


"""
Removed BhaktaNivasSerializer because BhaktaNivas model has been dropped.
Create will be handled in the ViewSet using BhaktaNivasPhoto exclusively.
"""


class EntryVerificationSerializer(serializers.ModelSerializer):
    verified_by_username = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = EntryVerification
        fields = [
            'id', 'booking', 'verified_by', 'verified_by_username',
            'method', 'status', 'match_score', 'notes',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'verified_by', 'verified_by_username', 'created_at', 'updated_at']

    def get_verified_by_username(self, obj):
        return getattr(obj.verified_by, 'username', None)


class PoojaBookingSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(write_only=True, required=True)
    image_base64 = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = PoojaBooking
        fields = [
            'id', 'booking_id', 'pooja_type', 'full_name', 'email', 'mobile', 'aadhaar',
            'preferred_date', 'photo', 'image_base64', 'created_at'
        ]
        read_only_fields = ['id', 'booking_id', 'created_at']

    def validate_aadhaar(self, value):
        """Validate Aadhaar number format"""
        if value:
            value = value.strip()
            if not value.isdigit():
                raise serializers.ValidationError("Aadhaar number must contain only digits")
            if len(value) != 12:
                raise serializers.ValidationError("Aadhaar number must be exactly 12 digits")
        else:
            raise serializers.ValidationError("Aadhaar number is required")
        return value

    def get_image_base64(self, obj):
        if obj.image_data:
            return f"data:{obj.image_type};base64,{base64.b64encode(obj.image_data).decode('utf-8')}"
        return None

    def create(self, validated_data):
        upload = validated_data.pop('photo')
        image_data = upload.read()
        instance = PoojaBooking(**validated_data)
        instance.image_data = image_data
        instance.image_name = upload.name
        instance.image_type = getattr(upload, 'content_type', 'application/octet-stream')
        if not instance.booking_id:
            from uuid import uuid4
            instance.booking_id = f"PJ{uuid4().hex[:10].upper()}"
        instance.save()
        return instance


class DonationSerializer(serializers.ModelSerializer):
    photo = serializers.ImageField(write_only=True, required=False)
    image_base64 = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Donation
        fields = [
            'id', 'donation_id', 'full_name', 'email', 'mobile', 'category', 'message',
            'amount', 'payment_method', 'transaction_reference',
            'photo', 'image_base64', 'created_at'
        ]
        read_only_fields = ['id', 'donation_id', 'created_at']

    def get_image_base64(self, obj):
        if obj.image_data:
            return f"data:{obj.image_type};base64,{base64.b64encode(obj.image_data).decode('utf-8')}"
        return None

    def create(self, validated_data):
        upload = validated_data.pop('photo', None)
        instance = Donation(**validated_data)
        
        if upload:
            instance.image_data = upload.read()
            instance.image_name = upload.name
            instance.image_type = getattr(upload, 'content_type', 'application/octet-stream')

        if not instance.donation_id:
            from uuid import uuid4
            instance.donation_id = f"DN{uuid4().hex[:10].upper()}"
            
        instance.save()
        return instance
