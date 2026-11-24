from __future__ import annotations

from rest_framework import serializers


class ChatRequestSerializer(serializers.Serializer):
    message = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )

    user_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    conversation_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    document_id = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    model = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    provider = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    temperature = serializers.FloatField(
        required=False,
        allow_null=True,
        min_value=0.0,
        max_value=2.0,
    )

    max_tokens = serializers.IntegerField(
        required=False,
        allow_null=True,
        min_value=1,
    )

    stream = serializers.BooleanField(
        required=False,
        default=False,
    )

    tools = serializers.ListField(
        required=False,
        default=list,
        allow_empty=True,
    )

    instructions = serializers.ListField(
        required=False,
        default=list,
        allow_empty=True,
        child=serializers.CharField(),
    )

    metadata = serializers.DictField(
        required=False,
        default=dict,
    )


class ScientificDocumentRequestSerializer(
    serializers.Serializer
):
    subject = serializers.CharField(
        required=True,
        allow_blank=False,
        trim_whitespace=True,
    )

    document_type = serializers.ChoiceField(
        required=False,
        default="rapport",
        choices=[
            "article",
            "rapport",
            "memoire",
            "these",
        ],
    )

    title = serializers.CharField(
        required=False,
        allow_blank=True,
        allow_null=True,
    )

    author = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    institution = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    department = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    supervisor = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    research_question = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    problem_statement = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    general_objective = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    objectives = serializers.ListField(
        required=False,
        default=list,
        allow_empty=True,
        child=serializers.CharField(),
    )

    hypotheses = serializers.ListField(
        required=False,
        default=list,
        allow_empty=True,
        child=serializers.CharField(),
    )

    methodology = serializers.CharField(
        required=False,
        allow_blank=True,
    )

    expected_results = serializers.ListField(
        required=False,
        default=list,
        allow_empty=True,
        child=serializers.CharField(),
    )

    keywords = serializers.ListField(
        required=False,
        default=list,
        allow_empty=True,
        child=serializers.CharField(),
    )

    generate_content = serializers.BooleanField(
        required=False,
        default=True,
    )

    validate = serializers.BooleanField(
        required=False,
        default=True,
    )

    correct = serializers.BooleanField(
        required=False,
        default=True,
    )

    metadata = serializers.DictField(
        required=False,
        default=dict,
    )