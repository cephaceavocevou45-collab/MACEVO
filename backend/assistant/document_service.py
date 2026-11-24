
"""
==========================================================
MACEVO IA
Document Service
==========================================================

Gestion des pièces jointes envoyées à MACEVO IA.

Formats actuellement pris en charge par le chat :

- PDF
- DOCX
- TXT
- JPG
- JPEG
- PNG

Le service fournit :

- validation des fichiers
- extraction de texte
- OCR des images
- détection de PDF scannés
- informations structurées sur les fichiers
- préparation pour une future analyse scientifique

Important :
ce service constitue une couche d'entrée.

L'architecture scientifique complète de MACEVO devra ensuite
passer par les importers et le Document IR afin de conserver
la structure du document (sections, tableaux, figures,
équations, références, etc.).
"""

from __future__ import annotations

import logging
import mimetypes
import os
import shutil
import subprocess
import tempfile
from pathlib import Path
from typing import Any

import fitz


logger = logging.getLogger(__name__)


class DocumentService:
    """
    Service central de traitement des documents envoyés à MACEVO IA.
    """

    # ======================================================
    # Configuration
    # ======================================================

    MAX_FILE_SIZE = 20 * 1024 * 1024  # 20 MB
    MAX_PDF_PAGES = 100
    PDF_OCR_MIN_TEXT_CHARACTERS = 40

    ALLOWED_EXTENSIONS = {
        ".pdf",
        ".docx",
        ".txt",
        ".jpg",
        ".jpeg",
        ".png",
    }

    ALLOWED_CONTENT_TYPES = {
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/jpeg",
        "image/png",
    }

    IMAGE_EXTENSIONS = {
        ".jpg",
        ".jpeg",
        ".png",
    }

    # ======================================================
    # TESSERACT
    # ======================================================

    # Chemin Windows configurable.
    #
    # IMPORTANT :
    # adapte cette valeur si Tesseract est installé ailleurs.
    TESSERACT_PATH = os.getenv(
        "TESSERACT_CMD",
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    )

    DEFAULT_OCR_LANGUAGES = ("fra", "eng")

    # ======================================================
    # Tesseract configuration
    # ======================================================

    @classmethod
    def configure_tesseract(cls) -> bool:
        """
        Configure explicitement Tesseract.

        Le chemin peut être remplacé dans un environnement
        de production ou de développement.
        """

        try:
            import pytesseract
        except ImportError as exc:
            raise ValueError(
                "Le traitement OCR nécessite pytesseract et Pillow."
            ) from exc

        configured_path = cls.TESSERACT_PATH
        discovered_path = (
            (shutil.which(configured_path) if configured_path else None)
            or shutil.which("tesseract")
        )
        tesseract_path = Path(discovered_path or configured_path)

        if not tesseract_path.exists():
            raise ValueError(
                "Tesseract OCR est introuvable à l'emplacement : "
                f"{cls.TESSERACT_PATH}"
            )

        if not tesseract_path.is_file():
            raise ValueError(
                "Le chemin configuré pour Tesseract n'est pas un fichier : "
                f"{cls.TESSERACT_PATH}"
            )

        pytesseract.pytesseract.tesseract_cmd = str(
            tesseract_path
        )

        return True

    @classmethod
    def get_ocr_languages(cls) -> list[str]:
        """
        Retourne les langues OCR installées.

        Cette méthode ne configure pas automatiquement Tesseract.
        """

        cls.configure_tesseract()

        import pytesseract

        try:
            languages = pytesseract.get_languages(
                config=""
            )
        except Exception as exc:
            logger.exception(
                "Impossible de récupérer les langues Tesseract."
            )
            raise ValueError(
                "Impossible de déterminer les langues OCR disponibles."
            ) from exc

        return sorted(
            language
            for language in languages
            if language != "osd"
        )

    @classmethod
    def resolve_ocr_language(
        cls,
        preferred_languages: str | None = None,
    ) -> str:
        """
        Détermine automatiquement la langue OCR.

        Priorité par défaut :
        1. fra + eng
        2. fra
        3. eng

        ``preferred_languages`` permet de demander explicitement
        une combinaison comme ``fra+eng``.
        """

        languages = cls.get_ocr_languages()

        if preferred_languages:
            requested = [
                language.strip()
                for language in preferred_languages.split("+")
                if language.strip()
            ]

            missing = [
                language
                for language in requested
                if language not in languages
            ]

            if missing:
                raise ValueError(
                    "Les langues OCR suivantes ne sont pas installées : "
                    + ", ".join(missing)
                )

            return "+".join(requested)

        if "fra" in languages and "eng" in languages:
            return "fra+eng"

        if "fra" in languages:
            return "fra"

        if "eng" in languages:
            return "eng"

        raise ValueError(
            "Aucune langue OCR utilisable n'est installée dans Tesseract. "
            "Installez au minimum 'fra' ou 'eng'."
        )

    # ======================================================
    # Validation
    # ======================================================

    @classmethod
    def validate_file(cls, uploaded_file) -> bool:
        """
        Vérifie qu'un fichier peut être traité.

        La validation combine :

        - présence du fichier
        - taille
        - extension
        - type MIME lorsqu'il est fourni
        """

        if uploaded_file is None:
            raise ValueError(
                "Aucun fichier n'a été fourni."
            )

        filename = str(
            getattr(uploaded_file, "name", "")
            or ""
        ).strip()

        if not filename:
            raise ValueError(
                "Le fichier fourni ne possède pas de nom."
            )

        # --------------------------------------------------
        # Taille
        # --------------------------------------------------

        size = getattr(
            uploaded_file,
            "size",
            None,
        )

        if size is None:
            raise ValueError(
                "Impossible de déterminer la taille du fichier."
            )

        try:
            size = int(size)
        except (TypeError, ValueError):
            raise ValueError(
                "La taille du fichier est invalide."
            )

        if size < 0:
            raise ValueError(
                "La taille du fichier est invalide."
            )

        if size > cls.MAX_FILE_SIZE:
            raise ValueError(
                "Le fichier est trop volumineux. "
                "La taille maximale autorisée est de 20 MB."
            )

        # --------------------------------------------------
        # Extension
        # --------------------------------------------------

        extension = Path(
            filename
        ).suffix.lower()

        if extension not in cls.ALLOWED_EXTENSIONS:
            raise ValueError(
                "Format de fichier non supporté. "
                "Formats acceptés : PDF, DOCX, TXT, JPG, JPEG et PNG."
            )

        # --------------------------------------------------
        # MIME
        # --------------------------------------------------

        content_type = (
            getattr(
                uploaded_file,
                "content_type",
                None,
            )
            or ""
        ).strip().lower()

        # Certains clients peuvent ne pas fournir le MIME.
        # Dans ce cas l'extension reste le contrôle principal.
        if (
            content_type
            and content_type not in cls.ALLOWED_CONTENT_TYPES
        ):
            guessed_type, _ = mimetypes.guess_type(filename)

            if (
                guessed_type is None
                or guessed_type != content_type
            ):
                raise ValueError(
                    "Le type MIME du fichier n'est pas autorisé."
                )

        return True

    # ======================================================
    # Utilitaires fichiers
    # ======================================================

    @staticmethod
    def _reset_file(uploaded_file) -> None:
        """
        Replace le curseur du fichier au début lorsque possible.
        """

        try:
            uploaded_file.seek(0)
        except (AttributeError, OSError):
            pass

    @staticmethod
    def _read_file_bytes(uploaded_file) -> bytes:
        """
        Lit le fichier en mémoire et replace ensuite le curseur.
        """

        DocumentService._reset_file(uploaded_file)

        try:
            data = uploaded_file.read()
        except Exception as exc:
            raise ValueError(
                "Impossible de lire le fichier."
            ) from exc

        if not isinstance(data, bytes):
            raise ValueError(
                "Le contenu du fichier est invalide."
            )

        DocumentService._reset_file(uploaded_file)

        return data

    # ======================================================
    # Extraction principale
    # ======================================================

    @classmethod
    def extract_text(cls, uploaded_file) -> str:
        """
        Extrait le texte d'un fichier.

        Cette méthode reste compatible avec l'appel actuel :

            DocumentService.extract_text(file)

        Elle retourne une chaîne de caractères afin de préserver
        le contrat actuel de AssistantService.
        """

        cls.validate_file(uploaded_file)

        filename = str(
            getattr(uploaded_file, "name", "")
            or ""
        )

        extension = Path(
            filename
        ).suffix.lower()

        if extension == ".pdf":
            return cls.extract_pdf(uploaded_file)

        if extension == ".docx":
            return cls.extract_docx(uploaded_file)

        if extension == ".txt":
            return cls.extract_txt(uploaded_file)

        if extension in cls.IMAGE_EXTENSIONS:
            return cls.extract_image(uploaded_file)

        raise ValueError(
            "Impossible de déterminer le type du document."
        )

    # ======================================================
    # Extraction PDF
    # ======================================================

    @classmethod
    def extract_pdf(cls, uploaded_file) -> str:
        """
        Extrait le texte d'un PDF avec PyMuPDF.

        Les pages sont séparées afin de préserver une information
        minimale sur la pagination.

        Si le PDF ne contient pas de couche texte, une erreur
        explicite est retournée et indique qu'un OCR est nécessaire.
        """

        file_bytes = cls._read_file_bytes(
            uploaded_file
        )

        document = None

        try:
            document = fitz.open(
                stream=file_bytes,
                filetype="pdf",
            )

            if document.page_count == 0:
                raise ValueError(
                    "Le PDF ne contient aucune page."
                )

            if document.page_count > cls.MAX_PDF_PAGES:
                raise ValueError(
                    f"Ce PDF contient {document.page_count} pages. "
                    f"La limite d'analyse actuelle est de {cls.MAX_PDF_PAGES} pages. "
                    "Divisez le document en plusieurs fichiers."
                )

            pages = []
            ocr_pages = 0

            for page_number, page in enumerate(
                document,
                start=1,
            ):
                text = page.get_text("text").strip()

                # Un même PDF peut mêler des pages texte et des pages scannées.
                if (
                    len(text) < cls.PDF_OCR_MIN_TEXT_CHARACTERS
                    and page.get_images(full=True)
                ):
                    pixmap = page.get_pixmap(dpi=200, alpha=False)
                    try:
                        text = cls._extract_image_with_tesseract_cli(
                            pixmap.tobytes("png"),
                            f"page-{page_number}.png",
                        ).strip()
                    except ValueError as exc:
                        if "Aucun texte n'a été détecté" not in str(exc):
                            raise
                        text = ""
                    ocr_pages += 1

                if text:
                    pages.append(
                        f"\n--- PAGE {page_number} ---\n"
                        f"{text}"
                    )

            result = "\n".join(
                pages
            ).strip()

            if not result:
                raise ValueError(
                    "Aucun texte exploitable n'a été trouvé dans ce PDF. "
                    "Il peut s'agir d'un document scanné nécessitant un OCR."
                )

            logger.info(
                "PDF extrait : pages=%s pages_ocr=%s caractères=%s",
                document.page_count,
                ocr_pages,
                len(result),
            )
            return result

        except ValueError:
            raise

        except Exception as exc:
            logger.exception(
                "Erreur lors de l'extraction du PDF."
            )

            raise ValueError(
                "Impossible de lire le fichier PDF."
            ) from exc

        finally:
            if document is not None:
                try:
                    document.close()
                except Exception:
                    pass

    # ======================================================
    # Détection PDF scanné
    # ======================================================

    @classmethod
    def pdf_requires_ocr(cls, uploaded_file) -> bool:
        """
        Indique si un PDF semble être dépourvu de couche texte.

        Cette méthode ne réalise pas encore l'OCR du PDF.
        Elle permet au pipeline scientifique futur de décider
        s'il doit lancer une étape OCR.
        """

        file_bytes = cls._read_file_bytes(
            uploaded_file
        )

        document = None

        try:
            document = fitz.open(
                stream=file_bytes,
                filetype="pdf",
            )

            if document.page_count == 0:
                return False

            return any(
                len(page.get_text("text").strip())
                < cls.PDF_OCR_MIN_TEXT_CHARACTERS
                and bool(page.get_images(full=True))
                for page in document
            )

        except Exception as exc:
            logger.exception(
                "Impossible de déterminer si le PDF nécessite un OCR."
            )

            raise ValueError(
                "Impossible d'analyser la structure du PDF."
            ) from exc

        finally:
            if document is not None:
                try:
                    document.close()
                except Exception:
                    pass

    # ======================================================
    # Extraction DOCX
    # ======================================================

    @classmethod
    def _extract_docx_xml(cls, uploaded_file) -> str:
        """Extracts DOCX text with Python's standard XML/ZIP libraries.

        This keeps ordinary text import available if the optional
        python-docx/lxml wheels are unavailable in the runtime.
        """
        from io import BytesIO
        from xml.etree import ElementTree
        from zipfile import ZipFile

        namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
        raw = cls._read_file_bytes(uploaded_file)

        with ZipFile(BytesIO(raw)) as package:
            document_xml = package.read("word/document.xml")

        root = ElementTree.fromstring(document_xml)
        body = root.find(f"{namespace}body")
        if body is None:
            return ""

        blocks = []
        table_index = 0

        def paragraph_text(paragraph):
            parts = []
            for node in paragraph.iter():
                if node.tag == f"{namespace}t":
                    parts.append(node.text or "")
                elif node.tag == f"{namespace}tab":
                    parts.append("\t")
                elif node.tag == f"{namespace}br":
                    parts.append("\n")
            return "".join(parts).strip()

        for block in body:
            if block.tag == f"{namespace}p":
                text = paragraph_text(block)
                if text:
                    blocks.append(text)
                continue

            if block.tag != f"{namespace}tbl":
                continue

            rows = []
            for row in block.findall(f"{namespace}tr"):
                cells = []
                for cell in row.findall(f"{namespace}tc"):
                    text = " ".join(
                        value
                        for value in (
                            paragraph_text(paragraph)
                            for paragraph in cell.findall(f"{namespace}p")
                        )
                        if value
                    )
                    cells.append(text)
                if any(cells):
                    rows.append(" | ".join(cells))

            if rows:
                table_index += 1
                blocks.append(f"--- TABLEAU {table_index} ---")
                blocks.extend(rows)

        return "\n".join(blocks).strip()

    @classmethod
    def extract_docx(cls, uploaded_file) -> str:
        """
        Extrait le texte d'un document Word.

        Les paragraphes et tableaux sont conservés dans l'ordre
        de lecture principal disponible via python-docx.
        """

        cls._reset_file(uploaded_file)

        try:
            try:
                from docx import Document
            except (ImportError, OSError):
                logger.warning(
                    "python-docx/lxml indisponible ; utilisation de "
                    "l'extracteur DOCX standard."
                )
                result = cls._extract_docx_xml(uploaded_file)
                if not result:
                    raise ValueError(
                        "Aucun texte exploitable n'a été trouvé "
                        "dans ce document Word."
                    )
                return result

            document = Document(
                uploaded_file
            )

            blocks = []

            # ------------------------------------------------
            # Paragraphes
            # ------------------------------------------------

            for paragraph in document.paragraphs:
                text = paragraph.text.strip()

                if text:
                    blocks.append(text)

            # ------------------------------------------------
            # Tableaux
            # ------------------------------------------------

            for table_index, table in enumerate(
                document.tables,
                start=1,
            ):
                rows = []

                for row in table.rows:
                    cells = []

                    for cell in row.cells:
                        text = cell.text.strip()

                        cells.append(
                            text
                        )

                    if any(cells):
                        rows.append(
                            " | ".join(cells)
                        )

                if rows:
                    blocks.append(
                        f"--- TABLEAU {table_index} ---"
                    )
                    blocks.extend(rows)

            result = "\n".join(
                blocks
            ).strip()

            if not result:
                raise ValueError(
                    "Aucun texte exploitable n'a été trouvé "
                    "dans ce document Word."
                )

            return result

        except ValueError:
            raise

        except Exception as exc:
            logger.exception(
                "Erreur lors de l'extraction DOCX."
            )

            raise ValueError(
                "Impossible de lire le document Word."
            ) from exc

        finally:
            cls._reset_file(uploaded_file)

    # ======================================================
    # Extraction TXT
    # ======================================================

    @classmethod
    def extract_txt(cls, uploaded_file) -> str:
        """
        Extrait le contenu d'un fichier texte.

        UTF-8 est privilégié, avec fallback latin-1 pour les
        fichiers plus anciens.
        """

        try:
            raw = cls._read_file_bytes(
                uploaded_file
            )

            try:
                text = raw.decode(
                    "utf-8"
                )
            except UnicodeDecodeError:
                text = raw.decode(
                    "latin-1"
                )

            text = text.strip()

            if not text:
                raise ValueError(
                    "Le fichier texte est vide."
                )

            return text

        except ValueError:
            raise

        except Exception as exc:
            logger.exception(
                "Erreur lors de l'extraction TXT."
            )

            raise ValueError(
                "Impossible de lire le fichier texte."
            ) from exc

    # ======================================================
    # Extraction image / OCR
    # ======================================================

    @classmethod
    def _extract_image_with_tesseract_cli(
        cls,
        raw: bytes,
        filename: str,
        language: str | None = None,
    ) -> str:
        """Exécute Tesseract directement quand Pillow est indisponible."""
        configured_path = cls.TESSERACT_PATH
        discovered_path = (
            (shutil.which(configured_path) if configured_path else None)
            or shutil.which("tesseract")
        )
        if not discovered_path and not Path(configured_path).is_file():
            raise ValueError("Tesseract OCR est introuvable.")
        executable = Path(discovered_path or configured_path)

        try:
            languages_result = subprocess.run(
                [str(executable), "--list-langs"],
                capture_output=True,
                text=True,
                check=True,
                timeout=15,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            raise ValueError("Impossible de démarrer Tesseract OCR.") from exc

        available = {
            line.strip()
            for line in languages_result.stdout.splitlines()
            if line.strip() and not line.lower().startswith("list of available")
        }
        available.discard("osd")
        if language:
            requested = [part.strip() for part in language.split("+") if part.strip()]
            missing = [part for part in requested if part not in available]
            if missing:
                raise ValueError(
                    "Les langues OCR suivantes ne sont pas installées : "
                    + ", ".join(missing)
                )
            selected_language = "+".join(requested)
        elif "fra" in available and "eng" in available:
            selected_language = "fra+eng"
        elif "fra" in available:
            selected_language = "fra"
        elif "eng" in available:
            selected_language = "eng"
        else:
            raise ValueError(
                "Aucune langue OCR utilisable n'est installée dans Tesseract."
            )

        suffix = Path(filename).suffix.lower()
        if suffix not in {".png", ".jpg", ".jpeg"}:
            suffix = ".png"
        temporary_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as image_file:
                image_file.write(raw)
                temporary_path = image_file.name

            result = subprocess.run(
                [str(executable), temporary_path, "stdout", "-l", selected_language],
                capture_output=True,
                text=True,
                check=True,
                timeout=90,
            )
        except (OSError, subprocess.SubprocessError) as exc:
            raise ValueError("Impossible d'analyser l'image avec Tesseract OCR.") from exc
        finally:
            if temporary_path:
                Path(temporary_path).unlink(missing_ok=True)

        text = result.stdout.strip()
        if not text:
            raise ValueError("Aucun texte n'a été détecté dans l'image.")
        return text

    @classmethod
    def extract_image(
        cls,
        uploaded_file,
        language: str | None = None,
    ) -> str:
        """
        Extrait le texte d'une image avec Tesseract OCR.

        La langue est automatiquement choisie entre fra et eng
        lorsqu'elle n'est pas fournie.
        """

        try:
            raw = cls._read_file_bytes(
                uploaded_file
            )

            try:
                import pytesseract
                from PIL import Image, UnidentifiedImageError
            except ImportError:
                return cls._extract_image_with_tesseract_cli(
                    raw,
                    str(getattr(uploaded_file, "name", "image.png")),
                    language,
                )

            cls.configure_tesseract()

            ocr_language = cls.resolve_ocr_language(
                preferred_languages=language
            )

            try:
                image = Image.open(
                    __import__("io").BytesIO(raw)
                )
            except UnidentifiedImageError as exc:
                raise ValueError(
                    "Le fichier image ne peut pas être lu."
                ) from exc

            image = image.convert(
                "RGB"
            )

            logger.info(
                "OCR lancé : fichier=%s taille=%s langue=%s",
                getattr(uploaded_file, "name", ""),
                getattr(uploaded_file, "size", 0),
                ocr_language,
            )

            text = pytesseract.image_to_string(
                image,
                lang=ocr_language,
            ).strip()

            try:
                image.close()
            except Exception:
                pass

            if not text:
                raise ValueError(
                    "Aucun texte n'a été détecté dans l'image."
                )

            logger.info(
                "OCR terminé : caractères=%s",
                len(text),
            )

            return text

        except ValueError:
            raise

        except Exception as exc:
            logger.exception(
                "Erreur Tesseract OCR."
            )

            raise ValueError(
                "Impossible d'analyser l'image avec Tesseract OCR."
            ) from exc

    # ======================================================
    # Informations fichier
    # ======================================================

    @classmethod
    def get_file_info(cls, uploaded_file) -> dict[str, Any]:
        """
        Retourne les informations utiles du fichier.

        Cette méthode ne lance pas l'extraction.
        """

        if uploaded_file is None:
            raise ValueError(
                "Aucun fichier n'a été fourni."
            )

        filename = str(
            getattr(uploaded_file, "name", "")
            or ""
        )

        extension = Path(
            filename
        ).suffix.lower()

        content_type = (
            getattr(
                uploaded_file,
                "content_type",
                None,
            )
            or ""
        ).strip().lower()

        return {
            "name": filename,
            "size": getattr(
                uploaded_file,
                "size",
                0,
            ),
            "content_type": content_type,
            "extension": extension,
            "is_pdf": extension == ".pdf",
            "is_docx": extension == ".docx",
            "is_text": extension == ".txt",
            "is_image": extension in cls.IMAGE_EXTENSIONS,
            "supported": extension in cls.ALLOWED_EXTENSIONS,
        }

    # ======================================================
    # Analyse de base
    # ======================================================

    @classmethod
    def analyze_file(cls, uploaded_file) -> dict[str, Any]:
        """
        Analyse de base d'un fichier avant son passage au moteur IA.

        Cette méthode prépare une structure exploitable par la future
        chaîne :

            fichier
              ↓
            import
              ↓
            analyse
              ↓
            Document IR
              ↓
            IA scientifique
        """

        cls.validate_file(
            uploaded_file
        )

        info = cls.get_file_info(
            uploaded_file
        )

        extension = info["extension"]

        result = {
            **info,
            "requires_ocr": False,
            "text": None,
            "text_length": 0,
            "status": "validated",
        }

        if extension == ".pdf":
            result["requires_ocr"] = cls.pdf_requires_ocr(
                uploaded_file
            )

        result["text"] = cls.extract_text(
            uploaded_file
        )

        result["text_length"] = len(
            result["text"]
        )

        result["status"] = "extracted"

        return result

    # ======================================================
    # Informations service
    # ======================================================

    @classmethod
    def info(cls) -> dict[str, Any]:
        """
        Retourne les capacités du service.
        """

        return {
            "service": "DocumentService",
            "max_file_size": cls.MAX_FILE_SIZE,
            "max_file_size_mb": cls.MAX_FILE_SIZE / (
                1024 * 1024
            ),
            "allowed_extensions": sorted(
                cls.ALLOWED_EXTENSIONS
            ),
            "ocr": {
                "enabled": True,
                "engine": "tesseract",
                "languages": list(
                    cls.DEFAULT_OCR_LANGUAGES
                ),
            },
        }
