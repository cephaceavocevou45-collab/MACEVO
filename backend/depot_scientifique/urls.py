from django.urls import path

from .views import (
    ScientificConsentView,
    ScientificDepositDetailView,
    ScientificDepositListCreateView,
    ScientificDepositSearchView,
    ScientificMyDepositsView,
    ScientificPublishView,
    ScientificWithdrawView,
)


urlpatterns = [
    path(
        "",
        ScientificDepositListCreateView.as_view(),
        name="scientific-deposit-list-create",
    ),

    path(
        "mes-depots/",
        ScientificMyDepositsView.as_view(),
        name="scientific-my-deposits",
    ),

    path(
        "rechercher/",
        ScientificDepositSearchView.as_view(),
        name="scientific-deposit-search",
    ),

    path(
        "<str:public_id>/",
        ScientificDepositDetailView.as_view(),
        name="scientific-deposit-detail",
    ),

    path(
        "<str:public_id>/consentement/",
        ScientificConsentView.as_view(),
        name="scientific-deposit-consent",
    ),

    path(
        "<str:public_id>/publier/",
        ScientificPublishView.as_view(),
        name="scientific-deposit-publish",
    ),

    path(
        "<str:public_id>/retirer/",
        ScientificWithdrawView.as_view(),
        name="scientific-deposit-withdraw",
    ),
]