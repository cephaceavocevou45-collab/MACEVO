from rest_framework import generics, permissions

from .models import Report
from .serializers import ReportSerializer


class ReportListCreateView(generics.ListCreateAPIView):
    """
    Liste et création des rapports de l'utilisateur connecté.

    GET  /api/reports/
    POST /api/reports/
    """

    serializer_class = ReportSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        """
        Retourne uniquement les rapports appartenant
        à l'utilisateur actuellement connecté.

        Les relations author et template sont chargées
        directement afin d'éviter des requêtes inutiles.
        """

        return (
            Report.objects
            .filter(
                author=self.request.user
            )
            .select_related(
                "author",
                "template",
            )
            .order_by(
                "-created_at"
            )
        )

    def perform_create(self, serializer):
        """
        Associe automatiquement le rapport
        à l'utilisateur authentifié.

        Le frontend n'a donc jamais besoin
        d'envoyer lui-même l'identifiant de l'auteur.
        """

        serializer.save(
            author=self.request.user,
        )


class ReportDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    """
    Consultation, modification et suppression
    d'un rapport appartenant à l'utilisateur connecté.

    GET    /api/reports/<id>/
    PATCH  /api/reports/<id>/
    PUT    /api/reports/<id>/
    DELETE /api/reports/<id>/
    """

    serializer_class = ReportSerializer
    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        """
        Limite impérativement l'accès aux rapports
        appartenant à l'utilisateur connecté.

        Cela empêche un utilisateur de consulter,
        modifier ou supprimer le rapport d'un autre
        utilisateur simplement en connaissant son ID.
        """

        return (
            Report.objects
            .filter(
                author=self.request.user
            )
            .select_related(
                "author",
                "template",
            )
        )