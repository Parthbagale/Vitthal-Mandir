from django.urls import path
from .views import (
    AnnouncementListView,
    AnnouncementCreateView,
    AdminAnnouncementListView,
    AdminAnnouncementDetailView,
    VisitorResetView,
    VisitorSetView,
    VisitorStatsView,
    IncrementVisitorView,
    TodayVisitorCountView,
    admin_announcements_page,
    admin_visitor_counter_page,
    visitor_statistics_page,
    AdminDashboardAnalyticsView
)

urlpatterns = [
    path('api/announcements/', AnnouncementListView.as_view(), name='api-announcements'),
    path('api/announcements/create/', AnnouncementCreateView.as_view(), name='api-announcements-create'),
    path('api/admin/announcements/', AdminAnnouncementListView.as_view(), name='api-admin-announcements'),
    path('api/admin/announcements/<int:announcement_id>/', AdminAnnouncementDetailView.as_view(), name='api-admin-announcement-detail'),
    path('api/visitor/reset/', VisitorResetView.as_view(), name='api-visitor-reset'),
    path('api/visitor/set/', VisitorSetView.as_view(), name='api-visitor-set'),
    path('api/visitor/stats/', VisitorStatsView.as_view(), name='api-visitor-stats'),
    path('api/visitor/increment/', IncrementVisitorView.as_view(), name='api-visitor-increment'),
    path('api/visitor/today/', TodayVisitorCountView.as_view(), name='api-visitor-today'),
    path('api/admin/dashboard-analytics/', AdminDashboardAnalyticsView.as_view(), name='api-admin-dashboard-analytics'),
    path('admin/announcements/', admin_announcements_page, name='admin-announcements-page'),
    path('admin/visitor-counter/', admin_visitor_counter_page, name='admin-visitor-counter-page'),
    path('admin/visitor-statistics/', visitor_statistics_page, name='visitor-statistics-page'),
]
