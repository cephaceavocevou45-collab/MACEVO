from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):
    initial = True

    dependencies = [migrations.swappable_dependency(settings.AUTH_USER_MODEL)]

    operations = [
        migrations.CreateModel(
            name="SupportTicket",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("category", models.CharField(choices=[("account", "Compte"), ("document", "Document et modèles"), ("editor", "Éditeur et export"), ("academic", "Consignes académiques"), ("other", "Autre demande")], max_length=24)),
                ("subject", models.CharField(max_length=160)),
                ("message", models.TextField(max_length=5000)),
                ("status", models.CharField(choices=[("open", "Ouvert"), ("in_progress", "En cours"), ("resolved", "Résolu")], db_index=True, default="open", max_length=16)),
                ("created_at", models.DateTimeField(auto_now_add=True, db_index=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("user", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="support_tickets", to=settings.AUTH_USER_MODEL)),
            ],
            options={
                "verbose_name": "demande d’assistance",
                "verbose_name_plural": "demandes d’assistance",
                "ordering": ("-created_at",),
            },
        ),
    ]
