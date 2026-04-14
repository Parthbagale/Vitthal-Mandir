# Fix DailyCapacity unique constraint - remove unique from date field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('booking', '0008_daily_capacity'),
    ]

    operations = [
        migrations.AlterField(
            model_name='dailycapacity',
            name='date',
            field=models.DateField(db_index=True),
        ),
    ]
