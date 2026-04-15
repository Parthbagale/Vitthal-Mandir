from django.db import models
from django.conf import settings
import base64


class PassBooking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='pass_bookings')
    booking_id = models.CharField(max_length=32, unique=True)

    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    mobile = models.CharField(max_length=20)
    aadhaar = models.CharField(max_length=12, null=True, blank=True)
    children_count = models.PositiveIntegerField(default=0)
    gender = models.CharField(max_length=16)

    darshan_date = models.DateField()
    slot = models.CharField(max_length=64)

    # Store image as binary in DB (not as a file path)
    image_data = models.BinaryField(null=True, blank=True)
    image_name = models.CharField(max_length=255, null=True, blank=True)
    image_type = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pass_booking'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking_id} - {self.full_name}"

    def image_as_base64(self):
        if self.image_data:
            return base64.b64encode(self.image_data).decode('utf-8')
        return None


class PoojaBooking(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='pooja_bookings')
    booking_id = models.CharField(max_length=32, unique=True)

    # Pooja details
    pooja_type = models.CharField(max_length=128)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    mobile = models.CharField(max_length=20)
    aadhaar = models.CharField(max_length=12, null=True, blank=True)
    preferred_date = models.DateField()

    # Store image as binary
    image_data = models.BinaryField(null=True, blank=True)
    image_name = models.CharField(max_length=255, null=True, blank=True)
    image_type = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'pooja_booking'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.booking_id} - {self.full_name} - {self.pooja_type}"

    def image_as_base64(self):
        if self.image_data:
            return base64.b64encode(self.image_data).decode('utf-8')
        return None


class EntryVerification(models.Model):
    METHOD_CHOICES = [
        ("manual", "Manual"),
        ("qr_scan", "QR Scan"),
        ("face_recognition", "Face Recognition"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    booking = models.ForeignKey(
        PassBooking, on_delete=models.SET_NULL, null=True, blank=True, related_name="verifications"
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="entry_verifications"
    )
    method = models.CharField(max_length=32, choices=METHOD_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    match_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    # Optional evidence snapshot stored as binary (e.g., JPEG/PNG)
    evidence_image_data = models.BinaryField(null=True, blank=True)
    evidence_image_type = models.CharField(max_length=64, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "entry_verification"
        ordering = ["-created_at"]

    def __str__(self):
        bk = getattr(self.booking, "booking_id", None) or "-"
        return f"Verification({bk}) - {self.method} - {self.status}"


class PoojaVerification(models.Model):
    """
    Track verification/entry for Pooja bookings to ensure one-time entry only
    """
    METHOD_CHOICES = [
        ("manual", "Manual"),
        ("qr_scan", "QR Scan"),
        ("face_recognition", "Face Recognition"),
    ]

    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("approved", "Approved"),
        ("rejected", "Rejected"),
    ]

    pooja_booking = models.ForeignKey(
        PoojaBooking, on_delete=models.CASCADE, related_name="verifications"
    )
    verified_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="pooja_verifications"
    )
    method = models.CharField(max_length=32, choices=METHOD_CHOICES)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="pending")
    match_score = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    notes = models.TextField(null=True, blank=True)

    # Optional evidence snapshot stored as binary (e.g., JPEG/PNG)
    evidence_image_data = models.BinaryField(null=True, blank=True)
    evidence_image_type = models.CharField(max_length=64, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "pooja_verification"
        ordering = ["-created_at"]

    def __str__(self):
        bk = getattr(self.pooja_booking, "booking_id", None) or "-"
        return f"PoojaVerification({bk}) - {self.method} - {self.status}"


class BhaktaNivasPhoto(models.Model):
    # Owner
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='bhaktnivas_photos')
    # snapshot of booking details (denormalized) so that all details live in this table too
    booking_code = models.CharField(max_length=32, null=True, blank=True)
    full_name = models.CharField(max_length=255, null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    mobile = models.CharField(max_length=20, null=True, blank=True)
    aadhaar = models.CharField(max_length=12, null=True, blank=True)
    children_count = models.PositiveIntegerField(default=0)
    gender = models.CharField(max_length=16, null=True, blank=True)
    room_type = models.CharField(max_length=64, null=True, blank=True)
    ac_type = models.CharField(max_length=16, null=True, blank=True)
    people_count = models.PositiveIntegerField(default=1)
    member_names = models.TextField(blank=True, default="")
    checkin_date = models.DateField(null=True, blank=True)
    checkin_time = models.TimeField(null=True, blank=True)
    checkout_date = models.DateField(null=True, blank=True)
    checkout_time = models.TimeField(null=True, blank=True)

    # image binary
    image_data = models.BinaryField(null=True, blank=True)
    image_name = models.CharField(max_length=255, null=True, blank=True)
    image_type = models.CharField(max_length=100, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'bhaktnivas_photo'
        ordering = ['created_at']

    def __str__(self):
        return f"Photo({self.image_name}) for {self.booking_code}"


class Donation(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='donations')
    donation_id = models.CharField(max_length=32, unique=True)
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    mobile = models.CharField(max_length=20)
    category = models.CharField(max_length=128)
    message = models.TextField(blank=True, null=True)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_method = models.CharField(max_length=64, blank=True, null=True)
    transaction_reference = models.CharField(max_length=128, blank=True, null=True)

    image_data = models.BinaryField(null=True, blank=True)
    image_name = models.CharField(max_length=255, null=True, blank=True)
    image_type = models.CharField(max_length=100, null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'donation'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.donation_id} - {self.full_name} - ₹{self.amount}"

    def image_as_base64(self):
        if self.image_data:
            return base64.b64encode(self.image_data).decode('utf-8')
        return None


class DailyCapacity(models.Model):
    date = models.DateField(db_index=True)
    slot = models.CharField(max_length=64)
    total_capacity = models.PositiveIntegerField(default=30)
    booked_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'daily_capacity'
        ordering = ['date', 'slot']
        unique_together = [('date', 'slot')]

    def __str__(self):
        return f"{self.date} - {self.slot}: {self.booked_count}/{self.total_capacity}"

    @property
    def remaining(self):
        return max(self.total_capacity - self.booked_count, 0)

