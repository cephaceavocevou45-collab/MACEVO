from __future__ import annotations

import hashlib
import json
import stat
import zipfile
from pathlib import Path, PurePosixPath

from django.apps import apps
from django.conf import settings
from django.core.management import BaseCommand, CommandError, call_command
from django.db import DEFAULT_DB_ALIAS, connections, transaction


class Command(BaseCommand):
    help = (
        "Importe un bundle MACEVO uniquement dans une base PostgreSQL migrée et vide."
    )

    def add_arguments(self, parser):
        parser.add_argument("bundle_dir", help="Dossier produit par l'export contrôlé.")
        parser.add_argument(
            "--confirm-empty-database",
            action="store_true",
            help="Confirme que la base PostgreSQL cible est destinée à cet import.",
        )

    @staticmethod
    def _sha256(path: Path) -> str:
        digest = hashlib.sha256()
        with path.open("rb") as file_handle:
            for block in iter(lambda: file_handle.read(1024 * 1024), b""):
                digest.update(block)
        return digest.hexdigest()

    @staticmethod
    def _safe_media_path(root: Path, member: str) -> Path:
        normalized = member.replace("\\", "/")
        relative = PurePosixPath(normalized)
        if (
            not normalized
            or normalized.startswith("/")
            or ":" in relative.parts[0]
            or any(part in {"", ".", ".."} for part in relative.parts)
        ):
            raise CommandError("L'archive média contient un chemin interdit.")
        target = root.joinpath(*relative.parts).resolve()
        if target != root and root not in target.parents:
            raise CommandError("Un chemin média sort du dossier de destination.")
        return target

    def handle(self, *args, **options):
        alias = DEFAULT_DB_ALIAS
        connection = connections[alias]
        if connection.vendor != "postgresql":
            raise CommandError("L'import est autorisé uniquement vers PostgreSQL.")
        if not options["confirm_empty_database"]:
            raise CommandError(
                "Relancez avec --confirm-empty-database après avoir vérifié la cible."
            )

        bundle_dir = Path(options["bundle_dir"]).expanduser().resolve()
        manifest_path = bundle_dir / "manifest.json"
        database_backup = bundle_dir / "database.sqlite3"
        fixture = bundle_dir / "data.json"
        media_archive = bundle_dir / "media.zip"
        if not all(
            path.is_file()
            for path in (manifest_path, database_backup, fixture, media_archive)
        ):
            raise CommandError("Le bundle est incomplet.")
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise CommandError("Le manifeste du bundle est invalide.") from exc

        for path in (database_backup, fixture, media_archive):
            expected = manifest.get("files", {}).get(path.name)
            if not expected or self._sha256(path) != expected:
                raise CommandError(f"Le contrôle d'intégrité a échoué : {path.name}.")

        try:
            fixture_rows = json.loads(fixture.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise CommandError("Le fixture de données est invalide.") from exc
        if not isinstance(fixture_rows, list):
            raise CommandError("Le fixture n'est pas une liste d'objets Django.")

        existing_tables = set(connection.introspection.table_names())
        system_tables = {
            "django_migrations",
            "django_content_type",
            "auth_permission",
        }
        nonempty_tables = []
        with connection.cursor() as cursor:
            for table in sorted(existing_tables - system_tables):
                cursor.execute(
                    f"SELECT 1 FROM {connection.ops.quote_name(table)} LIMIT 1"
                )
                if cursor.fetchone():
                    nonempty_tables.append(table)
        if nonempty_tables:
            raise CommandError(
                "Import refusé : la base cible contient déjà des données "
                "dans au moins une table applicative. Aucune fusion automatique."
            )

        model_counts: dict[str, int] = {}
        for row in fixture_rows:
            model_counts[row.get("model", "unknown")] = (
                model_counts.get(row.get("model", "unknown"), 0) + 1
            )
        for label in model_counts:
            try:
                apps.get_model(label)
            except (LookupError, ValueError) as exc:
                raise CommandError(f"Modèle inconnu dans le fixture : {label}.") from exc

        media_root = Path(settings.MEDIA_ROOT).resolve()
        media_root.mkdir(parents=True, exist_ok=True)
        created_files: list[Path] = []
        try:
            with zipfile.ZipFile(media_archive) as archive:
                if archive.testzip() is not None:
                    raise CommandError("L'archive média est corrompue.")
                prepared = []
                seen = set()
                for info in archive.infolist():
                    if info.is_dir():
                        continue
                    mode = info.external_attr >> 16
                    if stat.S_ISLNK(mode):
                        raise CommandError("Les liens symboliques sont interdits dans les médias.")
                    target = self._safe_media_path(media_root, info.filename)
                    if target in seen:
                        raise CommandError("L'archive média contient un chemin en double.")
                    seen.add(target)
                    if target.exists():
                        raise CommandError(
                            "Import média refusé : un fichier de destination existe déjà."
                        )
                    prepared.append((info, target))

                with transaction.atomic(using=alias):
                    call_command(
                        "loaddata",
                        str(fixture),
                        database=alias,
                        verbosity=0,
                    )
                    for label, expected_count in model_counts.items():
                        model = apps.get_model(label)
                        actual_count = model.objects.using(alias).count()
                        if actual_count < expected_count:
                            raise CommandError(
                                f"Contrôle après import échoué pour {label}."
                            )

                    for info, target in prepared:
                        target.parent.mkdir(parents=True, exist_ok=True)
                        with archive.open(info, "r") as source, target.open("xb") as dest:
                            while block := source.read(1024 * 1024):
                                dest.write(block)
                        created_files.append(target)
        except Exception as exc:
            # Les seuls fichiers supprimés ici sont ceux créés par cet import.
            for path in reversed(created_files):
                try:
                    path.unlink(missing_ok=True)
                except OSError:
                    pass
            if isinstance(exc, CommandError):
                raise
            raise CommandError(
                f"L'import a échoué ({type(exc).__name__}); la transaction DB a été annulée."
            ) from exc

        self.stdout.write(
            self.style.SUCCESS(
                f"Import terminé : {len(fixture_rows)} objets et "
                f"{len(created_files)} médias restaurés sur PostgreSQL."
            )
        )
