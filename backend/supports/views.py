from django.shortcuts import render
from rest_framework.generics import ListCreateAPIView
from rest_framework.permissions import IsAuthenticated

from .models import SupportTicket
from .serializers import SupportTicketSerializer


class SupportTicketListCreateView(ListCreateAPIView):
    serializer_class = SupportTicketSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return SupportTicket.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


def supports(request):
    return render(request, "supports/supports.html")

