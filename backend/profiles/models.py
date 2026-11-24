from django.contrib.auth.models import User
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="profile",
    )

    avatar = models.ImageField(
        upload_to="profiles/avatars/",
        null=True,
        blank=True,
    )

    phone = models.CharField(
        max_length=30,
        blank=True,
        default="",
    )

    university = models.CharField(
        max_length=255,
        blank=True,
        default="",
    )

    country = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    city = models.CharField(
        max_length=100,
        blank=True,
        default="",
    )

    bio = models.TextField(
        blank=True,
        default="",
        max_length=2000,
    )

    date_of_birth = models.DateField(
        null=True,
        blank=True,
    )

    profile_completed = models.BooleanField(
        default=False,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        verbose_name = "Profil"
        verbose_name_plural = "Profils"
        ordering = ["-updated_at"]

    def __str__(self):
        return f"Profil de {self.user.username}"

    def calculate_completion(self):
        required_fields = [
            self.user.first_name,
            self.user.last_name,
            self.user.username,
            self.user.email,
            self.phone,
            self.university,
            self.country,
            self.city,
            self.bio,
        ]

        return all(
            str(field).strip()
            for field in required_fields
        )

    def update_completion_status(self, save=True):
        self.profile_completed = self.calculate_completion()

        if save:
            self.save(
                update_fields=[
                    "profile_completed",
                    "updated_at",
                ]
            )

        return self.profile_completed