from django.shortcuts import render
import os


def page(request, template_name: str):
    google_client_id = os.getenv('GOOGLE_CLIENT_ID') or os.getenv('GOOGLE_OAUTH_CLIENT_ID') or ''
    return render(request, template_name, {'GOOGLE_CLIENT_ID': google_client_id})
