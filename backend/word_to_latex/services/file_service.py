from __future__ import annotations

import logging
import re
import shutil
import uuid
from pathlib import Path
from typing import Optional, Union

from django.conf import settings
from django.core.files import File
from django.core.files.storage import default_storage
from django.db import transaction

from ..models import WordToLatexConversion


logger = logging.getLogger(__name__)


class FileService:
    """
    Service centralisé de gestion des fichiers pour Word → LaTeX.

    Responsabilités :
    - gestion des répertoires de conversion ;
    - noms de fichiers sûrs ;
    - création des conversions ;
    - sauvegarde des DOCX uploadés ;
    - résolution des chemins ;
    - suppression et nettoyage ;
    - statistiques de fichiers ;
    - compatibilité avec Django Storage / MEDIA_ROOT.
    """

    BASE_DIRECTORY_NAME = "word_to_latex"
    UPLOAD_DIRECTORY_NAME = "uploads"
    CONVERSION_DIRECTORY_NAME = "conversions"
    LATEX_DIRECTORY_NAME = "latex"
    IMAGES_DIRECTORY_NAME = "images"

    MAX_FILENAME_LENGTH = 180

    ALLOWED_DOCUMENT_EXTENSIONS = {".docx"}

    # ------------------------------------------------------------------
    # Création d'une conversion
    # ------------------------------------------------------------------

    @classmethod
    @transaction.atomic
    def create_conversion(
        cls,
        document,
        user=None,
        options: Optional[dict] = None,
    ) -> WordToLatexConversion:
        """
        Crée une conversion Word → LaTeX et enregistre le document original.

        Cette méthode correspond à l'appel effectué par views.py :

            FileService.create_conversion(
                document=document,
                user=request.user,
                options=validated_options,
            )

        Le fichier original est enregistré dans le FileField
        `original_file` du modèle WordToLatexConversion.
        """

        if document is None:
            raise ValueError("Aucun document Word n'a été fourni.")

        original_filename = getattr(document, "name", None)

        if not original_filename:
            raise ValueError(
                "Le fichier uploadé possède un nom invalide."
            )

        if not cls.validate_document_filename(original_filename):
            raise ValueError(
                "Format de fichier non supporté. "
                "Seuls les fichiers .docx sont acceptés."
            )

        options = options or {}

        # --------------------------------------------------------------
        # Nom et taille du document
        # --------------------------------------------------------------

        safe_name = cls.safe_filename(
            original_filename,
            default_name="document",
            extension=".docx",
        )

        try:
            file_size = int(getattr(document, "size", 0) or 0)
        except (TypeError, ValueError):
            file_size = 0

        # --------------------------------------------------------------
        # Création de l'objet Conversion
        # --------------------------------------------------------------

        conversion = WordToLatexConversion(
            user=user,
            original_filename=safe_name,
            file_size=file_size,
            status=WordToLatexConversion.STATUS_UPLOADED,
            progress=10,

            document_class=options.get(
                "document_class",
                "report",
            ),

            font_size=options.get(
                "font_size",
                "11pt",
            ),

            margins=options.get(
                "margins",
                "2.5cm",
            ),

            language=options.get(
                "language",
                "french",
            ),

            table_of_contents=options.get(
                "table_of_contents",
                True,
            ),

            section_numbering=options.get(
                "section_numbering",
                True,
            ),

            bibliography_package=options.get(
                "bibliography_package",
                "biblatex",
            ),

            bibliography_style=options.get(
                "bibliography_style",
                "apa",
            ),

            image_handling=options.get(
                "image_handling",
                "copy",
            ),

            optimize_images=options.get(
                "optimize_images",
                True,
            ),

            include_footnotes=options.get(
                "include_footnotes",
                True,
            ),

            include_comments=options.get(
                "include_comments",
                False,
            ),

            include_metadata=options.get(
                "include_metadata",
                False,
            ),

            detect_complex_tables=options.get(
                "detect_complex_tables",
                True,
            ),

            auto_error_correction=options.get(
                "auto_error_correction",
                True,
            ),
        )

        # --------------------------------------------------------------
        # Enregistrement du fichier original
        # --------------------------------------------------------------

        try:
            if hasattr(document, "seek"):
                document.seek(0)

            conversion.original_file.save(
                safe_name,
                document,
                save=False,
            )

            conversion.save()

        except Exception:
            logger.exception(
                "Impossible de créer la conversion Word → LaTeX."
            )

            try:
                if conversion.original_file:
                    conversion.original_file.delete(
                        save=False,
                    )
            except Exception:
                logger.exception(
                    "Impossible de nettoyer le fichier original "
                    "après échec de création."
                )

            raise

        logger.info(
            "Conversion Word → LaTeX créée : %s pour l'utilisateur %s",
            conversion.id,
            getattr(user, "id", None),
        )

        return conversion

    # ------------------------------------------------------------------
    # Chemins principaux
    # ------------------------------------------------------------------

    @classmethod
    def get_media_root(cls) -> Path:
        """
        Retourne MEDIA_ROOT sous forme de Path.
        """
        media_root = getattr(settings, "MEDIA_ROOT", None)

        if not media_root:
            raise RuntimeError(
                "MEDIA_ROOT n'est pas configuré dans les settings Django."
            )

        path = Path(media_root).resolve()
        path.mkdir(parents=True, exist_ok=True)

        return path

    @classmethod
    def get_base_directory(cls) -> Path:
        """
        Répertoire racine utilisé par le service Word → LaTeX.
        """
        path = cls.get_media_root() / cls.BASE_DIRECTORY_NAME
        path.mkdir(parents=True, exist_ok=True)
        return path

    @classmethod
    def get_upload_directory(cls) -> Path:
        """
        Répertoire destiné aux fichiers DOCX originaux.
        """
        path = cls.get_base_directory() / cls.UPLOAD_DIRECTORY_NAME
        path.mkdir(parents=True, exist_ok=True)
        return path

    @classmethod
    def get_conversion_directory(
        cls,
        conversion_id: Union[str, uuid.UUID],
    ) -> Path:
        """
        Retourne le répertoire principal d'une conversion.
        """
        conversion_id = str(conversion_id)

        if not conversion_id:
            raise ValueError("conversion_id est obligatoire.")

        if not re.fullmatch(r"[A-Za-z0-9_-]+", conversion_id):
            raise ValueError("conversion_id invalide.")

        path = (
            cls.get_base_directory()
            / cls.CONVERSION_DIRECTORY_NAME
            / conversion_id
        )

        path.mkdir(parents=True, exist_ok=True)

        return path

    @classmethod
    def get_latex_directory(
        cls,
        conversion_id: Union[str, uuid.UUID],
    ) -> Path:
        """
        Retourne le répertoire contenant les fichiers LaTeX générés.
        """
        path = (
            cls.get_conversion_directory(conversion_id)
            / cls.LATEX_DIRECTORY_NAME
        )

        path.mkdir(parents=True, exist_ok=True)

        return path

    @classmethod
    def get_images_directory(
        cls,
        conversion_id: Union[str, uuid.UUID],
    ) -> Path:
        """
        Retourne le répertoire des images extraites.
        """
        path = (
            cls.get_latex_directory(conversion_id)
            / cls.IMAGES_DIRECTORY_NAME
        )

        path.mkdir(parents=True, exist_ok=True)

        return path

    @classmethod
    def ensure_conversion_directories(
        cls,
        conversion_id: Union[str, uuid.UUID],
    ) -> dict[str, Path]:
        """
        Crée et retourne tous les répertoires nécessaires à une conversion.
        """
        conversion_directory = cls.get_conversion_directory(
            conversion_id
        )

        latex_directory = cls.get_latex_directory(
            conversion_id
        )

        images_directory = cls.get_images_directory(
            conversion_id
        )

        return {
            "conversion": conversion_directory,
            "latex": latex_directory,
            "images": images_directory,
        }

    # ------------------------------------------------------------------
    # Noms de fichiers
    # ------------------------------------------------------------------

    @classmethod
    def safe_filename(
        cls,
        filename: Optional[str],
        default_name: str = "document",
        extension: Optional[str] = None,
    ) -> str:
        """
        Nettoie un nom de fichier provenant d'un utilisateur.

        Exemple :
            "Mon rapport final (version 2).docx"
            -> "Mon_rapport_final_version_2.docx"
        """
        original = str(filename or "").strip()

        if not original:
            original = default_name

        original = original.replace("\\", "/")
        original = original.split("/")[-1]

        path = Path(original)

        suffix = path.suffix.lower()
        stem = path.stem

        if extension:
            extension = (
                extension
                if extension.startswith(".")
                else f".{extension}"
            )

            suffix = extension.lower()

        stem = stem.strip()

        stem = re.sub(
            r"[^\w\s.-]",
            "",
            stem,
            flags=re.UNICODE,
        )

        stem = re.sub(
            r"[\s]+",
            "_",
            stem,
        )

        stem = re.sub(
            r"_+",
            "_",
            stem,
        )

        stem = stem.strip("._-")

        if not stem:
            stem = default_name

        reserved_names = {
            "CON",
            "PRN",
            "AUX",
            "NUL",
            "COM1",
            "COM2",
            "COM3",
            "COM4",
            "COM5",
            "COM6",
            "COM7",
            "COM8",
            "COM9",
            "LPT1",
            "LPT2",
            "LPT3",
            "LPT4",
            "LPT5",
            "LPT6",
            "LPT7",
            "LPT8",
            "LPT9",
        }

        if stem.upper() in reserved_names:
            stem = f"file_{stem.lower()}"

        max_stem_length = max(
            1,
            cls.MAX_FILENAME_LENGTH - len(suffix),
        )

        stem = stem[:max_stem_length].rstrip("._-")

        return f"{stem}{suffix}"

    @classmethod
    def generate_unique_filename(
        cls,
        filename: Optional[str],
        extension: Optional[str] = None,
    ) -> str:
        """
        Génère un nom de fichier sûr et unique.
        """
        safe_name = cls.safe_filename(
            filename,
            extension=extension,
        )

        path = Path(safe_name)

        unique_suffix = uuid.uuid4().hex[:12]

        if path.suffix:
            return (
                f"{path.stem}_{unique_suffix}{path.suffix}"
            )

        return f"{path.name}_{unique_suffix}"

    @classmethod
    def validate_document_filename(
        cls,
        filename: str,
    ) -> bool:
        """
        Vérifie qu'un nom correspond à un document DOCX.
        """
        if not filename:
            return False

        suffix = Path(filename).suffix.lower()

        return suffix in cls.ALLOWED_DOCUMENT_EXTENSIONS

    # ------------------------------------------------------------------
    # Upload physique
    # ------------------------------------------------------------------

    @classmethod
    def save_uploaded_file(
        cls,
        uploaded_file,
        conversion_id: Optional[Union[str, uuid.UUID]] = None,
        filename: Optional[str] = None,
    ) -> Path:
        """
        Sauvegarde physiquement un fichier uploadé.
        """
        if uploaded_file is None:
            raise ValueError("Aucun fichier à sauvegarder.")

        original_name = filename or getattr(
            uploaded_file,
            "name",
            None,
        )

        if not original_name:
            raise ValueError(
                "Le fichier uploadé possède un nom invalide."
            )

        if not cls.validate_document_filename(original_name):
            raise ValueError(
                "Format de fichier non supporté. "
                "Seuls les fichiers .docx sont acceptés."
            )

        safe_name = cls.safe_filename(
            original_name,
            default_name="document",
            extension=".docx",
        )

        if conversion_id is not None:
            target_directory = cls.get_conversion_directory(
                conversion_id
            )
        else:
            target_directory = cls.get_upload_directory()

        target_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        target_path = target_directory / safe_name

        if target_path.exists():
            target_path = (
                target_directory
                / cls.generate_unique_filename(
                    safe_name,
                    extension=".docx",
                )
            )

        cls._write_uploaded_file(
            uploaded_file,
            target_path,
        )

        return target_path.resolve()

    @classmethod
    def _write_uploaded_file(
        cls,
        uploaded_file,
        target_path: Path,
    ) -> None:
        """
        Écrit un UploadedFile Django sur disque par chunks.
        """
        target_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        try:
            with target_path.open("wb") as destination:
                if hasattr(uploaded_file, "chunks"):
                    for chunk in uploaded_file.chunks():
                        destination.write(chunk)

                else:
                    uploaded_file.seek(0)

                    while True:
                        chunk = uploaded_file.read(
                            1024 * 1024
                        )

                        if not chunk:
                            break

                        destination.write(chunk)

        except Exception:
            try:
                if target_path.exists():
                    target_path.unlink()

            except OSError:
                logger.exception(
                    "Impossible de supprimer le fichier "
                    "partiellement écrit : %s",
                    target_path,
                )

            raise

    # ------------------------------------------------------------------
    # Django Storage
    # ------------------------------------------------------------------

    @classmethod
    def save_to_storage(
        cls,
        uploaded_file,
        directory: str = "word_to_latex/uploads",
        filename: Optional[str] = None,
    ) -> str:
        """
        Sauvegarde via Django default_storage.
        """
        original_name = filename or getattr(
            uploaded_file,
            "name",
            None,
        )

        safe_name = cls.safe_filename(
            original_name,
            default_name="document",
        )

        storage_directory = directory.strip("/")

        storage_name = (
            f"{storage_directory}/{safe_name}"
        )

        if default_storage.exists(storage_name):
            safe_name = cls.generate_unique_filename(
                safe_name
            )

            storage_name = (
                f"{storage_directory}/{safe_name}"
            )

        saved_name = default_storage.save(
            storage_name,
            uploaded_file,
        )

        return saved_name

    @classmethod
    def storage_path(
        cls,
        storage_name: str,
    ) -> Path:
        """
        Retourne le chemin physique correspondant à un fichier Django Storage.
        """
        if not storage_name:
            raise ValueError(
                "storage_name est obligatoire."
            )

        try:
            path = Path(
                default_storage.path(
                    storage_name
                )
            ).resolve()

        except (
            AttributeError,
            NotImplementedError,
        ):
            raise RuntimeError(
                "Le backend Django Storage configuré ne fournit "
                "pas de chemin local pour ce fichier."
            )

        return path

    # ------------------------------------------------------------------
    # Résolution des fichiers
    # ------------------------------------------------------------------

    @classmethod
    def get_file_path(
        cls,
        file_or_path,
    ) -> Optional[Path]:
        """
        Résout un champ FileField Django ou un chemin local en Path.
        """
        if not file_or_path:
            return None

        if hasattr(file_or_path, "name"):
            name = getattr(
                file_or_path,
                "name",
                None,
            )

            if not name:
                return None

            try:
                path = Path(
                    file_or_path.path
                )

                return path.resolve()

            except (
                AttributeError,
                NotImplementedError,
                ValueError,
            ):
                try:
                    return cls.storage_path(name)

                except (
                    RuntimeError,
                    ValueError,
                ):
                    return None

        try:
            return Path(
                file_or_path
            ).resolve()

        except (
            TypeError,
            ValueError,
        ):
            return None

    @classmethod
    def file_exists(
        cls,
        file_or_path,
    ) -> bool:
        """
        Vérifie l'existence d'un fichier.
        """
        path = cls.get_file_path(
            file_or_path
        )

        if path is not None:
            return path.is_file()

        return False

    @classmethod
    def get_file_size(
        cls,
        file_or_path,
    ) -> int:
        """
        Retourne la taille du fichier en octets.
        """
        path = cls.get_file_path(
            file_or_path
        )

        if path is None or not path.is_file():
            return 0

        try:
            return path.stat().st_size

        except OSError:
            return 0

    @classmethod
    def get_file_size_mb(
        cls,
        file_or_path,
    ) -> float:
        """
        Retourne la taille du fichier en MiB.
        """
        return cls.get_file_size(
            file_or_path
        ) / (1024 * 1024)

    # ------------------------------------------------------------------
    # Copie / déplacement
    # ------------------------------------------------------------------

    @classmethod
    def copy_file(
        cls,
        source,
        destination,
        overwrite: bool = False,
    ) -> Path:
        """
        Copie un fichier local.
        """
        source_path = cls.get_file_path(
            source
        )

        destination_path = Path(
            destination
        ).resolve()

        if (
            source_path is None
            or not source_path.is_file()
        ):
            raise FileNotFoundError(
                f"Fichier source introuvable : {source}"
            )

        destination_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        if (
            destination_path.exists()
            and not overwrite
        ):
            raise FileExistsError(
                "Le fichier destination existe déjà : "
                f"{destination_path}"
            )

        shutil.copy2(
            source_path,
            destination_path,
        )

        return destination_path

    @classmethod
    def move_file(
        cls,
        source,
        destination,
        overwrite: bool = False,
    ) -> Path:
        """
        Déplace un fichier local.
        """
        source_path = cls.get_file_path(
            source
        )

        if (
            source_path is None
            or not source_path.is_file()
        ):
            raise FileNotFoundError(
                f"Fichier source introuvable : {source}"
            )

        destination_path = Path(
            destination
        ).resolve()

        destination_path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        if destination_path.exists():
            if not overwrite:
                raise FileExistsError(
                    "Le fichier destination existe déjà : "
                    f"{destination_path}"
                )

            destination_path.unlink()

        shutil.move(
            str(source_path),
            str(destination_path),
        )

        return destination_path

    # ------------------------------------------------------------------
    # Suppression
    # ------------------------------------------------------------------

    @classmethod
    def delete_file(
        cls,
        file_or_path,
        missing_ok: bool = True,
    ) -> bool:
        """
        Supprime un fichier local ou un FileField Django.
        """
        if not file_or_path:
            return False

        if hasattr(file_or_path, "delete") and hasattr(
            file_or_path,
            "name",
        ):
            try:
                if getattr(
                    file_or_path,
                    "name",
                    None,
                ):
                    file_or_path.delete(
                        save=False
                    )

                    return True

            except Exception:
                logger.exception(
                    "Erreur lors de la suppression "
                    "du fichier Storage."
                )

                if not missing_ok:
                    raise

                return False

        path = cls.get_file_path(
            file_or_path
        )

        if path is None:
            if missing_ok:
                return False

            raise FileNotFoundError(
                f"Fichier introuvable : {file_or_path}"
            )

        try:
            path.unlink()

            return True

        except FileNotFoundError:
            if missing_ok:
                return False

            raise

        except OSError:
            logger.exception(
                "Impossible de supprimer le fichier : %s",
                path,
            )

            if not missing_ok:
                raise

            return False

    @classmethod
    def delete_directory(
        cls,
        directory,
        missing_ok: bool = True,
    ) -> bool:
        """
        Supprime récursivement un répertoire avec protections.
        """
        if not directory:
            return False

        directory_path = Path(
            directory
        ).resolve()

        if not directory_path.exists():
            if missing_ok:
                return False

            raise FileNotFoundError(
                f"Répertoire introuvable : {directory_path}"
            )

        if not directory_path.is_dir():
            raise NotADirectoryError(
                "Ce chemin n'est pas un répertoire : "
                f"{directory_path}"
            )

        media_root = cls.get_media_root()
        base_directory = cls.get_base_directory()

        if directory_path == media_root:
            raise ValueError(
                "Suppression de MEDIA_ROOT interdite."
            )

        if directory_path == base_directory:
            raise ValueError(
                "Suppression du répertoire racine "
                "Word → LaTeX interdite."
            )

        try:
            directory_path.relative_to(
                media_root
            )

        except ValueError as exc:
            raise ValueError(
                "Suppression refusée : le répertoire "
                "est hors de MEDIA_ROOT."
            ) from exc

        shutil.rmtree(
            directory_path
        )

        return True

    @classmethod
    def cleanup_conversion(
        cls,
        conversion_id: Union[str, uuid.UUID],
    ) -> bool:
        """
        Supprime les fichiers temporaires/générés
        présents dans le répertoire de conversion.
        """
        conversion_directory = (
            cls.get_conversion_directory(
                conversion_id
            )
        )

        if not conversion_directory.exists():
            return False

        return cls.delete_directory(
            conversion_directory,
            missing_ok=True,
        )

    @classmethod
    def cleanup_latex_directory(
        cls,
        conversion_id: Union[str, uuid.UUID],
    ) -> bool:
        """
        Supprime uniquement le répertoire LaTeX d'une conversion.
        """
        latex_directory = (
            cls.get_latex_directory(
                conversion_id
            )
        )

        if not latex_directory.exists():
            return False

        return cls.delete_directory(
            latex_directory,
            missing_ok=True,
        )

    @classmethod
    def delete_conversion_files(
        cls,
        conversion: WordToLatexConversion,
    ) -> bool:
        """
        Supprime les fichiers associés à une conversion.

        Cette méthode sert de compatibilité avec les appels éventuels
        existants dans views.py.
        """
        if conversion is None:
            return False

        deleted = False

        file_fields = (
            "original_file",
            "latex_file",
            "zip_file",
            "pdf_file",
        )

        for field_name in file_fields:
            field = getattr(
                conversion,
                field_name,
                None,
            )

            if not field:
                continue

            try:
                if getattr(
                    field,
                    "name",
                    None,
                ):
                    field.delete(
                        save=False
                    )

                    deleted = True

            except Exception:
                logger.exception(
                    "Impossible de supprimer le champ fichier "
                    "'%s' de la conversion %s.",
                    field_name,
                    conversion.id,
                )

        try:
            conversion_directory = (
                cls.get_conversion_directory(
                    conversion.id
                )
            )

            if conversion_directory.exists():
                cls.delete_directory(
                    conversion_directory,
                    missing_ok=True,
                )

                deleted = True

        except Exception:
            logger.exception(
                "Impossible de supprimer le répertoire "
                "de conversion %s.",
                conversion.id,
            )

        return deleted

    # ------------------------------------------------------------------
    # Listing / statistiques
    # ------------------------------------------------------------------

    @classmethod
    def list_files(
        cls,
        directory,
        recursive: bool = False,
    ) -> list[Path]:
        """
        Liste les fichiers présents dans un répertoire.
        """
        directory_path = Path(
            directory
        ).resolve()

        if not directory_path.exists():
            return []

        if not directory_path.is_dir():
            raise NotADirectoryError(
                "Ce chemin n'est pas un répertoire : "
                f"{directory_path}"
            )

        iterator = (
            directory_path.rglob("*")
            if recursive
            else directory_path.glob("*")
        )

        return sorted(
            [
                path.resolve()
                for path in iterator
                if path.is_file()
            ],
            key=lambda path: str(path).lower(),
        )

    @classmethod
    def get_directory_size(
        cls,
        directory,
    ) -> int:
        """
        Calcule la taille totale d'un répertoire en octets.
        """
        directory_path = Path(
            directory
        ).resolve()

        if not directory_path.exists():
            return 0

        if not directory_path.is_dir():
            raise NotADirectoryError(
                "Ce chemin n'est pas un répertoire : "
                f"{directory_path}"
            )

        total = 0

        for path in directory_path.rglob("*"):
            if not path.is_file():
                continue

            try:
                total += path.stat().st_size

            except OSError:
                logger.warning(
                    "Impossible de lire la taille de : %s",
                    path,
                )

        return total

    @classmethod
    def get_directory_statistics(
        cls,
        directory,
    ) -> dict:
        """
        Retourne des statistiques sur un répertoire.
        """
        files = cls.list_files(
            directory,
            recursive=True,
        )

        total_size = 0
        extensions: dict[str, int] = {}

        for path in files:
            try:
                total_size += path.stat().st_size

            except OSError:
                continue

            extension = (
                path.suffix.lower()
                or "[sans_extension]"
            )

            extensions[extension] = (
                extensions.get(extension, 0) + 1
            )

        return {
            "files_count": len(files),
            "size_bytes": total_size,
            "size_mb": round(
                total_size / (1024 * 1024),
                4,
            ),
            "extensions": extensions,
        }

    # ------------------------------------------------------------------
    # Fichiers texte
    # ------------------------------------------------------------------

    @classmethod
    def ensure_file_directory(
        cls,
        file_path,
    ) -> Path:
        """
        Crée le parent d'un fichier et retourne son chemin absolu.
        """
        path = Path(
            file_path
        ).resolve()

        path.parent.mkdir(
            parents=True,
            exist_ok=True,
        )

        return path

    @classmethod
    def write_text(
        cls,
        file_path,
        content: str,
        encoding: str = "utf-8",
    ) -> Path:
        """
        Écrit un fichier texte de manière atomique.
        """
        path = cls.ensure_file_directory(
            file_path
        )

        temporary_path = path.with_name(
            f".{path.name}.{uuid.uuid4().hex}.tmp"
        )

        try:
            temporary_path.write_text(
                content or "",
                encoding=encoding,
            )

            temporary_path.replace(
                path
            )

        except Exception:
            try:
                temporary_path.unlink(
                    missing_ok=True
                )

            except OSError:
                pass

            raise

        return path

    @classmethod
    def read_text(
        cls,
        file_path,
        encoding: str = "utf-8",
    ) -> str:
        """
        Lit un fichier texte.
        """
        path = cls.get_file_path(
            file_path
        )

        if (
            path is None
            or not path.is_file()
        ):
            raise FileNotFoundError(
                f"Fichier introuvable : {file_path}"
            )

        return path.read_text(
            encoding=encoding
        )

    # ------------------------------------------------------------------
    # FileField
    # ------------------------------------------------------------------

    @classmethod
    def attach_file_to_model(
        cls,
        model_instance,
        field_name: str,
        file_path,
        save: bool = True,
    ):
        """
        Attache un fichier local à un FileField Django.
        """
        if model_instance is None:
            raise ValueError(
                "model_instance est obligatoire."
            )

        if not field_name:
            raise ValueError(
                "field_name est obligatoire."
            )

        path = cls.get_file_path(
            file_path
        )

        if (
            path is None
            or not path.is_file()
        ):
            raise FileNotFoundError(
                f"Fichier introuvable : {file_path}"
            )

        with path.open("rb") as handle:
            django_file = File(
                handle,
                name=path.name,
            )

            field = getattr(
                model_instance,
                field_name,
                None,
            )

            if field is None:
                raise AttributeError(
                    f"Le champ '{field_name}' n'existe pas "
                    f"sur {model_instance.__class__.__name__}."
                )

            field.save(
                path.name,
                django_file,
                save=save,
            )

        return getattr(
            model_instance,
            field_name,
        )

    # ------------------------------------------------------------------
    # Résolution des fichiers de conversion
    # ------------------------------------------------------------------

    @classmethod
    def resolve_conversion_file(
        cls,
        conversion_id: Union[str, uuid.UUID],
        filename: str,
        latex: bool = True,
    ) -> Path:
        """
        Retourne un chemin sécurisé dans le répertoire d'une conversion.
        """
        base_directory = (
            cls.get_latex_directory(
                conversion_id
            )
            if latex
            else cls.get_conversion_directory(
                conversion_id
            )
        ).resolve()

        safe_name = cls.safe_filename(
            filename,
            default_name="file",
        )

        target = (
            base_directory / safe_name
        ).resolve()

        try:
            target.relative_to(
                base_directory
            )

        except ValueError as exc:
            raise ValueError(
                "Chemin de fichier invalide."
            ) from exc

        return target

    @classmethod
    def get_export_path(
        cls,
        conversion_id: Union[str, uuid.UUID],
        filename: str,
    ) -> Path:
        """
        Retourne le chemin d'un fichier d'export LaTeX.
        """
        return cls.resolve_conversion_file(
            conversion_id,
            filename,
            latex=True,
        )

    @classmethod
    def get_original_document_path(
        cls,
        conversion,
    ) -> Optional[Path]:
        """
        Résout le fichier DOCX original d'une conversion.
        """
        if conversion is None:
            return None

        original_file = getattr(
            conversion,
            "original_file",
            None,
        )

        return cls.get_file_path(
            original_file
        )

    @classmethod
    def get_conversion_paths(
        cls,
        conversion_id: Union[str, uuid.UUID],
    ) -> dict[str, Path]:
        """
        Retourne les principaux chemins utilisés par la conversion.
        """
        directories = (
            cls.ensure_conversion_directories(
                conversion_id
            )
        )

        return {
            "conversion_directory": directories[
                "conversion"
            ],
            "latex_directory": directories[
                "latex"
            ],
            "images_directory": directories[
                "images"
            ],
            "tex_file": directories[
                "latex"
            ] / "document.tex",
            "bib_file": directories[
                "latex"
            ] / "references.bib",
            "zip_file": directories[
                "conversion"
            ] / "document.zip",
            "pdf_file": directories[
                "conversion"
            ] / "document.pdf",
        }

    # ------------------------------------------------------------------
    # Sécurité des chemins
    # ------------------------------------------------------------------

    @classmethod
    def is_inside_media_root(
        cls,
        file_or_directory,
    ) -> bool:
        """
        Vérifie qu'un chemin se trouve dans MEDIA_ROOT.
        """
        path = Path(
            file_or_directory
        ).resolve()

        media_root = cls.get_media_root()

        try:
            path.relative_to(
                media_root
            )

            return True

        except ValueError:
            return False

    # ------------------------------------------------------------------
    # Statistiques d'une conversion
    # ------------------------------------------------------------------

    @classmethod
    def get_statistics_for_conversion(
        cls,
        conversion_id: Union[str, uuid.UUID],
    ) -> dict:
        """
        Retourne les statistiques complètes
        du répertoire d'une conversion.
        """
        conversion_directory = (
            cls.get_conversion_directory(
                conversion_id
            )
        )

        if not conversion_directory.exists():
            return {
                "files_count": 0,
                "size_bytes": 0,
                "size_mb": 0.0,
                "extensions": {},
            }

        return cls.get_directory_statistics(
            conversion_directory
        )


# ---------------------------------------------------------------------------
# Alias de compatibilité
# ---------------------------------------------------------------------------

WordToLatexFileService = FileService