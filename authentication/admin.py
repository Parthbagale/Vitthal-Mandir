from django.contrib import admin
from .models import AdminAccount


@admin.register(AdminAccount)
class AdminAccountAdmin(admin.ModelAdmin):
    list_display = ("username", "created_at", "updated_at")
    search_fields = ("username",)
from django.contrib.auth.admin import UserAdmin
from .models import User

@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'full_name', 'is_devotee', 'is_staff', 'created_at')
    list_filter = ('is_devotee', 'is_staff', 'is_superuser', 'created_at')
    search_fields = ('username', 'email', 'full_name')
    ordering = ('-created_at',)
    
    fieldsets = UserAdmin.fieldsets + (
        ('Additional Info', {'fields': ('full_name', 'is_devotee')}),)
