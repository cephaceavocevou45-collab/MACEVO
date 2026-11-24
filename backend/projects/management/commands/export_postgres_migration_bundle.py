from __future__ import annotations

import hashlib
import io
import json
import sqlite3
import zipfile
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import DEFAULT_DB_ALIAS, connections


class Command(BaseCommand):
    help = (
        "Crée une sauvegarde SQLite, un fixture Django et une archive des médias "
        "pour une migration PostgreSQL contrôlée."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--output-dir",
            required=True,
            help="Dossier de destination neuf, protégé comme une sauvegarde sensible.",
        )

    @staticmethod
    def _sha256(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as file_handle:
            for block in iter(lambda: file_handle.read(1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest()

    def handle(self, *args, **options):
        alias = DEFAULT_DB_ALIAS
        connection = connections[alias]
        if connection.vendor != "sqlite":
            raise CommandError(
                "Cette commande exporte uniquement la base SQLite source."
            )

        source_name = connection.settings_dict.get("NAME")
        is_memory_database = source_name == ":memory:" or str(source_name).startswith("file:")
        source_path = Path(source_name).resolve() if not is_memory_database else None
        if source_path is not None and not source_path.is_file():
            raise CommandError("Le fichier SQLite source est introuvable.")

        output_dir = Path(options["output_dir"]).expanduser().resolve()
        if output_dir.exists():
            raise CommandError(
                "Le dossier de destination existe déjà. Choisissez un dossier neuf."
            )
        output_dir.mkdir(parents=True)

        database_backup = output_dir / "database.sqlite3"
        fixture = output_dir / "data.json"
        media_archive = output_dir / "media.zip"
        manifest_path = output_dir / "manifest.json"
        original_database = connection.settings_dict.copy()

        try:
            destination = sqlite3.connect(str(database_backup))
            try:
                if source_path is not None:
                    source = sqlite3.connect(str(source_path))
                    try:
                        source.backup(destination)
                    finally:
                        source.close()
                else:
                    connection.ensure_connection()
                    connection.connection.backup(destination)
            finally:
                destination.close()

            # Le fixture et la copie SQLite proviennent du même snapshot stable.
            connections.close_all()
            connections.databases[alias] = {
                **original_database,
                "NAME": str(database_backup),
            }
            try:
                fixture_stream = io.StringIO()
                call_command(
                    "dumpdata",
                    database=alias,
                    format="json",
                    indent=2,
                    natural_foreign=True,
                    natural_primary=True,
                    exclude=(
                        "contenttypes",
                        "auth.permission",
                        "admin.logentry",
                        "sessions.session",
                    ),
                    stdout=fixture_stream,
                    verbosity=0,
                )
                fixture.write_text(fixture_stream.getvalue(), encoding="utf-8")
            finally:
                connections.close_all()
                connections.databases[alias] = original_database

            fixture_rows = json.loads(fixture.read_text(encoding="utf-8"))
            if not isinstance(fixture_rows, list):
                raise CommandError("Django n'a pas produit un fixture JSON valide.")
            model_counts = Counter(row.get("model", "unknown") for row in fixture_rows)

            media_root = Path(settings.MEDIA_ROOT).resolve()
            with zipfile.ZipFile(
                media_archive,
                mode="w",
                compression=zipfile.ZIP_DEFLATED,
            ) as archive:
                if media_root.is_dir():
                    for path in media_root.rglob("*"):
                        if not path.is_file() or path.is_symlink():
                            continue
                        relative = path.relative_to(media_root).as_posix()
                        if relative.startswith("../") or Path(relative).is_absolute():
                            raise CommandError("Un média sort du dossier autorisé.")
                        archive.write(path, relative)

            manifest = {
                "format_version": 1,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "source_database": source_path.name if source_path else "sqlite-memory-test",
                "source_engine": "sqlite",
                "fixture_objects": len(fixture_rows),
                "fixture_model_counts": dict(sorted(model_counts.items())),
                "files": {
                    database_backup.name: self._sha256(database_backup),
                    fixture.name: self._sha256(fixture),
                    media_archive.name: self._sha256(media_archive),
                },
                "import_policy": (
                    "Importer seulement dans une base PostgreSQL migrée et vide. "
                    "Ne jamais fusionner automatiquement avec des données existantes."
                ),
            }
            manifest_path.write_text(
                json.dumps(manifest, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
        except Exception as exc:
            connections.close_all()
            connections.databases[alias] = original_database
            if isinstance(exc, CommandError):
                raise
            raise CommandError(
                f"La préparation du bundle a échoué ({type(exc).__name__}). "
                "Vérifiez les fichiers dans le dossier de sortie avant de réessayer."
            ) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Bundle de migration créé : {output_dir} "
                f"({len(fixture_rows)} objets; aucune base cible modifiée)."
            )
        )
