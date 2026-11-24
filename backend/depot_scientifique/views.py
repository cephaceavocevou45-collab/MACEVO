from django.db.models import Q
from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from reports.models import Report

from .models import ScientificDeposit
from .serializers import (
    ScientificConsentSerializer,
    ScientificDepositCreateSerializer,
    ScientificDepositSerializer,
    ScientificPublicationSerializer,
)


class ScientificDepositListCreateView(APIView):
    """
    GET  /api/depot/
    POST /api/depot/

    GET :
        Liste uniquement les dépôts scientifiques publics.

    POST :
        Crée un dépôt scientifique à partir d'un Report
        appartenant à l'utilisateur connecté.
    """

    def get_permissions(self):
        if self.request.method == "GET":
            return [AllowAny()]

        return [IsAuthenticated()]

    def get(self, request):
        queryset = (
            ScientificDeposit.objects
            .select_related(
                "report",
                "report__author",
                "deposited_by",
            )
            .filter(
                visibility="public",
                publication_status="published",
                consent_given=True,
            )
            .order_by(
                "-published_at",
                "-created_at",
            )
        )

        serializer = ScientificDepositSerializer(
            queryset,
            many=True,
            context={"request": request},
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = ScientificDepositCreateSerializer(
            data=request.data,
            context={"request": request},
        )

        serializer.is_valid(raise_exception=True)

        report = serializer.validated_data["report"]
        document_type = serializer.validated_data["document_type"]

        deposit = ScientificDeposit(
            report=report,
            document_type=document_type,
            deposited_by=request.user,
            visibility="private",
            publication_status="draft",
        )

        deposit.save()

        response_serializer = ScientificDepositSerializer(
            deposit,
            context={"request": request},
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED,
        )


class ScientificMyDepositsView(APIView):
    """
    GET /api/depot/mes-depots/

    Espace personnel de l'utilisateur authentifié.

    Retourne uniquement les dépôts dont l'utilisateur
    est propriétaire du Report associé.

    Filtres disponibles :

        ?status=draft
        ?status=pending
        ?status=published
        ?status=withdrawn

    Sans filtre, tous les dépôts personnels sont retournés.
    """

    permission_classes = [IsAuthenticated]

    ALLOWED_STATUSES = {
        "draft",
        "pending",
        "published",
        "withdrawn",
    }

    def get(self, request):
        queryset = (
            ScientificDeposit.objects
            .select_related(
                "report",
                "report__author",
                "deposited_by",
            )
            .filter(
                report__author=request.user,
            )
        )

        publication_status = request.query_params.get(
            "status",
            "",
        ).strip().lower()

        if publication_status:
            if publication_status not in self.ALLOWED_STATUSES:
                return Response(
                    {
                        "detail": (
                            "Statut invalide.",
                        ),
                        "allowed_statuses": sorted(
                            self.ALLOWED_STATUSES
                        ),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            queryset = queryset.filter(
                publication_status=publication_status,
            )

        queryset = queryset.order_by(
            "-updated_at",
            "-created_at",
        )

        serializer = ScientificDepositSerializer(
            queryset,
            many=True,
            context={"request": request},
        )

        counts = {
            "all": queryset.count(),
            "draft": queryset.filter(
                publication_status="draft"
            ).count(),
            "pending": queryset.filter(
                publication_status="pending"
            ).count(),
            "published": queryset.filter(
                publication_status="published"
            ).count(),
            "withdrawn": queryset.filter(
                publication_status="withdrawn"
            ).count(),
        }

        return Response(
            {
                "count": queryset.count(),
                "counts": counts,
                "status": publication_status or None,
                "results": serializer.data,
            }
        )


class ScientificDepositDetailView(APIView):
    """
    GET /api/depot/<public_id>/

    Retourne un dépôt.

    - dépôt public : accessible à tout le monde ;
    - dépôt privé : accessible uniquement au propriétaire.
    """

    def get(self, request, public_id):
        deposit = get_object_or_404(
            ScientificDeposit.objects.select_related(
                "report",
                "report__author",
                "deposited_by",
            ),
            public_id=public_id,
        )

        is_owner = (
            request.user.is_authenticated
            and deposit.report.author_id == request.user.id
        )

        if not deposit.is_public and not is_owner:
            return Response(
                {
                    "detail": "Ce document n'est pas public."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if deposit.is_public:
            ScientificDeposit.objects.filter(
                pk=deposit.pk
            ).update(
                view_count=deposit.view_count + 1
            )

            deposit.view_count += 1

        serializer = ScientificDepositSerializer(
            deposit,
            context={"request": request},
        )

        return Response(serializer.data)


class ScientificDepositSearchView(APIView):
    """
    GET /api/depot/rechercher/?q=...

    Recherche publique par :

    - identifiant MACEVO ;
    - titre ;
    - auteur ;
    - domaine ;
    - institution ;
    - type de rapport ;
    - type de document.
    """

    permission_classes = [AllowAny]

    def get(self, request):
        query = request.query_params.get(
            "q",
            "",
        ).strip()

        if not query:
            return Response(
                {
                    "detail": (
                        "Le paramètre q est obligatoire."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        queryset = (
            ScientificDeposit.objects
            .select_related(
                "report",
                "report__author",
                "deposited_by",
            )
            .filter(
                visibility="public",
                publication_status="published",
                consent_given=True,
            )
            .filter(
                Q(public_id__icontains=query)
                | Q(report__title__icontains=query)
                | Q(
                    report__scientific_field__icontains=query
                )
                | Q(
                    report__institution__icontains=query
                )
                | Q(
                    report__report_type__icontains=query
                )
                | Q(
                    report__author__username__icontains=query
                )
                | Q(
                    document_type__icontains=query
                )
            )
            .order_by(
                "-published_at",
                "-created_at",
            )
        )

        serializer = ScientificDepositSerializer(
            queryset,
            many=True,
            context={"request": request},
        )

        return Response(
            {
                "query": query,
                "count": queryset.count(),
                "results": serializer.data,
            }
        )


class ScientificConsentView(APIView):
    """
    POST /api/depot/<public_id>/consentement/

    Enregistre le consentement explicite du propriétaire.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        deposit = get_object_or_404(
            ScientificDeposit.objects.select_related(
                "report"
            ),
            public_id=public_id,
        )

        if deposit.report.author_id != request.user.id:
            return Response(
                {
                    "detail": (
                        "Vous n'êtes pas propriétaire "
                        "de ce document."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ScientificConsentSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        deposit.give_consent(
            version=serializer.validated_data.get(
                "consent_version",
                "1.0",
            )
        )

        deposit.save(
            update_fields=[
                "consent_given",
                "consent_given_at",
                "consent_version",
                "publication_status",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail": "Consentement enregistré.",
                "public_id": deposit.public_id,
                "consent_given": deposit.consent_given,
                "consent_given_at": (
                    deposit.consent_given_at
                ),
                "publication_status": (
                    deposit.publication_status
                ),
            }
        )


class ScientificPublishView(APIView):
    """
    POST /api/depot/<public_id>/publier/

    Publie le document après vérification
    du consentement explicite.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        deposit = get_object_or_404(
            ScientificDeposit.objects.select_related(
                "report"
            ),
            public_id=public_id,
        )

        if deposit.report.author_id != request.user.id:
            return Response(
                {
                    "detail": (
                        "Vous n'êtes pas propriétaire "
                        "de ce document."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = ScientificPublicationSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        if not deposit.consent_given:
            return Response(
                {
                    "detail": (
                        "Publication impossible : "
                        "le consentement explicite "
                        "n'a pas été donné."
                    )
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            deposit.publish()
        except ValueError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        deposit.save(
            update_fields=[
                "visibility",
                "publication_status",
                "published_at",
                "withdrawn_at",
                "updated_at",
            ]
        )

        response_serializer = (
            ScientificDepositSerializer(
                deposit,
                context={"request": request},
            )
        )

        return Response(
            response_serializer.data,
            status=status.HTTP_200_OK,
        )


class ScientificWithdrawView(APIView):
    """
    POST /api/depot/<public_id>/retirer/

    Retire le document du dépôt public.
    """

    permission_classes = [IsAuthenticated]

    def post(self, request, public_id):
        deposit = get_object_or_404(
            ScientificDeposit.objects.select_related(
                "report"
            ),
            public_id=public_id,
        )

        if deposit.report.author_id != request.user.id:
            return Response(
                {
                    "detail": (
                        "Vous n'êtes pas propriétaire "
                        "de ce document."
                    )
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        deposit.withdraw()

        deposit.save(
            update_fields=[
                "visibility",
                "publication_status",
                "withdrawn_at",
                "updated_at",
            ]
        )

        return Response(
            {
                "detail": (
                    "Le document a été retiré "
                    "du dépôt public."
                ),
                "public_id": deposit.public_id,
                "visibility": deposit.visibility,
                "publication_status": (
                    deposit.publication_status
                ),
            }
        )