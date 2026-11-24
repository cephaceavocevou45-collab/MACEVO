from django.urls import path
from . import views

urlpatterns = [
    path("stockage/", views.stockage, name="stockage"),
]