from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [("supports", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="supportticket",
            name="response",
            field=models.TextField(blank=True, max_length=5000),
        ),
        migrations.AddField(
            model_name="supportticket",
            name="responded_at",
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]
