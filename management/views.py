from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Sum, Count
from django.shortcuts import render
from .models import TempleAnnouncement, VisitorCounter
from datetime import timedelta

from booking.models import PassBooking, EntryVerification, PoojaBooking, BhaktaNivasPhoto


def admin_announcements_page(request):
    return render(request, 'admin_announcements.html')


def admin_visitor_counter_page(request):
    return render(request, 'admin_visitor_counter.html')

class AnnouncementListView(APIView):
    permission_classes = [] # AllowAny for public marquee

    def get(self, request):
        announcements = TempleAnnouncement.objects.filter(active=True).order_by('-created_at')
        data = [
            {
                "title": a.title,
                "message": a.message,
                "type": a.type,
            } for a in announcements
        ]
        return Response(data)

class AnnouncementCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not getattr(request.user, 'is_staff', False):
            return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        title = (request.data or {}).get('title')
        message = (request.data or {}).get('message')
        msg_type = (request.data or {}).get('type') or 'announcement'

        if not title or not message:
            return Response({'detail': 'title and message are required'}, status=status.HTTP_400_BAD_REQUEST)

        if msg_type not in ['announcement', 'alert']:
            return Response({'detail': 'type must be announcement or alert'}, status=status.HTTP_400_BAD_REQUEST)

        a = TempleAnnouncement.objects.create(
            title=str(title)[:255],
            message=str(message),
            type=msg_type,
            active=True,
        )

        return Response({
            'id': a.id,
            'title': a.title,
            'message': a.message,
            'type': a.type,
            'active': a.active,
            'created_at': a.created_at,
        }, status=status.HTTP_201_CREATED)


class AdminAnnouncementListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, 'is_staff', False):
            return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        announcements = TempleAnnouncement.objects.all().order_by('-created_at')
        data = [
            {
                'id': a.id,
                'title': a.title,
                'message': a.message,
                'type': a.type,
                'active': a.active,
                'created_at': a.created_at,
            }
            for a in announcements
        ]
        return Response(data)


class AdminAnnouncementDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, announcement_id: int):
        if not getattr(request.user, 'is_staff', False):
            return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data or {}
        a = TempleAnnouncement.objects.filter(id=announcement_id).first()
        if not a:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        allowed = {'active', 'title', 'message', 'type'}
        if not any(k in payload for k in allowed):
            return Response({'detail': 'No editable fields provided'}, status=status.HTTP_400_BAD_REQUEST)

        if 'type' in payload:
            msg_type = payload.get('type')
            if msg_type not in ['announcement', 'alert']:
                return Response({'detail': 'type must be announcement or alert'}, status=status.HTTP_400_BAD_REQUEST)
            a.type = msg_type

        if 'title' in payload:
            title = payload.get('title')
            if not title:
                return Response({'detail': 'title cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            a.title = str(title)[:255]

        if 'message' in payload:
            message = payload.get('message')
            if not message:
                return Response({'detail': 'message cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)
            a.message = str(message)

        if 'active' in payload:
            a.active = bool(payload.get('active'))

        a.save()
        return Response({
            'id': a.id,
            'title': a.title,
            'message': a.message,
            'type': a.type,
            'active': a.active,
            'created_at': a.created_at,
        })

    def delete(self, request, announcement_id: int):
        if not getattr(request.user, 'is_staff', False):
            return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        a = TempleAnnouncement.objects.filter(id=announcement_id).first()
        if not a:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

        a.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class VisitorResetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not getattr(request.user, 'is_staff', False):
            return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.now().date()
        counter, _ = VisitorCounter.objects.get_or_create(date=today)
        counter.total_devotees = 0
        counter.save()
        return Response({'total_devotees': counter.total_devotees})


class VisitorSetView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not getattr(request.user, 'is_staff', False):
            return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        value = (request.data or {}).get('total_devotees')
        try:
            value_i = int(value)
        except Exception:
            return Response({'detail': 'total_devotees must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if value_i < 0:
            return Response({'detail': 'total_devotees must be >= 0'}, status=status.HTTP_400_BAD_REQUEST)

        today = timezone.now().date()
        counter, _ = VisitorCounter.objects.get_or_create(date=today)
        counter.total_devotees = value_i
        counter.save()
        return Response({'total_devotees': counter.total_devotees})


class VisitorStatsView(APIView):
    permission_classes = [] # Ideally IsAdminUser for stats, but AllowAny for easy demo/charts

    def get(self, request):
        today = timezone.now().date()
        # Last 30 days
        start_date = today - timedelta(days=30)
        stats = VisitorCounter.objects.filter(date__gte=start_date).order_by('date')
        
        labels = [s.date.strftime('%d-%m-%Y') for s in stats]
        counts = [s.total_devotees for s in stats]
        days = [s.date.strftime('%A') for s in stats]

        return Response({
            "labels": labels,
            "counts": counts,
            "days": days
        })

class IncrementVisitorView(APIView):
    permission_classes = [] # Public can hit this on home page load

    def post(self, request):
        today = timezone.now().date()
        counter, created = VisitorCounter.objects.get_or_create(date=today)
        counter.total_devotees += 1
        counter.save()

        if counter.total_devotees > 15000:
            TempleAnnouncement.objects.get_or_create(
                title='High Crowd Alert',
                type='alert',
                active=True,
                defaults={
                    'message': 'High crowd at temple today.',
                },
            )
        return Response({"total_devotees": counter.total_devotees})

class TodayVisitorCountView(APIView):
    permission_classes = []

    def get(self, request):
        today = timezone.now().date()
        counter = VisitorCounter.objects.filter(date=today).first()
        count = counter.total_devotees if counter else 0
        return Response({"total_devotees": count})

def visitor_statistics_page(request):
    """Standard Django view for the admin stats page."""
    return render(request, 'visitor_statistics.html')


class AdminDashboardAnalyticsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not getattr(request.user, 'is_staff', False):
            return Response({'detail': 'Admin access required'}, status=status.HTTP_403_FORBIDDEN)

        today = timezone.localdate()
        range_key = (request.query_params.get('range') or '7').strip().lower()

        if range_key in ['today', '1', 'day']:
            days = 1
            range_key = 'today'
        elif range_key in ['30', 'month']:
            days = 30
            range_key = '30'
        else:
            days = 7
            range_key = '7'

        start_date = today - timedelta(days=days - 1)
        end_date = today

        # Visitors: day-by-day trend
        visitor_stats = VisitorCounter.objects.filter(date__gte=start_date, date__lte=end_date).order_by('date')
        visitor_labels = [s.date.strftime('%d-%m-%Y') for s in visitor_stats]
        visitor_counts = [int(s.total_devotees or 0) for s in visitor_stats]

        today_counter = VisitorCounter.objects.filter(date=today).first()
        today_visitors = int(today_counter.total_devotees) if today_counter else 0

        # Pass analytics: status breakdown within the selected range (based on verification created_at)
        pass_status_qs = (
            EntryVerification.objects
            .filter(created_at__date__gte=start_date, created_at__date__lte=end_date)
            .values('status')
            .annotate(count=Count('id'))
            .order_by('status')
        )
        pass_status = {row['status']: int(row['count']) for row in pass_status_qs}
        pass_approved = pass_status.get('approved', 0)
        pass_pending = pass_status.get('pending', 0)
        pass_rejected = pass_status.get('rejected', 0)

        # Pass capacity: booked tokens for today (capacity per day = 180)
        PASS_CAPACITY = 180
        pass_booked_today = PassBooking.objects.filter(darshan_date=today).count()
        pass_remaining_today = max(PASS_CAPACITY - pass_booked_today, 0)
        pass_usage_pct_today = int(round((pass_booked_today / PASS_CAPACITY) * 100)) if PASS_CAPACITY else 0

        # Today's pooja bookings (KPI) + today's revenue (KPI)
        pooja_today_qs = PoojaBooking.objects.filter(preferred_date=today).values('pooja_type').annotate(count=Count('id'))
        pooja_today_counts_map = {row['pooja_type']: int(row['count']) for row in pooja_today_qs}

        # Pooja analytics: bookings by pooja_type within range
        pooja_qs = (
            PoojaBooking.objects
            .filter(preferred_date__gte=start_date, preferred_date__lte=end_date)
            .values('pooja_type')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        pooja_labels = [str(row['pooja_type'] or 'Unknown') for row in pooja_qs]
        pooja_counts = [int(row['count']) for row in pooja_qs]

        # Pooja slot usage (4 slots per pooja per day)
        POOJA_SLOT_CAPACITY_PER_DAY = 4
        pooja_types = [
            'Mahapooja Vitthal',
            'Mahapooja Rukmini Mata',
            'Padva Pooja',
            'Tulsi Pooja',
        ]
        pooja_counts_map = {row['pooja_type']: int(row['count']) for row in pooja_qs}
        pooja_used_slots = [int(pooja_counts_map.get(t, 0)) for t in pooja_types]
        pooja_max_slots = POOJA_SLOT_CAPACITY_PER_DAY * days
        pooja_remaining_slots = [max(pooja_max_slots - u, 0) for u in pooja_used_slots]

        # Bhakta Nivas analytics: bookings by room_type (existing dashboard use)
        bhakta_qs = BhaktaNivasPhoto.objects.values('room_type').annotate(count=Count('id')).order_by('-count')
        bhakta_labels = [str(row['room_type'] or 'Unknown') for row in bhakta_qs]
        bhakta_counts = [int(row['count']) for row in bhakta_qs]

        # Bhakta Nivas occupancy (rooms booked vs total) within range
        BHAKTA_NIVAS_TOTAL_ROOMS = 50
        # Trend: bookings per day (distinct booking_code) within range
        bhakta_bookings_by_day_qs = (
            BhaktaNivasPhoto.objects
            .filter(checkin_date__gte=start_date, checkin_date__lte=end_date)
            .exclude(booking_code__isnull=True)
            .exclude(booking_code='')
            .values('checkin_date')
            .annotate(count=Count('booking_code', distinct=True))
            .order_by('checkin_date')
        )
        bhakta_day_map = {str(row['checkin_date']): int(row['count']) for row in bhakta_bookings_by_day_qs}
        bhakta_trend_labels = []
        bhakta_trend_counts = []
        for i in range(days):
            d = start_date + timedelta(days=i)
            key = str(d)
            bhakta_trend_labels.append(d.strftime('%d-%m-%Y'))
            bhakta_trend_counts.append(int(bhakta_day_map.get(key, 0)))

        bhakta_booked_rooms = (
            BhaktaNivasPhoto.objects
            .filter(checkin_date__gte=start_date, checkin_date__lte=end_date)
            .exclude(booking_code__isnull=True)
            .exclude(booking_code='')
            .values('booking_code')
            .distinct()
            .count()
        )

        bhakta_booked_rooms_today = (
            BhaktaNivasPhoto.objects
            .filter(checkin_date=today)
            .exclude(booking_code__isnull=True)
            .exclude(booking_code='')
            .values('booking_code')
            .distinct()
            .count()
        )
        bhakta_available_rooms = max(BHAKTA_NIVAS_TOTAL_ROOMS - bhakta_booked_rooms, 0)
        bhakta_occupancy_pct = int(round((bhakta_booked_rooms / BHAKTA_NIVAS_TOTAL_ROOMS) * 100)) if BHAKTA_NIVAS_TOTAL_ROOMS else 0

        # Revenue analytics (per pooja booking) within range
        revenue_rates = {
            'Mahapooja Vitthal': 25000,
            'Mahapooja Rukmini Mata': 11000,
            'Padva Pooja': 5000,
            'Tulsi Pooja': 2100,
        }
        revenue_labels = list(revenue_rates.keys())
        revenue_values = [int(pooja_counts_map.get(lbl, 0)) * int(revenue_rates[lbl]) for lbl in revenue_labels]

        revenue_today_values = [int(pooja_today_counts_map.get(lbl, 0)) * int(revenue_rates[lbl]) for lbl in revenue_labels]
        todays_revenue = int(sum(revenue_today_values))

        pooja_bookings_today_total = sum(int(pooja_today_counts_map.get(t, 0)) for t in pooja_types)

        return Response({
            'meta': {
                'range': range_key,
                'days': days,
                'start_date': str(start_date),
                'end_date': str(end_date),
            },
            'kpis': {
                'today_visitors': today_visitors,
                'pass_tokens_used_today': pass_booked_today,
                'pass_capacity_per_day': PASS_CAPACITY,
                'pooja_bookings': pooja_bookings_today_total,
                'bhakt_nivas_rooms_booked': bhakta_booked_rooms_today,
                'today_revenue': int(todays_revenue),
            },
            'visitor': {
                'labels': visitor_labels,
                'counts': visitor_counts,
            },
            'pass': {
                'labels': ['Approved', 'Pending', 'Rejected'],
                'counts': [pass_approved, pass_pending, pass_rejected],
            },
            'pooja': {
                'labels': pooja_labels,
                'counts': pooja_counts,
            },
            'bhakta_nivas': {
                'labels': bhakta_labels,
                'counts': bhakta_counts,
            },
            'charts': {
                'visitor_trend': {
                    'labels': visitor_labels,
                    'series': [{
                        'name': 'Visitors',
                        'data': visitor_counts,
                    }],
                },
                'pass_capacity': {
                    'capacity': PASS_CAPACITY,
                    'booked': pass_booked_today,
                    'remaining': pass_remaining_today,
                    'percent': pass_usage_pct_today,
                },
                'pooja_slots': {
                    'categories': pooja_types,
                    'used': pooja_used_slots,
                    'remaining': pooja_remaining_slots,
                    'capacity_per_day': POOJA_SLOT_CAPACITY_PER_DAY,
                    'days': days,
                    'max_slots': pooja_max_slots,
                },
                'bhakt_nivas_occupancy': {
                    'total_rooms': BHAKTA_NIVAS_TOTAL_ROOMS,
                    'booked_rooms': bhakta_booked_rooms,
                    'available_rooms': bhakta_available_rooms,
                    'percent': bhakta_occupancy_pct,
                },
                'bhakt_nivas_trend': {
                    'labels': bhakta_trend_labels,
                    'series': [{
                        'name': 'Rooms Booked',
                        'data': bhakta_trend_counts,
                    }],
                },
                'revenue_distribution': {
                    'labels': revenue_labels,
                    'values': revenue_values,
                    'total': int(sum(revenue_values)),
                },
            },
        })
