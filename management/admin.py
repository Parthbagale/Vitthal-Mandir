from django.contrib import admin
from .models import TempleAnnouncement, VisitorCounter

@admin.register(TempleAnnouncement)
class TempleAnnouncementAdmin(admin.ModelAdmin):
    list_display = ('title', 'type', 'active', 'created_at')
    list_filter = ('type', 'active')
    search_fields = ('title', 'message')
    actions = ['activate_announcements', 'deactivate_announcements']

    def activate_announcements(self, request, queryset):
        queryset.update(active=True)
    activate_announcements.short_description = "Activate selected messages"

    def deactivate_announcements(self, request, queryset):
        queryset.update(active=False)
    deactivate_announcements.short_description = "Deactivate selected messages"

@admin.register(VisitorCounter)
class VisitorCounterAdmin(admin.ModelAdmin):
    list_display = ('date', 'total_devotees')
    ordering = ('-date',)
