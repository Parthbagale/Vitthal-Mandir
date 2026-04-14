# Generated migration for daily capacity tracking

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0007_remove_bhaktanivasphoto_booking_and_more'),
    ]

    operations = [
        migrations.CreateModel(
            name='DailyCapacity',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(unique=True, db_index=True)),
                ('slot', models.CharField(max_length=64)),
                ('total_capacity', models.PositiveIntegerField(default=180)),
                ('booked_count', models.PositiveIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'daily_capacity',
                'ordering': ['date', 'slot'],
                'unique_together': {('date', 'slot')},
            },
        ),
    ]
