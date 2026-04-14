from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action, api_view, permission_classes, authentication_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from .models import PassBooking, PoojaBooking, EntryVerification, BhaktaNivasPhoto, DailyCapacity
from .serializers import PassBookingSerializer, PoojaBookingSerializer, EntryVerificationSerializer, BhaktaNivasPhotoSerializer
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
from PIL import Image, ImageDraw, ImageFont
import io
import qrcode
import base64
from .sms_utils import generate_sms_otp, send_sms_otp, store_sms_otp, verify_sms_otp, can_send_otp, increment_otp_attempts

from datetime import datetime, timedelta
import calendar

from django.db.models import Count
from django.db.models.functions import TruncDate, TruncMonth
from django.utils import timezone
from uuid import uuid4
import numpy as np
import cv2
import base64
import os
from decimal import Decimal
from django.db import transaction
from pathlib import Path
from urllib.request import urlretrieve


class PassBookingViewSet(viewsets.ModelViewSet):
    queryset = PassBooking.objects.all()
    serializer_class = PassBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Allow unauthenticated access for gate-side face verification for pass bookings
        # and for checking availability
        action = getattr(self, 'action', None)
        print(f"[PERMISSIONS] Action: {action}, Request path: {self.request.path if hasattr(self, 'request') else 'N/A'}")
        
        if action in ['verify_face', 'availability']:
            print(f"[PERMISSIONS] Allowing unauthenticated access for action: {action}")
            return [permissions.AllowAny()]
        
        print(f"[PERMISSIONS] Requiring authentication for action: {action}")
        return super().get_permissions()

    def get_queryset(self):
        # Return bookings for the authenticated user only
        if self.request and self.request.user.is_authenticated:
            return PassBooking.objects.filter(user=self.request.user)
        return PassBooking.objects.none()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Validate Aadhaar from form data
        aadhaar = data.get('aadhaar', '').strip()
        if not aadhaar:
            return Response(
                {'detail': 'Aadhaar card number is required for booking.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not aadhaar.isdigit() or len(aadhaar) != 12:
            return Response(
                {'detail': 'Please enter a valid 12-digit Aadhaar number.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure booking_id is generated server-side
        data['booking_id'] = f"PS{uuid4().hex[:10].upper()}"
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        # Enforce per-slot capacity: max 180 per (darshan_date, slot)
        darshan_date = serializer.validated_data.get('darshan_date')
        slot = serializer.validated_data.get('slot')
        CAPACITY_PER_SLOT = 180
        
        if darshan_date and slot:
            # Prevent same user from booking the same date+slot twice
            if PassBooking.objects.filter(user=request.user, darshan_date=darshan_date, slot=slot).exists():
                return Response(
                    {
                        'detail': 'You have already booked this date and time slot. Please choose a different date or time.',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Use atomic transaction to prevent race conditions
            with transaction.atomic():
                # Get or create capacity record with select_for_update to lock the row
                capacity, created = DailyCapacity.objects.select_for_update().get_or_create(
                    date=darshan_date,
                    slot=slot,
                    defaults={'total_capacity': CAPACITY_PER_SLOT, 'booked_count': 0}
                )
                
                print(f"[BOOKING] DailyCapacity before: booked_count={capacity.booked_count}, created={created}")
                
                # Check if capacity is available
                if capacity.booked_count >= capacity.total_capacity:
                    return Response(
                        {
                            'detail': 'Selected slot is full.',
                            'slot': slot,
                            'darshan_date': str(darshan_date),
                            'capacity': capacity.total_capacity,
                            'booked': capacity.booked_count,
                            'remaining': 0,
                        },
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                
                # Create the booking
                instance = serializer.save()
                instance.user = request.user
                instance.save()
                
                # Increment the booked count atomically
                capacity.booked_count += 1
                capacity.save()
                
                print(f"[BOOKING] DailyCapacity after: booked_count={capacity.booked_count}")

        else:
            # If no date/slot validation needed, just create
            instance = serializer.save()
            instance.user = request.user
            instance.save()

        try:
            
            # Send Email Notification with Image Attachment
            if instance.email:
                try:
                    # Generate Complex Token Image
                    details = {
                        'booking_id': instance.booking_id,
                        'name': instance.full_name,
                        'email': instance.email,
                        'mobile': instance.mobile,
                        'gender': instance.gender,
                        'slot': instance.slot,
                        'date': str(instance.darshan_date)
                    }
                    photo_bytes = instance.image_data
                    
                    # Canvas
                    width, height = 800, 750
                    bg_color = (250, 250, 250)
                    img = Image.new('RGB', (width, height), color=bg_color)
                    draw = ImageDraw.Draw(img)

                    # Fonts
                    try:
                        font_title = ImageFont.truetype("arialbd.ttf", 22)
                        font_subtitle = ImageFont.truetype("arial.ttf", 16)
                        font_label = ImageFont.truetype("arialbd.ttf", 16)
                        font_value = ImageFont.truetype("arial.ttf", 16)
                        font_id = ImageFont.truetype("arialbd.ttf", 18)
                    except IOError:
                        font_title = ImageFont.load_default()
                        font_subtitle = ImageFont.load_default()
                        font_label = ImageFont.load_default()
                        font_value = ImageFont.load_default()
                        font_id = ImageFont.load_default()

                    # Layout colors
                    box_bg = (255, 255, 255)
                    box_outline = (220, 220, 220)
                    text_color = (50, 50, 50)
                    label_color = (100, 100, 100)

                    # 1. Header
                    try:
                        logo_path = Path(settings.BASE_DIR).parent / 'Frontend' / 'static' / 'images' / 'mandir logo.jpg'
                        logo = Image.open(str(logo_path)).convert('RGBA')
                        logo_size = (60, 60)
                        logo.thumbnail(logo_size)

                        # Create circular mask to match the placeholder circle style
                        mask = Image.new('L', logo.size, 0)
                        mdraw = ImageDraw.Draw(mask)
                        mdraw.ellipse((0, 0, logo.size[0] - 1, logo.size[1] - 1), fill=255)

                        target_w, target_h = logo_size
                        x0, y0 = 30, 30
                        px = x0 + (target_w - logo.size[0]) // 2
                        py = y0 + (target_h - logo.size[1]) // 2
                        img.paste(logo, (px, py, px + logo.size[0], py + logo.size[1]), mask)

                        # Border ring
                        draw.ellipse((30, 30, 90, 90), outline=(200, 180, 100), width=2)
                    except Exception:
                        draw.ellipse((30, 30, 90, 90), fill=(240, 220, 150), outline=(200, 180, 100), width=2)
                    draw.text((110, 35), "Shri Vitthal Rukmini Mandir, Pandharpur", fill=(0,0,0), font=font_title)
                    draw.text((110, 65), "Darshan Pass Receipt", fill=label_color, font=font_subtitle)
                    
                    # Header Right
                    draw.text((650, 35), "Booking ID", fill=label_color, font=font_subtitle)
                    draw.text((640, 55), details['booking_id'], fill=(0,0,0), font=font_id)
                    issued_time = datetime.now().strftime("%d-%m-%Y %H:%M")
                    draw.text((600, 80), f"Issued: {issued_time}", fill=label_color, font=font_subtitle)

                    # 2. Divider
                    draw.line((30, 110, width-30, 110), fill=box_outline, width=1)

                    def draw_box(xy, title=None):
                        draw.rounded_rectangle(xy, radius=10, fill=box_bg, outline=box_outline, width=1)
                        if title:
                            draw.text((xy[0]+20, xy[1]+20), title, fill=text_color, font=font_title)

                    # 3. Devotee Details Box
                    draw_box([30, 130, 480, 430], "Devotee Details")
                    labels = ["Name", "Email", "Mobile", "Gender", "Slot Time", "Darshan Date"]
                    values = [details['name'], details['email'], details['mobile'], details['gender'], details['slot'], details['date']]
                    
                    y_offset = 180
                    for label, val in zip(labels, values):
                        draw.text((50, y_offset), label, fill=label_color, font=font_label)
                        draw.text((220, y_offset), str(val), fill=text_color, font=font_value)
                        y_offset += 40

                    # 4. Photo Box
                    draw_box([500, 130, 770, 380], "Photo")
                    if photo_bytes:
                        try:
                            user_photo = Image.open(io.BytesIO(photo_bytes)).convert("RGB")
                            user_photo.thumbnail((230, 200)) # fit within box
                            px = 500 + (270 - user_photo.width) // 2
                            py = 170 + (210 - user_photo.height) // 2
                            img.paste(user_photo, (px, py, px + user_photo.width, py + user_photo.height))
                        except Exception as e:
                            draw.text((520, 220), "Photo Error", fill=(255,0,0), font=font_label)

                    # 5. Instructions Box
                    draw_box([30, 450, 480, 600], "Instructions")
                    instructions = "Please carry this pass on the day\nof darshan. "
                    iy = 500
                    for line in instructions.split('\n'):
                        draw.text((50, iy), line, fill=label_color, font=font_value)
                        iy += 25

                    # 6. QR Code Box
                    draw_box([500, 400, 770, 600], "QR Code")
                    qr = qrcode.QRCode(box_size=5, border=1)
                    qr.add_data(details['booking_id'])
                    qr.make(fit=True)
                    qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
                    px = 500 + (270 - qr_img.width) // 2
                    py = 440 + (160 - qr_img.height) // 2
                    img.paste(qr_img, (px, py, px + qr_img.width, py + qr_img.height))

                    # 7. Footer
                    draw.line((30, 640, width-30, 640), fill=box_outline, width=1)
                    draw.text((30, 670), "Thank you for booking your darshan pass.", fill=label_color, font=font_subtitle)
                    draw.rounded_rectangle([620, 655, 760, 695], radius=8, fill=(138, 43, 226))
                    draw.text((645, 665), "Print Pass", fill=(255, 255, 255), font=font_label)
                    
                    # Save image to memory buffer
                    img_buffer = io.BytesIO()
                    img.save(img_buffer, format='PNG')
                    img_buffer.seek(0)
                    
                    # Create email message
                    subject = 'Darshan Pass Ticket - Shri Vitthal Rukmini Mandir'
                    message = f'Dear {instance.full_name},\n\nYour Darshan Pass has been successfully booked. Please find your detailed ticket attached.\n\nPass Booking ID: {instance.booking_id}\n\nRegards,\nShri Vitthal Rukmini Mandir Trust'
                    
                    email_msg = EmailMessage(
                        subject,
                        message,
                        settings.DEFAULT_FROM_EMAIL,
                        [instance.email],
                    )
                    
                    # Attach the constructed image
                    email_msg.attach(f'{instance.booking_id}_ticket.png', img_buffer.read(), 'image/png')
                    email_msg.send(fail_silently=False)
                    
                except Exception as e:
                    print(f"Failed to send Pass Booking email with image: {e}")
                    
            headers = self.get_success_headers(serializer.data)
            return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED, headers=headers)
        except Exception as e:
            # Return JSON error instead of HTML 500 page so frontend can show a clear message
            return Response({
                'detail': 'Error creating booking',
                'error': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

    # Note: pass verification endpoint is in Verify_entry.html hitting /passes/verify-face/.
    # Implement verify_face for PassBooking similar to PoojaBookingViewSet but using pass booking image.

    @action(detail=False, methods=['post'], url_path='verify-face', permission_classes=[permissions.AllowAny])
    def verify_face(self, request):
        """
        Compare a live-captured image with the stored pass booking image.
        Accepts multipart file field 'image' or JSON 'image_data_url' and requires 'booking_id'.
        Returns match, similarity, distance, threshold.
        """
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({'detail': 'booking_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = PassBooking.objects.get(booking_id=booking_id)
        except PassBooking.DoesNotExist:
            return Response({'detail': 'Invalid booking_id'}, status=status.HTTP_404_NOT_FOUND)

        booking_details = {
            'service': 'pass',
            'purpose': 'Darshan Pass',
            'booking_id': booking.booking_id,
            'full_name': booking.full_name,
            'email': booking.email,
            'mobile': booking.mobile,
            'children_count': booking.children_count,
            'gender': booking.gender,
            'darshan_date': booking.darshan_date.isoformat() if booking.darshan_date else None,
            'slot': booking.slot,
        }

        # One-time entry enforcement: if already approved once, block further attempts.
        if EntryVerification.objects.filter(booking=booking, status='approved').exists():
            return Response(
                {
                    'detail': 'Entry already used for this booking_id',
                    'entry_used': True,
                    'entry_allowed': False,
                    'booking_details': booking_details,
                },
                status=status.HTTP_409_CONFLICT,
            )

        if not booking.image_data:
            return Response({'detail': 'No stored image for this booking'}, status=status.HTTP_400_BAD_REQUEST)

        # decode stored image
        try:
            stored_np = np.frombuffer(booking.image_data, np.uint8)
            stored_img = cv2.imdecode(stored_np, cv2.IMREAD_COLOR)
        except Exception as e:
            return Response({'detail': f'Error decoding stored image: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # decode uploaded image
        uploaded_img = None
        if 'image' in request.FILES:
            up_bytes = request.FILES['image'].read()
            up_np = np.frombuffer(up_bytes, np.uint8)
            uploaded_img = cv2.imdecode(up_np, cv2.IMREAD_COLOR)
        else:
            data_url = request.data.get('image_data_url')
            if data_url and ',' in data_url:
                try:
                    base64_part = data_url.split(',', 1)[1]
                    up_bytes = base64.b64decode(base64_part)
                    up_np = np.frombuffer(up_bytes, np.uint8)
                    uploaded_img = cv2.imdecode(up_np, cv2.IMREAD_COLOR)
                except Exception as e:
                    return Response({'detail': f'Invalid image_data_url: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_img is None:
            return Response({'detail': 'No image provided. Send file field "image" or "image_data_url".'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            models_dir = Path(__file__).resolve().parent / 'models'
            models_dir.mkdir(parents=True, exist_ok=True)
            yunet_path = models_dir / 'face_detection_yunet_2023mar.onnx'
            sface_path = models_dir / 'face_recognition_sface_2021dec.onnx'

            if not yunet_path.exists():
                urlretrieve('https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx', str(yunet_path))
            if not sface_path.exists():
                urlretrieve('https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx', str(sface_path))

            def create_detector(width: int, height: int):
                det = cv2.FaceDetectorYN_create(str(yunet_path), "", (width, height), score_threshold=0.6, nms_threshold=0.3, top_k=5000)
                return det

            recognizer = cv2.FaceRecognizerSF_create(str(sface_path), "")

            def detect_best_face(bgr_img: np.ndarray):
                h, w = bgr_img.shape[:2]
                detector = create_detector(w, h)
                detector.setInputSize((w, h))
                retval, faces = detector.detect(bgr_img)
                if faces is None or len(faces) == 0:
                    return None
                areas = faces[:, 2] * faces[:, 3]
                idx = int(np.argmax(areas))
                return faces[idx]

            f_stored = detect_best_face(stored_img)
            if f_stored is None:
                return Response({'detail': 'No face detected in stored booking image.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            f_uploaded = detect_best_face(uploaded_img)
            if f_uploaded is None:
                return Response({'detail': 'No face detected in uploaded image.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

            aligned1 = recognizer.alignCrop(stored_img, f_stored)
            aligned2 = recognizer.alignCrop(uploaded_img, f_uploaded)
            feat1 = recognizer.feature(aligned1)
            feat2 = recognizer.feature(aligned2)

            def l2norm(v):
                n = np.linalg.norm(v) + 1e-8
                return v / n
            f1 = l2norm(feat1.flatten())
            f2 = l2norm(feat2.flatten())
            similarity = float(np.dot(f1, f2))
            distance = float(1.0 - similarity)
            threshold = 0.40
            match = distance < threshold

            # Default response shape
            payload = {
                'booking_id': booking_id,
                'match': bool(match),
                'distance': distance,
                'threshold': threshold,
                'similarity': similarity,
                'booking_details': booking_details,
                'entry_used': False,
            }

            if not match:
                payload['entry_allowed'] = False
                payload['entry_message'] = 'Face did not match.'
                return Response(payload, status=status.HTTP_200_OK)

            # Slot/date validity enforcement (server-side)
            def _parse_time_12h(s: str):
                s = (s or '').strip().upper()
                try:
                    return datetime.strptime(s, '%I:%M %p').time()
                except Exception:
                    return None

            def _parse_slot(slot_str: str):
                if not slot_str or '-' not in slot_str:
                    return None
                start_s, end_s = [p.strip() for p in slot_str.split('-', 1)]
                st = _parse_time_12h(start_s)
                en = _parse_time_12h(end_s)
                if not st or not en:
                    return None
                return st, en

            today = timezone.localdate()
            if booking.darshan_date != today:
                payload['entry_allowed'] = False
                if booking.darshan_date and booking.darshan_date < today:
                    payload['entry_message'] = 'Your time slot is over.'
                else:
                    payload['entry_message'] = 'This is not your time slot. Your darshan date is not today.'
                return Response(payload, status=status.HTTP_200_OK)

            slot_range = _parse_slot(booking.slot)
            if not slot_range:
                payload['entry_allowed'] = False
                payload['entry_message'] = 'Invalid slot format for this booking.'
                return Response(payload, status=status.HTTP_200_OK)

            now_t = timezone.localtime().time()
            slot_start, slot_end = slot_range
            if now_t < slot_start:
                payload['entry_allowed'] = False
                payload['entry_message'] = 'This is not your time slot.'
                return Response(payload, status=status.HTTP_200_OK)
            if now_t > slot_end:
                payload['entry_allowed'] = False
                payload['entry_message'] = 'Your time slot is over.'
                return Response(payload, status=status.HTTP_200_OK)

            # Record entry (one-time) after match + valid slot.
            evidence_bytes = None
            evidence_type = None
            try:
                if 'image' in request.FILES:
                    evidence_bytes = up_bytes
                    evidence_type = getattr(request.FILES['image'], 'content_type', None)
                elif request.data.get('image_data_url') and ',' in request.data.get('image_data_url'):
                    base64_part = request.data.get('image_data_url').split(',', 1)[1]
                    evidence_bytes = base64.b64decode(base64_part)
                    evidence_type = 'image/jpeg'
            except Exception:
                evidence_bytes = None
                evidence_type = None

            with transaction.atomic():
                if EntryVerification.objects.select_for_update().filter(booking=booking, status='approved').exists():
                    return Response(
                        {
                            'detail': 'Entry already used for this booking_id',
                            'entry_used': True,
                            'entry_allowed': False,
                            'booking_details': booking_details,
                        },
                        status=status.HTTP_409_CONFLICT,
                    )

                ev = EntryVerification.objects.create(
                    booking=booking,
                    verified_by=request.user if getattr(request.user, 'is_authenticated', False) else None,
                    method='face_recognition',
                    status='approved',
                    match_score=Decimal(str(round(similarity * 100, 2))),
                    evidence_image_data=evidence_bytes,
                    evidence_image_type=evidence_type,
                    notes='Auto-approved by face verification.',
                )

            payload['entry_allowed'] = True
            payload['entry_message'] = 'Entry recorded. Access granted.'
            payload['entry_verification_id'] = ev.id
            return Response(payload, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Face verification error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class BhaktaNivasViewSet(viewsets.ModelViewSet):
    queryset = BhaktaNivasPhoto.objects.all()
    serializer_class = BhaktaNivasPhotoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        # Allow unauthenticated access for gate-side verification
        if getattr(self, 'action', None) in ['verify_face']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    def get_queryset(self):
        # Return photo rows for the authenticated user
        if self.request and self.request.user.is_authenticated:
            return BhaktaNivasPhoto.objects.filter(user=self.request.user)
        return BhaktaNivasPhoto.objects.none()

    def create(self, request, *args, **kwargs):
        # Validate Aadhaar from form data
        aadhaar = request.data.get('aadhaar', '').strip()
        if not aadhaar:
            return Response(
                {'detail': 'Aadhaar card number is required for booking.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not aadhaar.isdigit() or len(aadhaar) != 12:
            return Response(
                {'detail': 'Please enter a valid 12-digit Aadhaar number.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Accepts same fields as before, stores all details per-row in bhaktnivas_photo
        data = request.data
        booking_code = f"BK{uuid4().hex[:10].upper()}"
        # collect common fields
        common = {
            'user': request.user,
            'booking_code': booking_code,
            'full_name': data.get('full_name'),
            'email': data.get('email'),
            'mobile': data.get('mobile'),
            'aadhaar': data.get('aadhaar'),
            'children_count': data.get('children_count') or 0,
            'gender': data.get('gender'),
            'room_type': data.get('room_type') or data.get('slot'),
            'ac_type': data.get('ac_type'),
            'people_count': data.get('people_count') or 1,
            'member_names': data.get('member_names') or '',
            'checkin_date': data.get('checkin_date'),
            'checkin_time': data.get('checkin_time'),
            'checkout_date': data.get('checkout_date'),
            'checkout_time': data.get('checkout_time'),
        }

        created_rows = []
        files = request.FILES.getlist('photos')

        # Prevent same user from booking the same room type on the same check-in date
        checkin_date = data.get('checkin_date')
        room_type = data.get('room_type') or data.get('slot')
        
        if checkin_date and room_type:
            if BhaktaNivasPhoto.objects.filter(
                user=request.user, 
                checkin_date=checkin_date, 
                room_type=room_type
            ).exists():
                return Response(
                    {'detail': 'You have already booked this room type for this check-in date. Please choose a different date or room type.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        try:
            if files:
                for pf in files:
                    row = BhaktaNivasPhoto.objects.create(
                        **common,
                        image_data=pf.read(),
                        image_name=pf.name,
                        image_type=getattr(pf, 'content_type', 'application/octet-stream'),
                    )
                    created_rows.append(row)
            else:
                # create a placeholder row without image
                row = BhaktaNivasPhoto.objects.create(**common)
                created_rows.append(row)
        except Exception as e:
            return Response({'detail': 'Error creating Bhakta Nivas booking', 'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Build response compatible with previous frontend expectations
        photos_ser = BhaktaNivasPhotoSerializer(created_rows, many=True)
        
        # Send Email Notification
        if common.get('email'):
            try:
                # Generate Complex Token Image
                img = Image.new('RGB', (800, 750), color=(250, 250, 250))
                draw = ImageDraw.Draw(img)

                try:
                    font_title = ImageFont.truetype("arialbd.ttf", 22)
                    font_subtitle = ImageFont.truetype("arial.ttf", 16)
                    font_label = ImageFont.truetype("arialbd.ttf", 16)
                    font_value = ImageFont.truetype("arial.ttf", 16)
                    font_id = ImageFont.truetype("arialbd.ttf", 18)
                except IOError:
                    font_title = ImageFont.load_default()
                    font_subtitle = ImageFont.load_default()
                    font_label = ImageFont.load_default()
                    font_value = ImageFont.load_default()
                    font_id = ImageFont.load_default()

                box_bg = (255, 255, 255)
                box_outline = (220, 220, 220)
                text_color = (50, 50, 50)
                label_color = (100, 100, 100)

                try:
                    logo_path = Path(settings.BASE_DIR).parent / 'Frontend' / 'static' / 'images' / 'mandir logo.jpg'
                    logo = Image.open(str(logo_path)).convert('RGBA')
                    logo_size = (60, 60)
                    logo.thumbnail(logo_size)

                    mask = Image.new('L', logo.size, 0)
                    mdraw = ImageDraw.Draw(mask)
                    mdraw.ellipse((0, 0, logo.size[0] - 1, logo.size[1] - 1), fill=255)

                    target_w, target_h = logo_size
                    x0, y0 = 30, 30
                    px = x0 + (target_w - logo.size[0]) // 2
                    py = y0 + (target_h - logo.size[1]) // 2
                    img.paste(logo, (px, py, px + logo.size[0], py + logo.size[1]), mask)

                    draw.ellipse((30, 30, 90, 90), outline=(200, 180, 100), width=2)
                except Exception:
                    draw.ellipse((30, 30, 90, 90), fill=(240, 220, 150), outline=(200, 180, 100), width=2)
                draw.text((110, 35), "Shri Vitthal Rukmini Mandir, Pandharpur", fill=(0,0,0), font=font_title)
                draw.text((110, 65), "Bhakta Nivas Booking Receipt", fill=label_color, font=font_subtitle)
                
                draw.text((650, 35), "Booking ID", fill=label_color, font=font_subtitle)
                draw.text((640, 55), booking_code, fill=(0,0,0), font=font_id)
                issued_time = datetime.now().strftime("%d-%m-%Y %H:%M")
                draw.text((600, 80), f"Issued: {issued_time}", fill=label_color, font=font_subtitle)

                draw.line((30, 110, 800-30, 110), fill=box_outline, width=1)

                def draw_box(xy, title=None):
                    draw.rounded_rectangle(xy, radius=10, fill=box_bg, outline=box_outline, width=1)
                    if title:
                        draw.text((xy[0]+20, xy[1]+20), title, fill=text_color, font=font_title)

                draw_box([30, 130, 480, 430], "Booking Details")
                labels = ["Name", "Email", "Mobile", "Room Type", "Check-in", "Check-out"]
                values = [
                    common.get('full_name', ''),
                    common.get('email', ''),
                    common.get('mobile', ''),
                    common.get('room_type', ''),
                    f"{common.get('checkin_date', '')} {common.get('checkin_time', '')}",
                    f"{common.get('checkout_date', '')} {common.get('checkout_time', '')}"
                ]
                y_offset = 180
                for label, val in zip(labels, values):
                    draw.text((50, y_offset), label, fill=label_color, font=font_label)
                    draw.text((220, y_offset), str(val), fill=text_color, font=font_value)
                    y_offset += 40

                draw_box([500, 130, 770, 380], "Photo")
                photo_bytes = None
                if created_rows and created_rows[0].image_data:
                    photo_bytes = created_rows[0].image_data
                if photo_bytes:
                    try:
                        user_photo = Image.open(io.BytesIO(photo_bytes)).convert("RGB")
                        user_photo.thumbnail((230, 200))
                        px = 500 + (270 - user_photo.width) // 2
                        py = 170 + (210 - user_photo.height) // 2
                        img.paste(user_photo, (px, py, px + user_photo.width, py + user_photo.height))
                    except Exception:
                        draw.text((520, 220), "Photo Error", fill=(255,0,0), font=font_label)

                draw_box([30, 450, 480, 600], "Instructions")
                instructions = "Please carry this receipt on the day\nof check-in.  "
                iy = 500
                for line in instructions.split('\n'):
                    draw.text((50, iy), line, fill=label_color, font=font_value)
                    iy += 25

                draw_box([500, 400, 770, 600], "QR Code")
                qr = qrcode.QRCode(box_size=5, border=1)
                qr.add_data(booking_code)
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
                px = 500 + (270 - qr_img.width) // 2
                py = 440 + (160 - qr_img.height) // 2
                img.paste(qr_img, (px, py, px + qr_img.width, py + qr_img.height))

                draw.line((30, 640, 800-30, 640), fill=box_outline, width=1)
                draw.text((30, 670), "Thank you for booking your stay.", fill=label_color, font=font_subtitle)
                draw.rounded_rectangle([620, 655, 760, 695], radius=8, fill=(138, 43, 226))
                draw.text((645, 665), "Print Receipt", fill=(255, 255, 255), font=font_label)

                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                img_buffer.seek(0)

                subject = 'Bhakta Nivas Booking Receipt - Shri Vitthal Rukmini Mandir'
                message = f"Dear {common.get('full_name')},\n\nYour Bhakta Nivas stay has been successfully booked. Please find your detailed receipt attached.\n\nBhakta Nivas Booking ID: {booking_code}\n\nRegards,\nShri Vitthal Rukmini Mandir Trust"
                email_msg = EmailMessage(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [common['email']],
                )
                email_msg.attach(f'{booking_code}_receipt.png', img_buffer.read(), 'image/png')
                email_msg.send(fail_silently=False)

            except Exception as e:
                print(f"Failed to send Bhakta Nivas email with image: {e}")
                # Fallback: send plain text email without image
                try:
                    plain_subject = 'Bhakta Nivas Booking Confirmed - Shri Vitthal Rukmini Mandir'
                    plain_message = (
                        f"Dear {common.get('full_name')},\n\n"
                        f"Your Bhakta Nivas booking is confirmed.\n\n"
                        f"Booking ID: {booking_code}\n"
                        f"Room Type: {common.get('room_type', '')}\n"
                        f"Check-in: {common.get('checkin_date', '')} {common.get('checkin_time', '')}\n"
                        f"Check-out: {common.get('checkout_date', '')} {common.get('checkout_time', '')}\n\n"
                        f"Regards,\nShri Vitthal Rukmini Mandir Trust"
                    )
                    from django.core.mail import send_mail
                    send_mail(plain_subject, plain_message, settings.DEFAULT_FROM_EMAIL, [common['email']], fail_silently=True)
                except Exception as e2:
                    print(f"Fallback plain email also failed: {e2}")

        first_img = None
        for r in created_rows:
            if r.image_data:
                first_img = BhaktaNivasPhotoSerializer(r).data.get('image_base64')
                if first_img:
                    break
        payload = {
            'booking_id': booking_code,
            'full_name': common['full_name'],
            'email': common['email'],
            'mobile': common['mobile'],
            'children_count': int(common['children_count']) if common['children_count'] else 0,
            'gender': common['gender'],
            'room_type': common['room_type'],
            'ac_type': common['ac_type'],
            'people_count': int(common['people_count']) if common['people_count'] else 1,
            'member_names': common['member_names'],
            'checkin_date': common['checkin_date'],
            'checkin_time': common['checkin_time'],
            'checkout_date': common['checkout_date'],
            'checkout_time': common['checkout_time'],
            'image_base64': first_img,
            'photos': photos_ser.data,
        }
        return Response(payload, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=['get'], url_path='availability', permission_classes=[permissions.AllowAny])
    def availability(self, request):
        """
        Query remaining capacity for a given darshan_date and slot.
        GET params: darshan_date=YYYY-MM-DD, slot=<string>
        Returns: {capacity, booked, remaining}
        """
        darshan_date = request.query_params.get('darshan_date')
        slot = request.query_params.get('slot')
        
        print(f"[AVAILABILITY] Request received: date={darshan_date}, slot={slot}")
        
        if not darshan_date or not slot:
            return Response({'detail': 'darshan_date and slot are required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Parse date to ensure valid format
            from datetime import date as _date
            parsed = _date.fromisoformat(darshan_date)
        except Exception:
            return Response({'detail': 'Invalid darshan_date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

        CAPACITY_PER_SLOT = 180
        
        # Try to get capacity from DailyCapacity model
        try:
            capacity = DailyCapacity.objects.get(date=parsed, slot=slot)
            booked = capacity.booked_count
            remaining = capacity.remaining
            print(f"[AVAILABILITY] Found in DailyCapacity: booked={booked}, remaining={remaining}")
        except DailyCapacity.DoesNotExist:
            # If no record exists yet, all slots are available
            booked = 0
            remaining = CAPACITY_PER_SLOT
            print(f"[AVAILABILITY] No DailyCapacity record found, returning defaults")
        
        response_data = {
            'capacity': CAPACITY_PER_SLOT, 
            'booked': booked, 
            'remaining': remaining, 
            'darshan_date': darshan_date, 
            'slot': slot
        }
        
        print(f"[AVAILABILITY] Returning: {response_data}")
        
        return Response(response_data)

    @action(detail=False, methods=['post'], url_path='verify-face', permission_classes=[permissions.AllowAny])
    def verify_face(self, request):
        """
        Compare a live-captured image with any stored Bhakta Nivas member photo for the booking.
        Accepts multipart file field 'image' or JSON 'image_data_url' and requires 'booking_id' (maps to booking_code).
        Returns match result with best similarity across all stored photos of the booking.
        """
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({'detail': 'booking_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        # Get all stored photos for this booking code
        photos_qs = BhaktaNivasPhoto.objects.filter(booking_code=booking_id)
        if not photos_qs.exists():
            return Response({'detail': 'Invalid booking_id or no photos found for this booking'}, status=status.HTTP_404_NOT_FOUND)

        first_row = photos_qs.first()
        booking_details = {
            'service': 'bhaktnivas',
            'purpose': 'Bhakta Nivas Stay',
            'booking_id': booking_id,
            'full_name': getattr(first_row, 'full_name', None),
            'email': getattr(first_row, 'email', None),
            'mobile': getattr(first_row, 'mobile', None),
            'children_count': getattr(first_row, 'children_count', None),
            'gender': getattr(first_row, 'gender', None),
            'room_type': getattr(first_row, 'room_type', None),
            'ac_type': getattr(first_row, 'ac_type', None),
            'people_count': getattr(first_row, 'people_count', None),
            'member_names': getattr(first_row, 'member_names', None),
            'checkin_date': first_row.checkin_date.isoformat() if getattr(first_row, 'checkin_date', None) else None,
            'checkin_time': first_row.checkin_time.isoformat() if getattr(first_row, 'checkin_time', None) else None,
            'checkout_date': first_row.checkout_date.isoformat() if getattr(first_row, 'checkout_date', None) else None,
            'checkout_time': first_row.checkout_time.isoformat() if getattr(first_row, 'checkout_time', None) else None,
        }

        # decode uploaded image
        uploaded_img = None
        if 'image' in request.FILES:
            up_bytes = request.FILES['image'].read()
            up_np = np.frombuffer(up_bytes, np.uint8)
            uploaded_img = cv2.imdecode(up_np, cv2.IMREAD_COLOR)
        else:
            data_url = request.data.get('image_data_url')
            if data_url and ',' in data_url:
                try:
                    base64_part = data_url.split(',', 1)[1]
                    up_bytes = base64.b64decode(base64_part)
                    up_np = np.frombuffer(up_bytes, np.uint8)
                    uploaded_img = cv2.imdecode(up_np, cv2.IMREAD_COLOR)
                except Exception as e:
                    return Response({'detail': f'Invalid image_data_url: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_img is None:
            return Response({'detail': 'No image provided. Send file field "image" or "image_data_url".'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            models_dir = Path(__file__).resolve().parent / 'models'
            models_dir.mkdir(parents=True, exist_ok=True)
            yunet_path = models_dir / 'face_detection_yunet_2023mar.onnx'
            sface_path = models_dir / 'face_recognition_sface_2021dec.onnx'

            if not yunet_path.exists():
                urlretrieve('https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx', str(yunet_path))
            if not sface_path.exists():
                urlretrieve('https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx', str(sface_path))

            def create_detector(width: int, height: int):
                det = cv2.FaceDetectorYN_create(str(yunet_path), "", (width, height), score_threshold=0.6, nms_threshold=0.3, top_k=5000)
                return det

            recognizer = cv2.FaceRecognizerSF_create(str(sface_path), "")

            def detect_best_face(bgr_img: np.ndarray):
                h, w = bgr_img.shape[:2]
                detector = create_detector(w, h)
                detector.setInputSize((w, h))
                retval, faces = detector.detect(bgr_img)
                if faces is None or len(faces) == 0:
                    return None
                areas = faces[:, 2] * faces[:, 3]
                idx = int(np.argmax(areas))
                return faces[idx]

            # Prepare uploaded face features
            f_uploaded = detect_best_face(uploaded_img)
            if f_uploaded is None:
                return Response({'detail': 'No face detected in uploaded image.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            aligned_up = recognizer.alignCrop(uploaded_img, f_uploaded)
            feat_up = recognizer.feature(aligned_up).flatten()

            def l2norm(v):
                n = np.linalg.norm(v) + 1e-8
                return v / n
            f_up = l2norm(feat_up)

            # Compare against all stored member photos for the booking
            best_similarity = -1.0
            best_distance = 2.0
            checked_any = False
            for p in photos_qs.iterator():
                if not p.image_data:
                    continue
                try:
                    stored_np = np.frombuffer(p.image_data, np.uint8)
                    stored_img = cv2.imdecode(stored_np, cv2.IMREAD_COLOR)
                    f_stored = detect_best_face(stored_img)
                    if f_stored is None:
                        continue
                    aligned_st = recognizer.alignCrop(stored_img, f_stored)
                    feat_st = recognizer.feature(aligned_st).flatten()
                    f_st = l2norm(feat_st)
                    sim = float(np.dot(f_st, f_up))
                    dist = float(1.0 - sim)
                    if sim > best_similarity:
                        best_similarity, best_distance = sim, dist
                    checked_any = True
                except Exception:
                    continue

            if not checked_any:
                return Response({'detail': 'No valid stored member photos to compare for this booking.'}, status=status.HTTP_400_BAD_REQUEST)

            threshold = 0.40
            match = best_distance < threshold
            return Response({'booking_id': booking_id, 'match': bool(match), 'distance': best_distance, 'threshold': threshold, 'similarity': best_similarity, 'booking_details': booking_details}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Face verification error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


class EntryVerificationViewSet(viewsets.ModelViewSet):
    queryset = EntryVerification.objects.select_related('booking', 'verified_by').all()
    serializer_class = EntryVerificationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        booking_id = self.request.query_params.get('booking_id') if self.request else None
        if booking_id:
            qs = qs.filter(booking__booking_id=booking_id)
        return qs

    def create(self, request, *args, **kwargs):
        data = request.data.copy()

        # Support using booking_id instead of raw PK
        booking_id = data.pop('booking_id', None)
        if booking_id:
            try:
                booking = PassBooking.objects.get(booking_id=booking_id)
                data['booking'] = booking.id
            except PassBooking.DoesNotExist:
                return Response({'detail': 'Invalid booking_id'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        serializer.save(verified_by=request.user)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=False, methods=['get'], url_path='stats')
    def stats(self, request):
        period = (request.query_params.get('period') or 'week').lower().strip()
        status_filter = (request.query_params.get('status') or '').lower().strip()

        qs = self.get_queryset()
        if status_filter:
            qs = qs.filter(status=status_filter)

        now = timezone.localtime(timezone.now())

        if period == 'year':
            tz = timezone.get_current_timezone()
            start = timezone.make_aware(datetime(now.year, 1, 1, 0, 0, 0), tz)
            end = timezone.make_aware(datetime(now.year + 1, 1, 1, 0, 0, 0), tz)

            buckets = (
                qs.filter(created_at__gte=start, created_at__lt=end)
                .annotate(bucket=TruncMonth('created_at'))
                .values('bucket')
                .annotate(count=Count('id'))
                .order_by('bucket')
            )

            month_to_count = {
                timezone.localtime(b['bucket']).strftime('%Y-%m'): b['count']
                for b in buckets
                if b.get('bucket')
            }

            labels = []
            counts = []
            for m in range(1, 13):
                labels.append(datetime(now.year, m, 1).strftime('%b'))
                key = f"{now.year}-{m:02d}"
                counts.append(int(month_to_count.get(key, 0)))

            return Response({'period': 'year', 'labels': labels, 'counts': counts})

        if period == 'month':
            start = now - timedelta(days=30)
        else:
            # Default: last 7 days
            period = 'week'
            start = now - timedelta(days=7)

        buckets = (
            qs.filter(created_at__gte=start)
            .annotate(bucket=TruncDate('created_at'))
            .values('bucket')
            .annotate(count=Count('id'))
            .order_by('bucket')
        )
        labels = [b['bucket'].strftime('%d %b') for b in buckets if b['bucket']]
        counts = [b['count'] for b in buckets]
        return Response({'period': period, 'labels': labels, 'counts': counts})


class PoojaBookingViewSet(viewsets.ModelViewSet):
    queryset = PoojaBooking.objects.all()
    serializer_class = PoojaBookingSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        if self.request and self.request.user.is_authenticated:
            return PoojaBooking.objects.filter(user=self.request.user)
        return PoojaBooking.objects.none()

    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        
        # Validate Aadhaar from form data
        aadhaar = data.get('aadhaar', '').strip()
        if not aadhaar:
            return Response(
                {'detail': 'Aadhaar card number is required for booking.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        if not aadhaar.isdigit() or len(aadhaar) != 12:
            return Response(
                {'detail': 'Please enter a valid 12-digit Aadhaar number.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate booking_id if not present
        data.setdefault('booking_id', f"PJ{uuid4().hex[:10].upper()}")
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)

        # Check if username (full_name) already exists for this user
        full_name = serializer.validated_data.get('full_name')
        if full_name and PoojaBooking.objects.filter(user=request.user, full_name=full_name).exists():
            return Response(
                {'detail': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        preferred_date = serializer.validated_data.get('preferred_date')
        pooja_type = serializer.validated_data.get('pooja_type')
        if preferred_date and pooja_type:
            existing_count = PoojaBooking.objects.filter(
                pooja_type=pooja_type,
                preferred_date=preferred_date,
            ).count()
            if existing_count >= 4:
                return Response(
                    {
                        'detail': 'Booking full: maximum 4 bookings are allowed for this pooja on the selected date.'
                    },
                    status=status.HTTP_409_CONFLICT,
                )

        instance = serializer.save()
        instance.user = request.user
        instance.save()

        # Send Email Notification
        if instance.email:
            try:
                # Generate Complex Token Image
                img = Image.new('RGB', (800, 750), color=(250, 250, 250))
                draw = ImageDraw.Draw(img)

                try:
                    font_title = ImageFont.truetype("arialbd.ttf", 22)
                    font_subtitle = ImageFont.truetype("arial.ttf", 16)
                    font_label = ImageFont.truetype("arialbd.ttf", 16)
                    font_value = ImageFont.truetype("arial.ttf", 16)
                    font_id = ImageFont.truetype("arialbd.ttf", 18)
                except IOError:
                    font_title = ImageFont.load_default()
                    font_subtitle = ImageFont.load_default()
                    font_label = ImageFont.load_default()
                    font_value = ImageFont.load_default()
                    font_id = ImageFont.load_default()

                box_bg = (255, 255, 255)
                box_outline = (220, 220, 220)
                text_color = (50, 50, 50)
                label_color = (100, 100, 100)

                try:
                    logo_path = Path(settings.BASE_DIR).parent / 'Frontend' / 'static' / 'images' / 'mandir logo.jpg'
                    logo = Image.open(str(logo_path)).convert('RGBA')
                    logo_size = (60, 60)
                    logo.thumbnail(logo_size)

                    mask = Image.new('L', logo.size, 0)
                    mdraw = ImageDraw.Draw(mask)
                    mdraw.ellipse((0, 0, logo.size[0] - 1, logo.size[1] - 1), fill=255)

                    target_w, target_h = logo_size
                    x0, y0 = 30, 30
                    px = x0 + (target_w - logo.size[0]) // 2
                    py = y0 + (target_h - logo.size[1]) // 2
                    img.paste(logo, (px, py, px + logo.size[0], py + logo.size[1]), mask)

                    draw.ellipse((30, 30, 90, 90), outline=(200, 180, 100), width=2)
                except Exception:
                    draw.ellipse((30, 30, 90, 90), fill=(240, 220, 150), outline=(200, 180, 100), width=2)
                draw.text((110, 35), "Shri Vitthal Rukmini Mandir, Pandharpur", fill=(0,0,0), font=font_title)
                draw.text((110, 65), "Pooja Booking Receipt", fill=label_color, font=font_subtitle)
                
                draw.text((650, 35), "Booking ID", fill=label_color, font=font_subtitle)
                draw.text((640, 55), instance.booking_id, fill=(0,0,0), font=font_id)
                issued_time = datetime.now().strftime("%d-%m-%Y %H:%M")
                draw.text((600, 80), f"Issued: {issued_time}", fill=label_color, font=font_subtitle)

                draw.line((30, 110, 800-30, 110), fill=box_outline, width=1)

                def draw_box(xy, title=None):
                    draw.rounded_rectangle(xy, radius=10, fill=box_bg, outline=box_outline, width=1)
                    if title:
                        draw.text((xy[0]+20, xy[1]+20), title, fill=text_color, font=font_title)

                draw_box([30, 130, 480, 430], "Devotee Details")
                labels = ["Name", "Email", "Mobile", "Pooja Type", "Preferred Date"]
                values = [
                    instance.full_name,
                    instance.email,
                    instance.mobile,
                    instance.pooja_type,
                    str(instance.preferred_date)
                ]
                y_offset = 180
                for label, val in zip(labels, values):
                    draw.text((50, y_offset), label, fill=label_color, font=font_label)
                    draw.text((220, y_offset), str(val), fill=text_color, font=font_value)
                    y_offset += 40

                draw_box([500, 130, 770, 380], "Photo")
                photo_bytes = instance.image_data
                if photo_bytes:
                    try:
                        user_photo = Image.open(io.BytesIO(photo_bytes)).convert("RGB")
                        user_photo.thumbnail((230, 200)) # fit within box
                        px = 500 + (270 - user_photo.width) // 2
                        py = 170 + (210 - user_photo.height) // 2
                        img.paste(user_photo, (px, py, px + user_photo.width, py + user_photo.height))
                    except Exception:
                        draw.text((520, 220), "Photo Error", fill=(255,0,0), font=font_label)

                draw_box([30, 450, 480, 600], "Instructions")
                instructions = "Please carry this receipt on the day\nof pooja. "
                iy = 500
                for line in instructions.split('\n'):
                    draw.text((50, iy), line, fill=label_color, font=font_value)
                    iy += 25

                draw_box([500, 400, 770, 600], "QR Code")
                qr = qrcode.QRCode(box_size=5, border=1)
                qr.add_data(instance.booking_id)
                qr.make(fit=True)
                qr_img = qr.make_image(fill_color="black", back_color="white").convert('RGB')
                px = 500 + (270 - qr_img.width) // 2
                py = 440 + (160 - qr_img.height) // 2
                img.paste(qr_img, (px, py, px + qr_img.width, py + qr_img.height))

                draw.line((30, 640, 800-30, 640), fill=box_outline, width=1)
                draw.text((30, 670), "Thank you for booking your pooja.", fill=label_color, font=font_subtitle)
                draw.rounded_rectangle([620, 655, 760, 695], radius=8, fill=(138, 43, 226))
                draw.text((645, 665), "Print Receipt", fill=(255, 255, 255), font=font_label)

                img_buffer = io.BytesIO()
                img.save(img_buffer, format='PNG')
                img_buffer.seek(0)
                
                subject = 'Pooja Booking Receipt - Shri Vitthal Rukmini Mandir'
                message = f'Dear {instance.full_name},\n\nYour Pooja has been successfully booked. Please find your detailed receipt attached.\n\nPooja Booking ID: {instance.booking_id}\n\nRegards,\nShri Vitthal Rukmini Mandir Trust'
                
                email_msg = EmailMessage(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [instance.email],
                )
                email_msg.attach(f'{instance.booking_id}_receipt.png', img_buffer.read(), 'image/png')
                email_msg.send(fail_silently=False)

            except Exception as e:
                print(f"Failed to send Pooja Booking email with image: {e}")
                # Fallback: send plain text email without image
                try:
                    plain_subject = 'Pooja Booking Confirmed - Shri Vitthal Rukmini Mandir'
                    plain_message = (
                        f"Dear {instance.full_name},\n\n"
                        f"Your Pooja booking is confirmed.\n\n"
                        f"Booking ID: {instance.booking_id}\n"
                        f"Pooja Type: {instance.pooja_type}\n"
                        f"Preferred Date: {instance.preferred_date}\n\n"
                        f"Regards,\nShri Vitthal Rukmini Mandir Trust"
                    )
                    from django.core.mail import send_mail
                    send_mail(plain_subject, plain_message, settings.DEFAULT_FROM_EMAIL, [instance.email], fail_silently=True)
                except Exception as e2:
                    print(f"Fallback plain email also failed: {e2}")

        headers = self.get_success_headers(serializer.data)
        return Response(self.get_serializer(instance).data, status=status.HTTP_201_CREATED, headers=headers)

    def get_permissions(self):
        # Allow unauthenticated access for gate-side face verification
        if getattr(self, 'action', None) in ['verify_face']:
            return [permissions.AllowAny()]
        return super().get_permissions()

    @action(detail=False, methods=['get'], url_path='availability')
    def availability(self, request):
        pooja_type = (request.query_params.get('pooja_type') or '').strip()
        year = request.query_params.get('year')
        month = request.query_params.get('month')

        if not pooja_type:
            return Response({'detail': 'pooja_type is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            year_i = int(year)
            month_i = int(month)
            if month_i < 1 or month_i > 12:
                raise ValueError('month out of range')
        except Exception:
            return Response({'detail': 'year and month are required as integers (month 1-12)'}, status=status.HTTP_400_BAD_REQUEST)

        start_date = datetime(year_i, month_i, 1).date()
        last_day = calendar.monthrange(year_i, month_i)[1]
        end_date = datetime(year_i, month_i, last_day).date()

        qs = (
            PoojaBooking.objects.filter(
                pooja_type=pooja_type,
                preferred_date__range=(start_date, end_date),
            )
            .values('preferred_date')
            .annotate(booked=Count('id'))
        )
        booked_map = {str(r['preferred_date']): int(r['booked'] or 0) for r in qs}

        CAPACITY = 4
        days = []
        for day in range(1, last_day + 1):
            d = datetime(year_i, month_i, day).date()
            iso = d.isoformat()
            booked = booked_map.get(iso, 0)
            days.append(
                {
                    'date': iso,
                    'booked': booked,
                    'capacity': CAPACITY,
                    'status': 'full' if booked >= CAPACITY else 'available',
                }
            )

        return Response({'pooja_type': pooja_type, 'year': year_i, 'month': month_i, 'days': days})

    @action(detail=False, methods=['post'], url_path='verify-face', permission_classes=[permissions.AllowAny])
    def verify_face(self, request):
        """
        Compare a live-captured image with the stored pooja booking image.
        Accepts multipart file field 'image' or JSON 'image_data_url' and requires 'booking_id'.
        Returns match, similarity, distance, threshold.
        Enforces one-time entry: if already verified with approved status, denies re-entry.
        """
        booking_id = request.data.get('booking_id')
        if not booking_id:
            return Response({'detail': 'booking_id is required'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            booking = PoojaBooking.objects.get(booking_id=booking_id)
        except PoojaBooking.DoesNotExist:
            return Response({'detail': 'Invalid booking_id'}, status=status.HTTP_404_NOT_FOUND)

        booking_details = {
            'service': 'pooja',
            'purpose': 'Pooja Booking',
            'booking_id': booking.booking_id,
            'pooja_type': booking.pooja_type,
            'full_name': booking.full_name,
            'email': booking.email,
            'mobile': booking.mobile,
            'preferred_date': booking.preferred_date.isoformat() if booking.preferred_date else None,
        }

        # Import PoojaVerification model
        from .models import PoojaVerification

        if not booking.image_data:
            return Response({'detail': 'No stored image for this booking'}, status=status.HTTP_400_BAD_REQUEST)

        # decode stored image
        try:
            stored_np = np.frombuffer(booking.image_data, np.uint8)
            stored_img = cv2.imdecode(stored_np, cv2.IMREAD_COLOR)
        except Exception as e:
            return Response({'detail': f'Error decoding stored image: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        # decode uploaded image
        uploaded_img = None
        if 'image' in request.FILES:
            up_bytes = request.FILES['image'].read()
            up_np = np.frombuffer(up_bytes, np.uint8)
            uploaded_img = cv2.imdecode(up_np, cv2.IMREAD_COLOR)
        else:
            data_url = request.data.get('image_data_url')
            if data_url and ',' in data_url:
                try:
                    base64_part = data_url.split(',', 1)[1]
                    up_bytes = base64.b64decode(base64_part)
                    up_np = np.frombuffer(up_bytes, np.uint8)
                    uploaded_img = cv2.imdecode(up_np, cv2.IMREAD_COLOR)
                except Exception as e:
                    return Response({'detail': f'Invalid image_data_url: {e}'}, status=status.HTTP_400_BAD_REQUEST)

        if uploaded_img is None:
            return Response({'detail': 'No image provided. Send file field "image" or "image_data_url".'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            models_dir = Path(__file__).resolve().parent / 'models'
            models_dir.mkdir(parents=True, exist_ok=True)
            yunet_path = models_dir / 'face_detection_yunet_2023mar.onnx'
            sface_path = models_dir / 'face_recognition_sface_2021dec.onnx'

            if not yunet_path.exists():
                urlretrieve('https://github.com/opencv/opencv_zoo/raw/main/models/face_detection_yunet/face_detection_yunet_2023mar.onnx', str(yunet_path))
            if not sface_path.exists():
                urlretrieve('https://github.com/opencv/opencv_zoo/raw/main/models/face_recognition_sface/face_recognition_sface_2021dec.onnx', str(sface_path))

            def create_detector(width: int, height: int):
                det = cv2.FaceDetectorYN_create(str(yunet_path), "", (width, height), score_threshold=0.6, nms_threshold=0.3, top_k=5000)
                return det

            recognizer = cv2.FaceRecognizerSF_create(str(sface_path), "")

            def detect_best_face(bgr_img: np.ndarray):
                h, w = bgr_img.shape[:2]
                detector = create_detector(w, h)
                detector.setInputSize((w, h))
                retval, faces = detector.detect(bgr_img)
                if faces is None or len(faces) == 0:
                    return None
                areas = faces[:, 2] * faces[:, 3]
                idx = int(np.argmax(areas))
                return faces[idx]

            f_stored = detect_best_face(stored_img)
            if f_stored is None:
                return Response({'detail': 'No face detected in stored booking image.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)
            f_uploaded = detect_best_face(uploaded_img)
            if f_uploaded is None:
                return Response({'detail': 'No face detected in uploaded image.'}, status=status.HTTP_422_UNPROCESSABLE_ENTITY)

            aligned1 = recognizer.alignCrop(stored_img, f_stored)
            aligned2 = recognizer.alignCrop(uploaded_img, f_uploaded)
            feat1 = recognizer.feature(aligned1)
            feat2 = recognizer.feature(aligned2)

            def l2norm(v):
                n = np.linalg.norm(v) + 1e-8
                return v / n
            f1 = l2norm(feat1.flatten())
            f2 = l2norm(feat2.flatten())
            similarity = float(np.dot(f1, f2))
            distance = float(1.0 - similarity)
            threshold = 0.40
            match = bool(distance < threshold)

            # Default response shape
            payload = {
                'booking_id': booking_id,
                'match': match,
                'distance': distance,
                'threshold': threshold,
                'similarity': similarity,
                'booking_details': booking_details,
                'entry_used': False,
            }

            # If face doesn't match, return with entry_allowed=False
            if not match:
                payload['entry_allowed'] = False
                payload['entry_message'] = 'Face did not match.'
                
                # Create a rejected verification record
                PoojaVerification.objects.create(
                    pooja_booking=booking,
                    method='face_recognition',
                    status='rejected',
                    match_score=similarity * 100,
                    notes='Face verification failed - no match',
                    evidence_image_data=up_bytes if 'image' in request.FILES else None
                )
                
                return Response(payload, status=status.HTTP_200_OK)

            # Face matched - NOW check if this booking has already been used
            existing_verification = PoojaVerification.objects.filter(
                pooja_booking=booking,
                status='approved'
            ).first()

            if existing_verification:
                # Entry already used - deny re-entry even though face matched
                return Response({
                    'booking_id': booking_id,
                    'match': True,  # Face did match
                    'entry_allowed': False,
                    'entry_used': True,
                    'entry_message': f'User already exists with the same face and booking ID. Entry was granted on {existing_verification.created_at.strftime("%d-%m-%Y at %H:%M")}.',
                    'booking_details': booking_details,
                    'previous_entry_date': existing_verification.created_at.isoformat(),
                    'distance': distance,
                    'threshold': threshold,
                    'similarity': similarity,
                }, status=status.HTTP_200_OK)

            # Face matched and not used before - Create approved verification record
            verification = PoojaVerification.objects.create(
                pooja_booking=booking,
                method='face_recognition',
                status='approved',
                match_score=similarity * 100,
                notes='Face verification successful - entry granted',
                evidence_image_data=up_bytes if 'image' in request.FILES else None
            )
            
            payload['entry_allowed'] = True
            payload['entry_message'] = 'Entry recorded. Access granted.'
            payload['verification_id'] = verification.id
            payload['entry_time'] = verification.created_at.isoformat()
            
            return Response(payload, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': f'Face verification error: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)



# SMS OTP Endpoints for Booking Verification
@api_view(['POST'])
@permission_classes([AllowAny])
def send_booking_otp(request):
    """Send OTP to user's mobile number for booking verification"""
    mobile = request.data.get('mobile', '').strip()
    
    if not mobile:
        return Response({'detail': 'Mobile number is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Validate mobile number format (Indian format)
    if not mobile.isdigit() or len(mobile) != 10:
        return Response({'detail': 'Invalid mobile number format'}, status=status.HTTP_400_BAD_REQUEST)
    
    if mobile[0] not in ['6', '7', '8', '9']:
        return Response({'detail': 'Mobile number must start with 6, 7, 8, or 9'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Check rate limiting
    if not can_send_otp(mobile):
        return Response({
            'detail': 'Too many OTP requests. Please try again after 10 minutes.'
        }, status=status.HTTP_429_TOO_MANY_REQUESTS)
    
    # Generate and send OTP
    otp = generate_sms_otp()
    
    if send_sms_otp(mobile, otp):
        store_sms_otp(mobile, otp)
        increment_otp_attempts(mobile)
        return Response({
            'message': 'OTP sent successfully to your mobile number',
            'mobile': mobile
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'detail': 'Failed to send OTP. Please try again later.'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_booking_otp(request):
    """Verify the OTP provided by user for booking"""
    mobile = request.data.get('mobile', '').strip()
    otp = request.data.get('otp', '').strip()
    
    if not mobile or not otp:
        return Response({'detail': 'Mobile number and OTP are required'}, status=status.HTTP_400_BAD_REQUEST)
    
    if verify_sms_otp(mobile, otp):
        return Response({
            'message': 'Mobile number verified successfully',
            'verified': True
        }, status=status.HTTP_200_OK)
    else:
        return Response({
            'detail': 'Invalid or expired OTP',
            'verified': False
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@authentication_classes([])
@permission_classes([AllowAny])
def check_pass_availability(request):
    """
    Standalone function to check pass availability without authentication
    GET params: darshan_date=YYYY-MM-DD, slot=<string>
    Returns: {capacity, booked, remaining}
    """
    darshan_date = request.query_params.get('darshan_date')
    slot = request.query_params.get('slot')
    
    print(f"[STANDALONE AVAILABILITY] Request received: date={darshan_date}, slot={slot}")
    
    if not darshan_date or not slot:
        return Response({'detail': 'darshan_date and slot are required'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        # Parse date to ensure valid format
        from datetime import date as _date
        parsed = _date.fromisoformat(darshan_date)
    except Exception:
        return Response({'detail': 'Invalid darshan_date format. Use YYYY-MM-DD.'}, status=status.HTTP_400_BAD_REQUEST)

    CAPACITY_PER_SLOT = 180
    
    # Try to get capacity from DailyCapacity model
    try:
        capacity = DailyCapacity.objects.get(date=parsed, slot=slot)
        booked = capacity.booked_count
        remaining = capacity.remaining
        print(f"[STANDALONE AVAILABILITY] Found in DailyCapacity: booked={booked}, remaining={remaining}")
    except DailyCapacity.DoesNotExist:
        # If no record exists yet, all slots are available
        booked = 0
        remaining = CAPACITY_PER_SLOT
        print(f"[STANDALONE AVAILABILITY] No DailyCapacity record found, returning defaults")
    
    response_data = {
        'capacity': CAPACITY_PER_SLOT, 
        'booked': booked, 
        'remaining': remaining, 
        'darshan_date': darshan_date, 
        'slot': slot
    }
    
    print(f"[STANDALONE AVAILABILITY] Returning: {response_data}")
    
    return Response(response_data)
