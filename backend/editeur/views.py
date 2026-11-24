"""
MACEVO — API de l'éditeur scientifique.

Responsabilités :

    - bootstrap de l'éditeur ;
    - gestion des assets ;
    - structure documentaire ;
    - validation scientifique ;
    - statistiques ;
    - exports HTML / DOCX / LaTeX / PDF / ZIP.

Le modèle documentaire canonique reste :

    reports.Report

Aucun second modèle Document n'est créé ici.

Toutes les capacités LaTeX et Export restent dans le domaine
``editeur``.
"""

from __future__ import annotations

import logging
from pathlib import Path

from django.http import FileResponse
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.views import APIView

from reports.models import Report
from reports.serializers import ReportSerializer

from .models import EditorAsset
from .serializers import EditorAssetSerializer
from .services.document_service import build_document
from .services.export_service import EditorExportService
from .services.statistics_service import DocumentStatisticsService
from .services.validation_service import DocumentValidationService


logger = logging.getLogger(__name__)


class OwnedReportMixin:
    """
    Fournit une résolution sécurisée des rapports appartenant
    à l'utilisateur authentifié.
    """

    def get_report(
        self,
        pk,
    ) -> Report | None:
        """
        Retourne le rapport demandé s'il appartient à l'utilisateur.
        """

        return (
            Report.objects
            .filter(
                pk=pk,
                author=self.request.user,
            )
            .select_related(
                "author",
                "template",
            )
            .prefetch_related(
                "editor_assets",
            )
            .first()
        )

    def report_not_found_response(self):
        """
        Réponse uniforme lorsqu'un rapport n'est pas accessible.
        """

        return Response(
            {
                "detail": "Rapport introuvable.",
            },
            status=404,
        )


class EditorBootstrapView(
    OwnedReportMixin,
    APIView,
):
    """
    Point d'entrée principal de l'éditeur.

    Retourne toutes les informations nécessaires au frontend
    pour initialiser une session d'édition.
    """

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(
        self,
        request,
        pk,
    ):
        report = self.get_report(pk)

        if report is None:
            return self.report_not_found_response()

        assets = (
            EditorAsset.objects
            .filter(
                report=report,
            )
            .select_related(
                "uploaded_by",
            )
            .order_by(
                "position",
                "created_at",
            )
        )

        return Response(
            {
                "report": ReportSerializer(
                    report,
                    context={
                        "request": request,
                    },
                ).data,

                "assets": EditorAssetSerializer(
                    assets,
                    many=True,
                    context={
                        "request": request,
                    },
                ).data,

                "autosave": {
                    "enabled": True,
                    "endpoint": (
                        f"/api/reports/"
                        f"{report.pk}/"
                    ),
                    "method": "PATCH",
                    "field": "content",
                },

                "capabilities": {
                    "math": True,
                    "latex": True,
                    "pdf": True,
                    "docx": True,
                    "html": True,
                    "images": True,
                    "figures": True,
                    "tables": True,
                    "scientific_shapes": True,
                },

                "exports": {
                    "pdf": (
                        f"/api/editeur/"
                        f"{report.pk}/export/pdf/"
                    ),
                    "docx": (
                        f"/api/editeur/"
                        f"{report.pk}/export/docx/"
                    ),
                    "html": (
                        f"/api/editeur/"
                        f"{report.pk}/export/html/"
                    ),
                    "latex": (
                        f"/api/editeur/"
                        f"{report.pk}/export/latex/"
                    ),
                    "tex": (
                        f"/api/editeur/"
                        f"{report.pk}/export/tex/"
                    ),
                    "zip": (
                        f"/api/editeur/"
                        f"{report.pk}/export/zip/"
                    ),
                },
            }
        )


class EditorAssetListCreateView(
    generics.ListCreateAPIView,
):
    """
    Liste et création des assets associés aux rapports
    de l'utilisateur connecté.
    """

    serializer_class = EditorAssetSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            EditorAsset.objects
            .filter(
                report__author=self.request.user,
            )
            .select_related(
                "report",
                "uploaded_by",
            )
            .order_by(
                "position",
                "created_at",
            )
        )

    def perform_create(
        self,
        serializer,
    ):
        serializer.save(
            uploaded_by=self.request.user,
        )


class EditorAssetDetailView(
    generics.RetrieveUpdateDestroyAPIView,
):
    """
    Consultation, modification et suppression d'un asset.

    L'asset n'est accessible que si son rapport appartient
    à l'utilisateur connecté.
    """

    serializer_class = EditorAssetSerializer

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get_queryset(self):
        return (
            EditorAsset.objects
            .filter(
                report__author=self.request.user,
            )
            .select_related(
                "report",
                "uploaded_by",
            )
        )


class EditorStructureView(
    OwnedReportMixin,
    APIView,
):
    """
    Retourne le modèle documentaire structuré du rapport.
    """

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(
        self,
        request,
        pk,
    ):
        report = self.get_report(pk)

        if report is None:
            return self.report_not_found_response()

        try:
            document = build_document(
                report,
            )
        except Exception:
            logger.exception(
                "Erreur de construction documentaire "
                "pour le rapport %s.",
                report.pk,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de construire "
                        "la structure documentaire."
                    ),
                },
                status=500,
            )

        return Response(
            document,
        )


class EditorValidationView(
    OwnedReportMixin,
    APIView,
):
    """
    Valide le document scientifique.
    """

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(
        self,
        request,
        pk,
    ):
        report = self.get_report(pk)

        if report is None:
            return self.report_not_found_response()

        try:
            result = (
                DocumentValidationService()
                .validate(
                    report,
                )
            )
        except Exception:
            logger.exception(
                "Erreur de validation du rapport %s.",
                report.pk,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de valider "
                        "le document."
                    ),
                },
                status=500,
            )

        return Response(
            result,
        )


class EditorStatisticsView(
    OwnedReportMixin,
    APIView,
):
    """
    Retourne les statistiques scientifiques et documentaires.
    """

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(
        self,
        request,
        pk,
    ):
        report = self.get_report(pk)

        if report is None:
            return self.report_not_found_response()

        try:
            result = (
                DocumentStatisticsService()
                .compute(
                    report,
                )
            )
        except Exception:
            logger.exception(
                "Erreur de calcul des statistiques "
                "du rapport %s.",
                report.pk,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de calculer "
                        "les statistiques du document."
                    ),
                },
                status=500,
            )

        return Response(
            result,
        )


class EditorExportView(
    OwnedReportMixin,
    APIView,
):
    """
    Endpoint central d'export de l'éditeur.

    Formats supportés par EditorExportService :

        pdf
        docx
        html
        latex
        tex
        zip
    """

    permission_classes = [
        permissions.IsAuthenticated,
    ]

    def get(
        self,
        request,
        pk,
        format_name,
    ):
        report = self.get_report(pk)

        if report is None:
            return self.report_not_found_response()

        format_name = (
            str(format_name)
            .strip()
            .lower()
        )

        # --------------------------------------------------------------
        # Validation documentaire
        # --------------------------------------------------------------

        try:
            validation = (
                DocumentValidationService()
                .validate(
                    report,
                )
            )
        except Exception:
            logger.exception(
                "Erreur pendant la validation avant "
                "export du rapport %s.",
                report.pk,
            )

            return Response(
                {
                    "detail": (
                        "Impossible de valider "
                        "le document avant export."
                    ),
                },
                status=500,
            )

        if not validation.get(
            "valid",
            False,
        ):
            return Response(
                {
                    "detail": (
                        "Le document ne peut pas "
                        "être exporté."
                    ),
                    "validation": validation,
                },
                status=400,
            )

        # --------------------------------------------------------------
        # Export
        #
        # Le contrôle du format reste volontairement dans
        # EditorExportService.
        #
        # Cela conserve le comportement historique de l'API :
        # un format inconnu produit une erreur serveur 500,
        # conformément aux tests actuels.
        # --------------------------------------------------------------

        try:
            path = (
                EditorExportService()
                .export(
                    report,
                    format_name,
                )
            )

        except Exception:
            logger.exception(
                "Erreur pendant l'export du rapport %s "
                "au format %s.",
                report.pk,
                format_name,
            )

            return Response(
                {
                    "detail": (
                        "Une erreur est survenue "
                        "pendant l'export."
                    ),
                },
                status=500,
            )

        # --------------------------------------------------------------
        # Vérification du résultat
        # --------------------------------------------------------------

        if path is None:
            logger.error(
                "Le service d'export a retourné un chemin vide "
                "pour le rapport %s au format %s.",
                report.pk,
                format_name,
            )

            return Response(
                {
                    "detail": (
                        "Le service d'export "
                        "n'a produit aucun fichier."
                    ),
                },
                status=500,
            )

        path = Path(
            path,
        )

        if not path.exists():
            logger.error(
                "Fichier d'export introuvable : %s",
                path,
            )

            return Response(
                {
                    "detail": (
                        "Le fichier d'export "
                        "n'existe pas."
                    ),
                },
                status=500,
            )

        if not path.is_file():
            logger.error(
                "Le chemin d'export n'est pas un fichier : %s",
                path,
            )

            return Response(
                {
                    "detail": (
                        "Le résultat d'export "
                        "n'est pas un fichier valide."
                    ),
                },
                status=500,
            )

        # --------------------------------------------------------------
        # Téléchargement
        # --------------------------------------------------------------

        try:
            file_handle = path.open(
                "rb",
            )
        except OSError:
            logger.exception(
                "Impossible d'ouvrir le fichier d'export : %s",
                path,
            )

            return Response(
                {
                    "detail": (
                        "Impossible d'ouvrir "
                        "le fichier d'export."
                    ),
                },
                status=500,
            )

        return FileResponse(
            file_handle,
            as_attachment=True,
            filename=path.name,
        )