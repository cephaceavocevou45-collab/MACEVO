"""
MACEVO - Image Extractor
Version: 1.0.1

Import des images scientifiques et documents graphiques.
"""

from __future__ import annotations

from pathlib import Path

from core.importers.extractors.base import BaseExtractor
from core.importers.models import ImportedAsset, ImportedDocument, ImportFormat


class ImageExtractor(BaseExtractor):
    """
    Extracteur d'images.

    L'image originale est conservée dans ImportedAsset.data.
    """

    format = ImportFormat.IMAGE

    MIME_TYPES = {
        ".png": "image/png",
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".webp": "image/webp",
        ".bmp": "image/bmp",
        ".tif": "image/tiff",
        ".tiff": "image/tiff",
    }

    def extract(self, path: Path) -> ImportedDocument:
        self.validate_path(path)

        data = path.read_bytes()

        extension = path.suffix.lower()

        metadata = {
            "extension": extension,
            "size_bytes": len(data),
            "mime_type": self.MIME_TYPES.get(extension),
        }

        # Inspection facultative avec Pillow.
        try:
            from PIL import Image

            with Image.open(path) as image:
                metadata.update(
                    {
                        "width": image.width,
                        "height": image.height,
                        "mode": image.mode,
                        "format": image.format,
                    }
                )

        except Exception as exc:
            metadata["image_inspection_error"] = str(exc)

        asset = ImportedAsset(
            asset_type="image",
            name=path.name,
            data=data,
            metadata=metadata,
        )

        return ImportedDocument(
            source_path=str(path.resolve()),
            filename=path.name,
            format=self.format,
            title=path.stem,
            text="",
            metadata=metadata,
            figures=[asset],
        )