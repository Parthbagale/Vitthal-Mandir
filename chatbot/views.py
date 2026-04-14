 


import os
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.conf import settings
from google import genai
from google.genai import types

# ============================================================
# Gemini API Configuration (SAFE)
# ============================================================

GEMINI_API_KEY = getattr(settings, "GEMINI_API_KEY", None)

if GEMINI_API_KEY:
    client = genai.Client(api_key=GEMINI_API_KEY)
    print("Gemini API configured successfully")
else:
    client = None
    print("WARNING: GEMINI_API_KEY not found in settings!")

# ============================================================
# System Prompt (UNCHANGED – already correct)
# ============================================================

SYSTEM_PROMPT = """You are an AI assistant for Shri Vitthal Rukmini Mandir in Pandharpur, Maharashtra, India. 

IMPORTANT RULES:
1. ONLY answer questions related to:
   - Vitthal Mandir (Pandharpur temple)
   - Lord Vitthal and Goddess Rukmini
   - Temple history, architecture, and significance
   - Temple timings, darshan procedures, and rituals
   - Festivals celebrated at the temple (like Ashadhi Ekadashi, Kartiki Ekadashi)
   - Warkari tradition and saints (Sant Dnyaneshwar, Sant Tukaram, Sant Namdev, etc.)
   - Pandharpur pilgrimage and yatra
   - Temple services (pooja, prasad, donations, accommodation)
   - How to reach Pandharpur
   - Temple rules and dress code

2. If asked about topics OUTSIDE these areas, politely respond:
   "I apologize, but I can only answer questions related to Shri Vitthal Rukmini Mandir in Pandharpur. Please ask me about the temple, Lord Vitthal, temple services, festivals, or pilgrimage information."

3. Be respectful, informative, and maintain a devotional tone
4. Provide accurate information about the temple
5. Use simple language that devotees can understand
6. If you don't know something specific, admit it and suggest contacting temple authorities

Now please respond to devotee queries."""

# ============================================================
# Chat API Endpoint
# ============================================================

@csrf_exempt
@require_http_methods(["POST"])
def chat(request):
    print("=" * 60)
    print("CHATBOT REQUEST RECEIVED")
    print("=" * 60)

    try:
        if not client:
            print("ERROR: Gemini API not configured")
            return JsonResponse({
                "error": "Service unavailable",
                "response": (
                    "I apologize, but the chatbot service is temporarily unavailable. "
                    "Please contact temple administration at vitthalmandir04@gmail.com "
                    "or call +91 738506033."
                )
            }, status=503)

        data = json.loads(request.body)
        user_message = data.get("message", "").strip()

        print(f"User Message: {user_message}")

        if not user_message:
            return JsonResponse({
                "error": "Message is required",
                "response": "Please provide a message."
            }, status=400)

        print("Sending message to Gemini...")

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=user_message,
            config=types.GenerateContentConfig(
                system_instruction=SYSTEM_PROMPT,
            ),
        )

        bot_response = response.text
        print(f"Bot Response: {bot_response[:120]}...")
        print("=" * 60)

        return JsonResponse({
            "status": "success",
            "response": bot_response
        })

    except json.JSONDecodeError:
        print("JSON Decode Error")
        return JsonResponse({
            "error": "Invalid JSON",
            "response": "There was an error processing your request."
        }, status=400)

    except Exception as e:
        print("CHATBOT ERROR:", str(e))
        import traceback
        print(traceback.format_exc())

        return JsonResponse({
            "error": "Internal server error",
            "response": "I apologize for the inconvenience. Please try again later."
        }, status=500)


# ============================================================
# Health Check Endpoint (UNCHANGED – already correct)
# ============================================================

@require_http_methods(["GET"])
def health_check(request):
    is_configured = bool(client)
  
    return JsonResponse({
        "status": "healthy" if is_configured else "not_configured",
        "service": "Vitthal Mandir Chatbot",
        "api_configured": is_configured
    })
