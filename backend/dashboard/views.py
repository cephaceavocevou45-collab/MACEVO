from datetime import timedelta

from django.utils import timezone
from django.db.models import Count
from django.db.models.functions import TruncMonth

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from reports.models import Report
from reports.serializers import ReportSerializer

from .serializers import DashboardStatsSerializer


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):

        # ======================================
        # Tous les rapports de l'utilisateur
        # ======================================

        reports = Report.objects.filter(
            author=request.user
        ).order_by("-created_at")

        # ======================================
        # Filtre par période
        # ======================================

        period = request.GET.get("period", "all")

        today = timezone.now()

        if period == "today":

            reports = reports.filter(
                created_at__date=today.date()
            )

        elif period == "week":

            reports = reports.filter(
                created_at__gte=today - timedelta(days=7)
            )

        elif period == "month":

            reports = reports.filter(
                created_at__year=today.year,
                created_at__month=today.month
            )

        elif period == "year":

            reports = reports.filter(
                created_at__year=today.year
            )

        # ======================================
        # Statistiques générales
        # ======================================

        total_reports = reports.count()

        draft_reports = reports.filter(
            status="draft"
        ).count()

        progress_reports = reports.filter(
            status="progress"
        ).count()

        completed_reports = reports.filter(
            status="completed"
        ).count()

        reports_today = reports.filter(
            created_at__date=today.date()
        ).count()

        # ======================================
        # Répartition par domaine scientifique
        # ======================================

        scientific_fields = {}

        for report in reports:

            field = report.scientific_field

            scientific_fields[field] = (
                scientific_fields.get(field, 0) + 1
            )

        # ======================================
        # Evolution mensuelle
        # ======================================

        monthly_reports = (
            reports
            .annotate(month=TruncMonth("created_at"))
            .values("month")
            .annotate(total=Count("id"))
            .order_by("month")
        )

        monthly_data = []

        for item in monthly_reports:

            monthly_data.append({
                "month": item["month"].strftime("%b"),
                "total": item["total"],
            })

        # ======================================
        # Indicateurs scientifiques
        # ======================================

        first_report = "-"

        last_report = "-"

        top_field = "-"

        completion_rate = 0

        average_reports_per_month = 0

        if reports.exists():

            first_report = (
                reports.last()
                .created_at
                .strftime("%d/%m/%Y")
            )

            last_report = (
                reports.first()
                .created_at
                .strftime("%d/%m/%Y")
            )

            if scientific_fields:

                top_field = max(
                    scientific_fields,
                    key=scientific_fields.get
                )

            completion_rate = round(
                (completed_reports / total_reports) * 100,
                1
            )

            if len(monthly_data) > 0:

                average_reports_per_month = round(
                    total_reports / len(monthly_data),
                    1
                )

        # ======================================
        # Derniers rapports
        # ======================================

        recent_reports = reports[:5]

        # ======================================
        # Sérialisation
        # ======================================

        stats = {
            "total_reports": total_reports,
            "draft_reports": draft_reports,
            "progress_reports": progress_reports,
            "completed_reports": completed_reports,
            "reports_today": reports_today,
        }

        stats_serializer = DashboardStatsSerializer(stats)

        reports_serializer = ReportSerializer(
            recent_reports,
            many=True,
        )

        return Response({

            "stats": stats_serializer.data,

            "recent_reports": reports_serializer.data,

            "scientific_fields": scientific_fields,

            "monthly_reports": monthly_data,

            "first_report": first_report,

            "last_report": last_report,

            "top_field": top_field,

            "completion_rate": completion_rate,

            "average_reports_per_month": average_reports_per_month,

        })