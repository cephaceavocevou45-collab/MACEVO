import uuid

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("word_to_latex", "0003_alter_wordtolatexconversion_options_and_more"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name="PdfLatexShare",
            fields=[
                (
                    "id",
                    models.UUIDField(
                        default=uuid.uuid4,
                        editable=False,
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                ("original_filename", models.CharField(max_length=255)),
                (
                    "file_type",
                    models.CharField(
                        choices=[
                            ("latex", "LaTeX source"),
                            ("zip", "LaTeX project archive"),
                        ],
                        max_length=10,
                    ),
                ),
                (
                    "shared_file",
                    models.FileField(upload_to="pdf_to_latex/shares/"),
                ),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("expires_at", models.DateTimeField(db_index=True)),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="pdf_latex_shares",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={"ordering": ["-created_at"]},
        ),
    ]
