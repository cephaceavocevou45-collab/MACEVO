from unittest.mock import Mock, patch

from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings

from assistant.macevo_ia_client import MacevoIAClient
from assistant.services import AssistantService, _select_document_excerpts


class MacevoIAClientTests(SimpleTestCase):
    def test_long_document_context_is_bounded_and_marks_partial_coverage(self):
        pages = [
            f"--- PAGE {page} ---\n" +
            (("Climate adaptation evidence and findings. " if page == 4 else "Baseline research observation. ") * 90)
            for page in range(1, 9)
        ]

        excerpts, coverage = _select_document_excerpts(
            "\n".join(pages),
            "Summarize climate adaptation findings",
        )

        self.assertLessEqual(len(excerpts), 5000)
        self.assertIn("--- PAGE 4 ---", excerpts)
        self.assertIn("pas l'intégralité", coverage)
        self.assertIn("4", coverage)

    @patch("assistant.document_service.DocumentService.extract_text")
    def test_document_extraction_errors_are_not_silently_ignored(self, extract_text):
        extract_text.side_effect = ValueError("PDF scanned; OCR unavailable")
        attachment = SimpleUploadedFile(
            "scan.pdf", b"pdf", content_type="application/pdf"
        )

        with self.assertRaisesMessage(ValueError, "PDF scanned; OCR unavailable"):
            AssistantService._extract_document_text(attachment, conversation=None)

    @override_settings(
        MACEVO_IA_BASE_URL="http://127.0.0.1:8100",
        MACEVO_IA_SERVICE_TOKEN="service-secret",
        MACEVO_IA_TIMEOUT=12,
    )
    @patch("assistant.macevo_ia_client.requests.post")
    def test_chat_forwards_history_and_service_token(self, post):
        response = Mock()
        response.json.return_value = {
            "success": True,
            "data": "Réponse de MACEVO_IA",
        }
        post.return_value = response

        result = MacevoIAClient.chat(
            messages=[
                {"role": "user", "content": "Question précédente"},
                {"role": "assistant", "content": "Contexte précédent"},
                {"role": "user", "content": "Question actuelle"},
            ],
            user_id=42,
            conversation_id=8,
            project_id=91,
        )

        self.assertEqual(result, "Réponse de MACEVO_IA")
        url = post.call_args.args[0]
        request = post.call_args.kwargs
        self.assertEqual(url, "http://127.0.0.1:8100/api/ai/chat/")
        self.assertEqual(request["headers"]["X-MACEVO-IA-TOKEN"], "service-secret")
        self.assertEqual(request["json"]["messages"][0]["content"], "Question précédente")
        self.assertIsNone(request["json"]["conversation_id"])
        self.assertEqual(request["json"]["user_id"], "42")
        self.assertEqual(
            request["json"]["metadata"]["external_conversation_id"],
            "8",
        )
        self.assertEqual(request["json"]["metadata"]["project_id"], "91")
        self.assertNotIn("provider", request["json"])
        self.assertNotIn("model", request["json"])

    @override_settings(
        DEBUG=True,
        MACEVO_IA_BASE_URL="http://127.0.0.1:8100",
        MACEVO_IA_SERVICE_TOKEN="",
    )
    @patch("assistant.macevo_ia_client.requests.post")
    def test_omits_null_external_conversation_id(self, post):
        response = Mock()
        response.json.return_value = {
            "success": True,
            "data": "Réponse de MACEVO_IA",
        }
        post.return_value = response

        MacevoIAClient.chat(messages=[{"role": "user", "content": "Bonjour"}])

        metadata = post.call_args.kwargs["json"]["metadata"]
        self.assertEqual(metadata, {"source": "macevo_assistant"})

    @override_settings(
        DEBUG=True,
        MACEVO_IA_BASE_URL="http://127.0.0.1:8100",
        MACEVO_IA_SERVICE_TOKEN="",
    )
    def test_requires_messages(self):
        with self.assertRaises(ValueError):
            MacevoIAClient.chat(messages=[])

    @override_settings(
        DEBUG=False,
        MACEVO_IA_BASE_URL="https://macevo-ia.example",
        MACEVO_IA_SERVICE_TOKEN="",
    )
    def test_requires_service_token_in_production(self):
        with self.assertRaisesMessage(RuntimeError, "MACEVO_IA_SERVICE_TOKEN"):
            MacevoIAClient._request()

    @override_settings(
        DEBUG=True,
        MACEVO_IA_BASE_URL="http://127.0.0.1:8100",
        MACEVO_IA_SERVICE_TOKEN="",
    )
    @patch("assistant.macevo_ia_client.requests.post")
    def test_stream_forwards_ndjson_and_yields_events(self, post):
        response = Mock()
        response.iter_lines.return_value = iter([
            '{"type":"start"}',
            '{"type":"content","content":"Bonjour"}',
            '{"type":"done"}',
        ])
        post.return_value = response

        events = list(
            MacevoIAClient.stream_chat(
                messages=[{"role": "user", "content": "Bonjour"}],
                user_id=42,
                conversation_id=8,
            )
        )

        self.assertEqual(events[1]["content"], "Bonjour")
        self.assertTrue(post.call_args.kwargs["json"]["stream"])
        self.assertTrue(post.call_args.kwargs["stream"])
        response.close.assert_called_once()
