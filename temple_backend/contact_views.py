from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail, EmailMessage
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

@csrf_exempt
def contact_submit(request):
    if request.method != 'POST':
        return JsonResponse({'detail': 'Method not allowed'}, status=405)

    # Accept form-encoded submissions
    first = request.POST.get('firstName', '').strip()
    last = request.POST.get('lastName', '').strip()
    sender_email = request.POST.get('email', '').strip()
    phone = request.POST.get('phone', '').strip()
    subject_sel = request.POST.get('subject', '').strip()
    message_body = request.POST.get('message', '').strip()

    if not (first and last and sender_email and message_body):
        return JsonResponse({'detail': 'Missing required fields'}, status=400)

    subject = f"[Temple Website] Contact: {subject_sel or 'General Inquiry'}"
    body = (
        f"New contact submission from the website\n\n"
        f"Name: {first} {last}\n"
        f"Email: {sender_email}\n"
        f"Phone: {phone}\n"
        f"Subject: {subject_sel}\n\n"
        f"Message:\n{message_body}\n"
    )

    to_addr = getattr(settings, 'CONTACT_EMAIL_TO', 'vitthalmandir04@gmail.com')
    # Use authenticated mailbox as sender. Gmail rejects unauthenticated from addresses.
    from_addr = getattr(settings, 'EMAIL_HOST_USER', None) or getattr(settings, 'DEFAULT_FROM_EMAIL', 'no-reply@localhost')

    logger.info(f"Attempting to send contact email from {from_addr} to {to_addr}")
    logger.info(f"Email settings - HOST: {settings.EMAIL_HOST}, PORT: {settings.EMAIL_PORT}, USER: {settings.EMAIL_HOST_USER}")

    try:
        # Send email to temple
        email_to_temple = EmailMessage(
            subject=subject,
            body=body,
            from_email=from_addr,
            to=[to_addr],
            headers={'Reply-To': sender_email} if sender_email else None,
        )
        result = email_to_temple.send(fail_silently=False)
        logger.info(f"Email sent to temple successfully. Result: {result}")
        
        # Send confirmation email to user
        user_subject = "Thank you for contacting Shri Vitthal Rukmini Mandir"
        user_body = (
            f"Dear {first} {last},\n\n"
            f"Thank you for reaching out to us. We have received your message and will respond to you shortly.\n\n"
            f"Your Message Details:\n"
            f"Subject: {subject_sel}\n"
            f"Message: {message_body}\n\n"
            f"If you have any urgent queries, please feel free to call us at:\n"
            f"Phone: +91 7385060933 / (02186)224466\n\n"
            f"Best regards,\n"
            f"Shri Vitthal Rukmini Mandir, Pandharpur\n"
            f"Email: vitthalmandir04@gmail.com"
        )
        
        email_to_user = EmailMessage(
            subject=user_subject,
            body=user_body,
            from_email=from_addr,
            to=[sender_email],
        )
        user_result = email_to_user.send(fail_silently=True)  # Don't fail if user email fails
        logger.info(f"Confirmation email sent to user. Result: {user_result}")
        
        return JsonResponse({'ok': True, 'detail': 'Message sent successfully! We will get back to you soon.'})
    except Exception as e:
        logger.error(f"Email send failed: {str(e)}", exc_info=True)
        return JsonResponse({'ok': False, 'detail': f'Email send failed: {str(e)}'}, status=500)
