from django.contrib import admin
from django.utils import timezone
from .models import SupportTicket


@admin.register(SupportTicket)
class SupportTicketAdmin(admin.ModelAdmin):
    list_display = ("subject", "category", "user", "status", "created_at")
    list_filter = ("status", "category", "created_at")
    search_fields = ("subject", "message", "user__email", "user__username")
    readonly_fields = ("user", "category", "subject", "message", "responded_at", "created_at", "updated_at")

    def save_model(self, request, obj, form, change):
        if obj.response:
            previous = SupportTicket.objects.filter(pk=obj.pk).values_list("response", flat=True).first() if change else ""
            if obj.response != previous:
                obj.responded_at = timezone.now()
                if obj.status == SupportTicket.Status.OPEN:
                    obj.status = SupportTicket.Status.IN_PROGRESS
        else:
            obj.responded_at = None
        super().save_model(request, obj, form, change)
