from django.db import models

class TempleAnnouncement(models.Model):
    TYPE_CHOICES = [
        ('announcement', 'Announcement'),
        ('alert', 'Emergency Alert'),
    ]

    title = models.CharField(max_length=255)
    message = models.TextField()
    type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='announcement')
    active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.get_type_display()}: {self.title}"

class VisitorCounter(models.Model):
    date = models.DateField(unique=True)
    total_devotees = models.IntegerField(default=0)

    class Meta:
        ordering = ['-date']

    def __str__(self):
        return f"{self.date}: {self.total_devotees}"
