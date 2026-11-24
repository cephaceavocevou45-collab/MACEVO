from rest_framework import serializers

from .models import SupportTicket


class SupportTicketSerializer(serializers.ModelSerializer):
    class Meta:
        model = SupportTicket
        fields = ("id", "category", "subject", "message", "response", "responded_at", "status", "created_at")
        read_only_fields = ("id", "response", "responded_at", "status", "created_at")

    def validate_subject(self, value):
        value = value.strip()
        if len(value) < 5:
            raise serializers.ValidationError("Le sujet doit comporter au moins 5 caractères.")
        return value

    def validate_message(self, value):
        value = value.strip()
        if len(value) < 20:
            raise serializers.ValidationError("Décrivez votre demande en au moins 20 caractères.")
        return value
