# Generated migration for Donation model

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0012_poojaverification'),
    ]

    operations = [
        migrations.CreateModel(
            name='Donation',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('donor_name', models.CharField(max_length=200)),
                ('donor_email', models.EmailField(max_length=254)),
                ('donor_mobile', models.CharField(max_length=10)),
                ('category', models.CharField(choices=[('general', 'General Donation'), ('temple_maintenance', 'Temple Maintenance'), ('annadaan', 'Annadaan (Food Donation)'), ('education', 'Education'), ('medical', 'Medical Aid')], max_length=50)),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('payment_method', models.CharField(default='UPI', max_length=20)),
                ('payment_status', models.CharField(choices=[('pending', 'Pending'), ('completed', 'Completed'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('razorpay_order_id', models.CharField(blank=True, max_length=100, null=True)),
                ('razorpay_payment_id', models.CharField(blank=True, max_length=100, null=True)),
                ('razorpay_signature', models.CharField(blank=True, max_length=200, null=True)),
                ('receipt_id', models.CharField(max_length=50, unique=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('payment_completed_at', models.DateTimeField(blank=True, null=True)),
            ],
            options={
                'db_table': 'donation',
                'ordering': ['-created_at'],
            },
        ),
    ]
