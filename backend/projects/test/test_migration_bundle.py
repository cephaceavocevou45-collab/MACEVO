import hashlib
import json
import tempfile
import unittest
import zipfile
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import serializers
from django.core.management import call_command, CommandError
from django.db import connection
from django.test import TransactionTestCase, override_settings
from django.utils import timezone

from projects.models import ScientificProject


class MigrationBundleTests(TransactionTestCase):
    reset_sequences = True

    @unittest.skipUnless(
        connection.vendor == "sqlite",
        "La création du bundle exige la base SQLite source.",
    )
    def test_export_bundle_contains_consistent_database_fixture_and_media(self):
        user = get_user_model().objects.create_user(
            username="migration-bundle-source",
            password="test-password-only",
        )
        ScientificProject.objects.create(
            author=user,
            title="Projet de vérification du bundle",
        )

        with tempfile.TemporaryDirectory(prefix="macevo-bundle-test-") as directory:
            root = Path(directory)
            media_root = root / "media"
            media_root.mkdir()
            (media_root / "sample.txt").write_text("fichier de contrôle", encoding="utf-8")
            bundle = root / "bundle"
            with override_settings(MEDIA_ROOT=media_root):
                call_command(
                    "export_postgres_migration_bundle",
                    output_dir=str(bundle),
                    verbosity=0,
                )

            manifest = json.loads((bundle / "manifest.json").read_text(encoding="utf-8"))
            self.assertEqual(manifest["source_engine"], "sqlite")
            self.assertGreater(manifest["fixture_objects"], 0)
            self.assertIn("projects.scientificproject", manifest["fixture_model_counts"])
            for name, digest in manifest["files"].items():
                self.assertEqual(
                    hashlib.sha256((bundle / name).read_bytes()).hexdigest(),
                    digest,
                )
            with zipfile.ZipFile(bundle / "media.zip") as archive:
                self.assertIsNone(archive.testzip())
                self.assertEqual(archive.read("sample.txt"), "fichier de contrôle".encode())

    @unittest.skipUnless(
        connection.vendor == "postgresql",
        "L'import est autorisé uniquement sur PostgreSQL.",
    )
    def test_import_refuses_without_explicit_empty_target_confirmation(self):
        with tempfile.TemporaryDirectory(prefix="macevo-bundle-import-") as directory:
            with self.assertRaises(CommandError):
                call_command(
                    "import_postgres_migration_bundle",
                    directory,
                    verbosity=0,
                )

    @unittest.skipUnless(
        connection.vendor == "postgresql",
        "L'import réel du bundle cible PostgreSQL.",
    )
    def test_import_restores_fixture_and_media_to_empty_postgres(self):
        user_model = get_user_model()
        probe_user = user_model(
            pk=910_001,
            username="migration-import-probe",
            password="!",
            first_name="Migration",
            last_name="Probe",
            email="",
            is_staff=False,
            is_active=True,
            is_superuser=False,
            last_login=None,
            date_joined=timezone.now(),
        )
        probe_project = ScientificProject(
            pk=910_002,
            author_id=probe_user.pk,
            title="Projet restauré depuis un bundle",
            created_at=timezone.now(),
            updated_at=timezone.now(),
        )
        fixture_bytes = serializers.serialize(
            "json",
            [probe_user, probe_project],
        ).encode("utf-8")

        with tempfile.TemporaryDirectory(prefix="macevo-bundle-import-") as directory:
            root = Path(directory)
            bundle = root / "bundle"
            bundle.mkdir()
            (bundle / "database.sqlite3").write_bytes(
                "sauvegarde de contrôle".encode("utf-8")
            )
            (bundle / "data.json").write_bytes(fixture_bytes)
            with zipfile.ZipFile(bundle / "media.zip", "w") as archive:
                archive.writestr("documents/probe.txt", "média de contrôle")
            files = {
                name: hashlib.sha256((bundle / name).read_bytes()).hexdigest()
                for name in ("database.sqlite3", "data.json", "media.zip")
            }
            (bundle / "manifest.json").write_text(
                json.dumps(
                    {
                        "format_version": 1,
                        "files": files,
                        "fixture_objects": 2,
                    }
                ),
                encoding="utf-8",
            )
            media_root = root / "restored-media"
            with override_settings(MEDIA_ROOT=media_root):
                call_command(
                    "import_postgres_migration_bundle",
                    str(bundle),
                    confirm_empty_database=True,
                    verbosity=0,
                )

            self.assertTrue(
                user_model.objects.filter(pk=probe_user.pk).exists()
            )
            self.assertEqual(
                ScientificProject.objects.get(pk=probe_project.pk).author_id,
                probe_user.pk,
            )
            self.assertEqual(
                (media_root / "documents" / "probe.txt").read_text(encoding="utf-8"),
                "média de contrôle",
            )
