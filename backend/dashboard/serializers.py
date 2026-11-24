from rest_framework import serializers

class DashboardStatsSerializer(serializers.Serializer):
    total_reports = serializers.IntegerField()
    draft_reports = serializers.IntegerField()
    progress_reports = serializers.IntegerField()
    completed_reports = serializers.IntegerField()
    reports_today = serializers.IntegerField()