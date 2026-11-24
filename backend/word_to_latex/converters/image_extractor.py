from __future__ import annotations

import io
import posixpath
import re
import zipfile
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from xml.etree import ElementTree as ET

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    Image = None


@dataclass
class ExtractedImage:
    """
    Metadata for an image extracted from a DOCX document.
    """

    relationship_id: str
    source_path: str
    output_path: str
    filename: str
    extension: str
    content_type: Optional[str] = None
    width_emu: Optional[int] = None
    height_emu: Optional[int] = None
    alt_text: Optional[str] = None

    @property
    def latex_path(self) -> str:
        """
        Path suitable for LaTeX \\includegraphics.
        """
        return self.output_path.replace("\\", "/")


class ImageExtractor:
    """
    Extract images referenced by a DOCX document and prepare valid
    LaTeX references.

    The extractor works directly on the DOCX ZIP package and resolves
    relationships from word/document.xml.rels.

    Supported directly by pdflatex:
        PNG, JPG, JPEG, PDF

    Other formats such as SVG, EMF and WMF are extracted but are not
    automatically referenced as graphics because standard pdflatex
    cannot reliably process them.
    """

    WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
    DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main"
    PICTURE_NS = "http://schemas.openxmlformats.org/drawingml/2006/picture"
    REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"
    PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
    VML_NS = "urn:schemas-microsoft-com:vml"

    IMAGE_REL_TYPE = (
        "http://schemas.openxmlformats.org/officeDocument/2006/relationships/image"
    )

    SAFE_LATEX_EXTENSIONS = {".png", ".jpg", ".jpeg", ".pdf"}

    EXTRACTABLE_EXTENSIONS = {
        ".png",
        ".jpg",
        ".jpeg",
        ".gif",
        ".bmp",
        ".tif",
        ".tiff",
        ".webp",
        ".pdf",
        ".svg",
        ".emf",
        ".wmf",
    }

    def __init__(
        self,
        document_path: str | Path,
        output_directory: str | Path,
        optimize_images: bool = False,
    ):
        self.document_path = Path(document_path)
        self.output_directory = Path(output_directory)
        self.optimize_images = bool(optimize_images)

        self.images_directory = self.output_directory / "images"

        self._relationships: Dict[str, str] = {}
        self._content_types: Dict[str, str] = {}
        self._image_cache: Dict[str, ExtractedImage] = {}

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def extract_images(self) -> List[ExtractedImage]:
        """
        Extract all image relationships actually referenced by
        document.xml.

        Returns:
            List[ExtractedImage]
        """
        self._validate_document()

        self.images_directory.mkdir(parents=True, exist_ok=True)

        with zipfile.ZipFile(self.document_path, "r") as archive:
            self._load_content_types(archive)
            self._load_relationships(archive)

            document_xml = self._read_xml(
                archive,
                "word/document.xml",
            )

            if document_xml is None:
                return []

            relationship_ids = self._find_image_relationship_ids(document_xml)

            extracted: List[ExtractedImage] = []

            for relationship_id in relationship_ids:
                if relationship_id in self._image_cache:
                    extracted.append(self._image_cache[relationship_id])
                    continue

                result = self._extract_relationship_image(
                    archive,
                    relationship_id,
                )

                if result is not None:
                    self._image_cache[relationship_id] = result
                    extracted.append(result)

            return extracted

    def extract(self) -> List[ExtractedImage]:
        """
        Alias for extract_images().
        """
        return self.extract_images()

    def get_images(self) -> List[ExtractedImage]:
        """
        Return already extracted images.

        If extraction has not yet happened, perform it.
        """
        if not self._image_cache:
            return self.extract_images()

        return list(self._image_cache.values())

    def build_latex_reference(
        self,
        image: ExtractedImage,
        width: str = r"\textwidth",
        caption: Optional[str] = None,
        label: Optional[str] = None,
        placement: str = "htbp",
        centered: bool = True,
    ) -> str:
        """
        Build a valid LaTeX figure block.

        For unsupported formats, a comment is returned instead of
        generating invalid LaTeX.
        """
        latex_path = self._latex_graphics_path(image)

        if latex_path is None:
            return (
                "% Image extracted from DOCX but not directly supported "
                f"by pdflatex: {image.filename}"
            )

        lines = [
            rf"\begin{{figure}}[{self._sanitize_placement(placement)}]",
        ]

        if centered:
            lines.append(r"\centering")

        lines.append(
            rf"\includegraphics[width={width}]{{{latex_path}}}"
        )

        if caption:
            lines.append(
                rf"\caption{{{self._escape_latex(caption)}}}"
            )

        if label:
            safe_label = self._sanitize_label(label)
            if safe_label:
                lines.append(
                    rf"\label{{{safe_label}}}"
                )

        lines.append(r"\end{figure}")

        return "\n".join(lines)

    def build_inline_latex_reference(
        self,
        image: ExtractedImage,
        width: str = r"\linewidth",
    ) -> str:
        """
        Build an inline \\includegraphics command.
        """
        latex_path = self._latex_graphics_path(image)

        if latex_path is None:
            return (
                "% Unsupported image format: "
                f"{self._escape_latex(image.filename)}"
            )

        return rf"\includegraphics[width={width}]{{{latex_path}}}"

    def get_supported_images(
        self,
        images: Optional[List[ExtractedImage]] = None,
    ) -> List[ExtractedImage]:
        """
        Return images that can be passed directly to pdflatex.
        """
        images = images if images is not None else self.get_images()

        return [
            image
            for image in images
            if image.extension.lower() in self.SAFE_LATEX_EXTENSIONS
        ]

    def get_unsupported_images(
        self,
        images: Optional[List[ExtractedImage]] = None,
    ) -> List[ExtractedImage]:
        """
        Return extracted images requiring conversion before direct
        inclusion with pdflatex.
        """
        images = images if images is not None else self.get_images()

        return [
            image
            for image in images
            if image.extension.lower() not in self.SAFE_LATEX_EXTENSIONS
        ]

    def clear_cache(self) -> None:
        """
        Clear extraction metadata cache.
        """
        self._image_cache.clear()
        self._relationships.clear()
        self._content_types.clear()

    # ------------------------------------------------------------------
    # DOCX parsing
    # ------------------------------------------------------------------

    def _validate_document(self) -> None:
        if not self.document_path.exists():
            raise FileNotFoundError(
                f"DOCX file not found: {self.document_path}"
            )

        if not self.document_path.is_file():
            raise ValueError(
                f"Document path is not a file: {self.document_path}"
            )

        if self.document_path.stat().st_size == 0:
            raise ValueError("The DOCX file is empty.")

        if self.document_path.suffix.lower() != ".docx":
            raise ValueError(
                "ImageExtractor only accepts .docx documents."
            )

        try:
            with zipfile.ZipFile(self.document_path, "r") as archive:
                if "word/document.xml" not in archive.namelist():
                    raise ValueError(
                        "Invalid DOCX package: word/document.xml is missing."
                    )
        except zipfile.BadZipFile as exc:
            raise ValueError(
                "The supplied file is not a valid DOCX archive."
            ) from exc

    def _load_relationships(self, archive: zipfile.ZipFile) -> None:
        relationship_file = "word/_rels/document.xml.rels"

        self._relationships = {}

        if relationship_file not in archive.namelist():
            return

        try:
            root = ET.fromstring(
                archive.read(relationship_file)
            )
        except ET.ParseError:
            return

        for relationship in root.findall(
            f"{{{self.PACKAGE_REL_NS}}}Relationship"
        ):
            relationship_id = relationship.get("Id")
            relationship_type = relationship.get("Type")
            target = relationship.get("Target")

            if not relationship_id or not target:
                continue

            if relationship_type == self.IMAGE_REL_TYPE:
                self._relationships[relationship_id] = target

    def _load_content_types(self, archive: zipfile.ZipFile) -> None:
        content_types_file = "[Content_Types].xml"

        self._content_types = {}

        if content_types_file not in archive.namelist():
            return

        try:
            root = ET.fromstring(
                archive.read(content_types_file)
            )
        except ET.ParseError:
            return

        for override in root:
            local_name = self._local_name(override.tag)

            if local_name == "Default":
                extension = override.get("Extension")
                content_type = override.get("ContentType")

                if extension and content_type:
                    self._content_types[
                        f".{extension.lower().lstrip('.')}"
                    ] = content_type

    def _read_xml(
        self,
        archive: zipfile.ZipFile,
        filename: str,
    ) -> Optional[ET.Element]:
        if filename not in archive.namelist():
            return None

        try:
            return ET.fromstring(
                archive.read(filename)
            )
        except ET.ParseError:
            return None

    def _find_image_relationship_ids(
        self,
        document_xml: ET.Element,
    ) -> List[str]:
        """
        Find image relationship IDs in document order.

        Handles:
            DrawingML blips
            VML imagedata
        """
        relationship_ids: List[str] = []
        seen = set()

        for element in document_xml.iter():
            local_name = self._local_name(element.tag)

            relationship_id = None

            # DrawingML:
            # <a:blip r:embed="rId5"/>
            if local_name == "blip":
                relationship_id = self._get_relationship_attribute(
                    element,
                    "embed",
                )

            # VML:
            # <v:imagedata r:id="rId5"/>
            elif local_name == "imagedata":
                relationship_id = self._get_relationship_attribute(
                    element,
                    "id",
                )

            if not relationship_id:
                continue

            if relationship_id in seen:
                continue

            if relationship_id not in self._relationships:
                continue

            seen.add(relationship_id)
            relationship_ids.append(relationship_id)

        return relationship_ids

    def _get_relationship_attribute(
        self,
        element: ET.Element,
        attribute_name: str,
    ) -> Optional[str]:
        """
        Read an Office relationship attribute regardless of whether
        the XML parser exposes it as a namespaced attribute.
        """
        direct = element.get(
            f"{{{self.REL_NS}}}{attribute_name}"
        )

        if direct:
            return direct

        direct = element.get(attribute_name)

        if direct:
            return direct

        for key, value in element.attrib.items():
            if self._local_name(key) == attribute_name:
                return value

        return None

    # ------------------------------------------------------------------
    # Image extraction
    # ------------------------------------------------------------------

    def _extract_relationship_image(
        self,
        archive: zipfile.ZipFile,
        relationship_id: str,
    ) -> Optional[ExtractedImage]:
        target = self._relationships.get(relationship_id)

        if not target:
            return None

        source_path = self._resolve_target(
            "word/document.xml",
            target,
        )

        if source_path not in archive.namelist():
            return None

        extension = Path(source_path).suffix.lower()

        if extension not in self.EXTRACTABLE_EXTENSIONS:
            return None

        raw_data = archive.read(source_path)

        filename = self._build_output_filename(
            relationship_id,
            source_path,
            extension,
        )

        output_file = self.images_directory / filename

        processed_data = self._process_image(
            raw_data,
            extension,
        )

        output_file.write_bytes(processed_data)

        width_emu, height_emu = self._find_image_dimensions(
            archive,
            relationship_id,
        )

        alt_text = self._find_image_alt_text(
            archive,
            relationship_id,
        )

        content_type = self._content_type_for_extension(
            extension
        )

        relative_output = (
            Path("images") / filename
        ).as_posix()

        return ExtractedImage(
            relationship_id=relationship_id,
            source_path=source_path,
            output_path=relative_output,
            filename=filename,
            extension=extension,
            content_type=content_type,
            width_emu=width_emu,
            height_emu=height_emu,
            alt_text=alt_text,
        )

    def _process_image(
        self,
        data: bytes,
        extension: str,
    ) -> bytes:
        """
        Optionally optimize raster images.

        Optimization is deliberately conservative:
        - PNG stays PNG.
        - JPEG stays JPEG.
        - PDF/SVG/EMF/WMF are never rewritten.
        - If Pillow is unavailable, the original bytes are returned.
        """
        if not self.optimize_images:
            return data

        if Image is None:
            return data

        if extension.lower() not in {
            ".png",
            ".jpg",
            ".jpeg",
            ".webp",
            ".bmp",
            ".tif",
            ".tiff",
        }:
            return data

        try:
            with Image.open(io.BytesIO(data)) as image:
                image.load()

                output = io.BytesIO()

                if extension.lower() == ".png":
                    if image.mode not in {
                        "RGB",
                        "RGBA",
                        "L",
                        "LA",
                        "P",
                    }:
                        image = image.convert("RGBA")

                    image.save(
                        output,
                        format="PNG",
                        optimize=True,
                    )

                elif extension.lower() in {
                    ".jpg",
                    ".jpeg",
                }:
                    if image.mode not in {"RGB", "L"}:
                        image = image.convert("RGB")

                    image.save(
                        output,
                        format="JPEG",
                        quality=95,
                        optimize=True,
                    )

                else:
                    # Keep other raster formats unchanged rather than
                    # unexpectedly changing their semantics.
                    return data

                optimized = output.getvalue()

                # Never replace a valid image with a suspiciously
                # smaller/invalid result.
                if not optimized:
                    return data

                return optimized

        except Exception:
            return data

    # ------------------------------------------------------------------
    # Dimensions / metadata
    # ------------------------------------------------------------------

    def _find_image_dimensions(
        self,
        archive: zipfile.ZipFile,
        relationship_id: str,
    ) -> Tuple[Optional[int], Optional[int]]:
        """
        Find DrawingML extents associated with an image relationship.

        This scans document.xml and associates the nearest drawing
        extent with the matching blip.
        """
        document_xml = self._read_xml(
            archive,
            "word/document.xml",
        )

        if document_xml is None:
            return None, None

        for element in document_xml.iter():
            local_name = self._local_name(element.tag)

            if local_name not in {"blip", "imagedata"}:
                continue

            current_relationship = self._get_relationship_attribute(
                element,
                "embed",
            )

            if current_relationship is None:
                current_relationship = self._get_relationship_attribute(
                    element,
                    "id",
                )

            if current_relationship != relationship_id:
                continue

            # Look at ancestors for a:xfrm/a:ext.
            parent_map = {
                child: parent
                for parent in document_xml.iter()
                for child in parent
            }

            current = element

            for _ in range(12):
                current = parent_map.get(current)

                if current is None:
                    break

                for child in current.iter():
                    if self._local_name(child.tag) != "ext":
                        continue

                    cx = self._parse_int(child.get("cx"))
                    cy = self._parse_int(child.get("cy"))

                    if cx is not None or cy is not None:
                        return cx, cy

        return None, None

    def _find_image_alt_text(
        self,
        archive: zipfile.ZipFile,
        relationship_id: str,
    ) -> Optional[str]:
        """
        Find descriptive text associated with the image.

        Supports:
            wp:docPr descr/name
            pic:cNvPr descr/name
        """
        document_xml = self._read_xml(
            archive,
            "word/document.xml",
        )

        if document_xml is None:
            return None

        parent_map = {
            child: parent
            for parent in document_xml.iter()
            for child in parent
        }

        for element in document_xml.iter():
            local_name = self._local_name(element.tag)

            if local_name != "blip":
                continue

            current_relationship = self._get_relationship_attribute(
                element,
                "embed",
            )

            if current_relationship != relationship_id:
                continue

            current = element

            for _ in range(15):
                current = parent_map.get(current)

                if current is None:
                    break

                for child in current.iter():
                    if self._local_name(child.tag) != "docPr":
                        continue

                    description = (
                        child.get("descr")
                        or child.get("name")
                    )

                    if description:
                        description = description.strip()

                        if description:
                            return description

        return None

    # ------------------------------------------------------------------
    # Path / filename safety
    # ------------------------------------------------------------------

    def _resolve_target(
        self,
        base_file: str,
        target: str,
    ) -> str:
        """
        Resolve a DOCX relationship target safely.

        Prevents traversal outside the DOCX package.
        """
        base_directory = posixpath.dirname(base_file)

        normalized = posixpath.normpath(
            posixpath.join(base_directory, target)
        )

        normalized = normalized.lstrip("/")

        if normalized.startswith("../") or normalized == "..":
            raise ValueError(
                f"Unsafe DOCX relationship target: {target}"
            )

        return normalized

    def _build_output_filename(
        self,
        relationship_id: str,
        source_path: str,
        extension: str,
    ) -> str:
        source_stem = Path(source_path).stem

        safe_stem = self._sanitize_filename(
            source_stem
        )

        safe_relationship = self._sanitize_filename(
            relationship_id
        )

        if not safe_stem:
            safe_stem = "image"

        if not safe_relationship:
            safe_relationship = "image"

        filename = (
            f"{safe_stem}_{safe_relationship}"
            f"{extension.lower()}"
        )

        return filename

    @staticmethod
    def _sanitize_filename(value: str) -> str:
        value = value.strip()

        value = re.sub(
            r"[^A-Za-z0-9._-]+",
            "_",
            value,
        )

        value = re.sub(
            r"_+",
            "_",
            value,
        )

        value = value.strip("._-")

        return value[:180]

    @staticmethod
    def _sanitize_label(value: str) -> str:
        value = value.strip()

        value = re.sub(
            r"[^A-Za-z0-9:_-]+",
            "-",
            value,
        )

        return value.strip("-_:")[:150]

    @staticmethod
    def _sanitize_placement(value: str) -> str:
        allowed = set("htbpH!")

        value = "".join(
            character
            for character in value
            if character in allowed
        )

        return value or "htbp"

    # ------------------------------------------------------------------
    # LaTeX helpers
    # ------------------------------------------------------------------

    def _latex_graphics_path(
        self,
        image: ExtractedImage,
    ) -> Optional[str]:
        """
        Return a path usable by pdflatex.

        SVG/EMF/WMF are deliberately rejected here because emitting
        them directly would often make PDF generation fail.
        """
        if image.extension.lower() not in self.SAFE_LATEX_EXTENSIONS:
            return None

        path = image.latex_path

        # LaTeX handles forward slashes consistently.
        path = path.replace("\\", "/")

        # Avoid accidental TeX comment characters.
        path = path.replace("%", r"\%")

        return path

    @staticmethod
    def _escape_latex(value: str) -> str:
        """
        Escape text used inside LaTeX captions/comments.
        """
        replacements = {
            "\\": r"\textbackslash{}",
            "&": r"\&",
            "%": r"\%",
            "$": r"\$",
            "#": r"\#",
            "_": r"\_",
            "{": r"\{",
            "}": r"\}",
            "~": r"\textasciitilde{}",
            "^": r"\textasciicircum{}",
        }

        return "".join(
            replacements.get(character, character)
            for character in value
        )

    # ------------------------------------------------------------------
    # Utilities
    # ------------------------------------------------------------------

    def _content_type_for_extension(
        self,
        extension: str,
    ) -> Optional[str]:
        extension = extension.lower()

        known = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".bmp": "image/bmp",
            ".tif": "image/tiff",
            ".tiff": "image/tiff",
            ".webp": "image/webp",
            ".pdf": "application/pdf",
            ".svg": "image/svg+xml",
            ".emf": "image/x-emf",
            ".wmf": "image/x-wmf",
        }

        return known.get(
            extension,
            self._content_types.get(extension),
        )

    @staticmethod
    def _local_name(tag: str) -> str:
        if not tag:
            return ""

        if "}" in tag:
            return tag.rsplit("}", 1)[-1]

        if ":" in tag:
            return tag.rsplit(":", 1)[-1]

        return tag

    @staticmethod
    def _parse_int(value: Optional[str]) -> Optional[int]:
        if value is None:
            return None

        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    # ------------------------------------------------------------------
    # Compatibility helpers
    # ------------------------------------------------------------------

    def get_statistics(self) -> Dict[str, int]:
        """
        Return basic extraction statistics.
        """
        images = self.get_images()

        supported = sum(
            1
            for image in images
            if image.extension.lower()
            in self.SAFE_LATEX_EXTENSIONS
        )

        unsupported = len(images) - supported

        return {
            "images_count": len(images),
            "supported_images_count": supported,
            "unsupported_images_count": unsupported,
        }