"""
Custom permissions for booking app
"""

from rest_framework import permissions


class AllowAvailabilityCheck(permissions.BasePermission):
    """
    Allow unauthenticated access to availability check endpoint
    """
    
    def has_permission(self, request, view):
        # Allow unauthenticated GET requests to check-availability
        if request.path.endswith('/check-availability/') and request.method == 'GET':
            return True
        
        # For all other requests, require authentication
        return request.user and request.user.is_authenticated
