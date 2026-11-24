from unittest.mock import patch

from django.test import SimpleTestCase, override_settings
from rest_framework.test import APIClient

from core.ai.contracts.result import AIResult
from apps.assistant.api.serializers import ChatRequestSerializer
from apps.assistant.api.views import (
    ACADEMIC_ASSISTANT_INSTRUCTIONS,
    AssistantChatView,
)


class ChatRequestSerializerTests(SimpleTestCase):
    def test_accepts_full_conversation_history(self):
        serializer = ChatRequestSerializer(
            data={
                "message": "Question actuelle",
                "messages": [
                    {"role": "user", "content": "Ancienne question"},
                    {"role": "assistant", "content": "Ancienne réponse"},
                    {"role": "user", "content": "Question actuelle"},
                ],
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(len(serializer.validated_data["messages"]), 3)

    def test_accepts_gateway_user_id_for_scoped_memory(self):
        serializer = ChatRequestSerializer(
            data={
                "message": "Question actuelle",
                "user_id": "student-42",
            }
        )

        self.assertTrue(serializer.is_valid(), serializer.errors)
        self.assertEqual(serializer.validated_data["user_id"], "student-42")


class AssistantChatRequestMappingTests(SimpleTestCase):
    def test_builds_academic_request_and_preserves_user_scope(self):
        request = AssistantChatView()._build_ai_request(
            {
                "message": "Question sur ma méthodologie",
                "user_id": "student-42",
                "instructions": ["Réponds de façon concise."],
            }
        )

        self.assertEqual(request.user_id, "student-42")
        self.assertEqual(
            request.instructions[0],
            ACADEMIC_ASSISTANT_INSTRUCTIONS,
        )
        self.assertEqual(
            request.instructions[1],
            "Réponds de façon concise.",
        )


class AssistantChatAuthenticationTests(SimpleTestCase):
    def setUp(self):
        self.client = APIClient()
        self.client.defaults["HTTP_HOST"] = "127.0.0.1"
        self.url = "/api/ai/chat/"
        self.payload = {"message": "Bonjour"}

    @override_settings(DEBUG=False, MACEVO_IA_SERVICE_TOKEN="internal-secret")
    def test_rejects_requests_without_service_token(self):
        response = self.client.post(self.url, self.payload, format="json")

        self.assertEqual(response.status_code, 403)

    @override_settings(DEBUG=False, MACEVO_IA_SERVICE_TOKEN="internal-secret")
    @patch("apps.assistant.api.views.AIService")
    def test_accepts_requests_with_service_token(self, service_class):
        service_class.return_value.execute.return_value = AIResult.success_result(
            data="Réponse IA"
        )

        response = self.client.post(
            self.url,
            self.payload,
            format="json",
            HTTP_X_MACEVO_IA_TOKEN="internal-secret",
        )

        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["data"], "Réponse IA")

    @override_settings(DEBUG=False, MACEVO_IA_SERVICE_TOKEN="internal-secret")
    @patch("apps.assistant.api.views.AIService")
    def test_accepts_ndjson_stream_requests(self, service_class):
        service_class.return_value.stream.return_value = iter([
            {"type": "start"},
            {"type": "content", "content": "OK"},
            {"type": "done"},
        ])

        response = self.client.post(
            self.url,
            {"message": "Réponds OK", "stream": True},
            format="json",
            HTTP_ACCEPT="application/x-ndjson",
            HTTP_X_MACEVO_IA_TOKEN="internal-secret",
        )

        body = b"".join(response.streaming_content).decode("utf-8")
        self.assertEqual(response.status_code, 200)
        self.assertIn('"type":"content"', body)
