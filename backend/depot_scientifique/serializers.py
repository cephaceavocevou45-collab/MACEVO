from rest_framework import serializers

from .models import ScientificDeposit


class ScientificDepositSerializer(serializers.ModelSerializer):
    """
    Serializer principal du dépôt scientifique.

    Les informations scientifiques principales restent
    issues du Report canonique.
    """

    report_id = serializers.IntegerField(
        source="report.id",
        read_only=True,
    )

    title = serializers.CharField(
        source="report.title",
        read_only=True,
    )

    summary = serializers.CharField(
        source="report.summary",
        read_only=True,
    )

    scientific_field = serializers.CharField(
        source="report.scientific_field",
        read_only=True,
    )

    report_type = serializers.CharField(
        source="report.report_type",
        read_only=True,
    )

    academic_level = serializers.CharField(
        source="report.academic_level",
        read_only=True,
    )

    language = serializers.CharField(
        source="report.language",
        read_only=True,
    )

    institution = serializers.CharField(
        source="report.institution",
        read_only=True,
    )

    department = serializers.CharField(
        source="report.department",
        read_only=True,
    )

    supervisor = serializers.CharField(
        source="report.supervisor",
        read_only=True,
    )

    academic_year = serializers.CharField(
        source="report.academic_year",
        read_only=True,
    )

    author_id = serializers.IntegerField(
        source="report.author.id",
        read_only=True,
    )

    author_username = serializers.CharField(
        source="report.author.username",
        read_only=True,
    )

    report_file = serializers.FileField(
        source="report.document",
        read_only=True,
    )

    is_public = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = ScientificDeposit

        fields = [
            "id",
            "public_id",

            "report_id",

            "title",
            "summary",
            "scientific_field",
            "report_type",
            "academic_level",
            "language",
            "institution",
            "department",
            "supervisor",
            "academic_year",

            "author_id",
            "author_username",

            "report_file",

            "document_type",
            "visibility",
            "publication_status",

            "consent_given",
            "consent_given_at",
            "consent_version",

            "published_at",
            "withdrawn_at",

            "view_count",
            "download_count",

            "deposited_by",

            "is_public",

            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "public_id",
            "report_id",

            "title",
            "summary",
            "scientific_field",
            "report_type",
            "academic_level",
            "language",
            "institution",
            "department",
            "supervisor",
            "academic_year",

            "author_id",
            "author_username",

            "report_file",

            "consent_given",
            "consent_given_at",
            "consent_version",

            "published_at",
            "withdrawn_at",

            "view_count",
            "download_count",

            "deposited_by",

            "is_public",

            "created_at",
            "updated_at",
        ]

    def to_representation(self, instance):
        """
        Masque le fichier aux utilisateurs publics lorsqu'un dépôt
        n'est pas public.

        Le propriétaire conserve l'accès aux informations de son dépôt.
        """

        data = super().to_representation(instance)

        request = self.context.get("request")

        is_owner = False

        if (
            request
            and request.user
            and request.user.is_authenticated
        ):
            is_owner = (
                instance.report.author_id == request.user.id
            )

        if not instance.is_public and not is_owner:
            data["report_file"] = None

        return data


class ScientificDepositCreateSerializer(serializers.ModelSerializer):
    """
    Serializer utilisé lors de la création d'un dépôt.
    """

    class Meta:
        model = ScientificDeposit

        fields = [
            "report",
            "document_type",
        ]

    def validate_report(self, report):
        request = self.context.get("request")

        if request is None or not request.user.is_authenticated:
            raise serializers.ValidationError(
                "Vous devez être authentifié."
            )

        if report.author_id != request.user.id:
            raise serializers.ValidationError(
                "Vous ne pouvez déposer que vos propres documents."
            )

        if hasattr(report, "scientific_deposit"):
            raise serializers.ValidationError(
                "Ce document possède déjà un dépôt scientifique."
            )

        return report


class ScientificConsentSerializer(serializers.Serializer):
    """
    Validation de l'autorisation explicite de publication.
    """

    accepted = serializers.BooleanField()

    consent_version = serializers.CharField(
        max_length=30,
        default="1.0",
        required=False,
    )

    def validate_accepted(self, value):
        if value is not True:
            raise serializers.ValidationError(
                "L'autorisation explicite est obligatoire."
            )

        return value


class ScientificPublicationSerializer(serializers.Serializer):
    """
    Validation de la demande de publication.
    """

    confirm = serializers.BooleanField()

    def validate_confirm(self, value):
        if value is not True:
            raise serializers.ValidationError(
                "La confirmation de publication est obligatoire."
            )

        return value