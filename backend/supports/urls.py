from django.urls import path
from . import views

urlpatterns = [
    path("tickets/", views.SupportTicketListCreateView.as_view(), name="support-tickets"),
    path("supports/", views.supports, name="supports"),
]
