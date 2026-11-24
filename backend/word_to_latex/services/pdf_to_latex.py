"""Reconstruct an editable LaTeX text source and an Overleaf ZIP from PDF."""

from __future__ import annotations

import io
import re
import unicodedata
import zipfile
from pathlib import Path

import fitz
from word_to_latex.converters.latex_symbols import replace_latex_symbols


LATEX_ESCAPES = {
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

MATH_SYMBOLS = {
    "\u03b1": r"\ensuremath{\alpha}", "\u03b2": r"\ensuremath{\beta}",
    "\u03b3": r"\ensuremath{\gamma}", "\u03b4": r"\ensuremath{\delta}",
    "\u03b8": r"\ensuremath{\theta}", "\u03bb": r"\ensuremath{\lambda}",
    "\u03bc": r"\ensuremath{\mu}", "\u03c0": r"\ensuremath{\pi}",
    "\u03c3": r"\ensuremath{\sigma}", "\u03c6": r"\ensuremath{\phi}",
    "\u03c9": r"\ensuremath{\omega}", "\u0394": r"\ensuremath{\Delta}",
    "\u03a3": r"\ensuremath{\Sigma}", "\u03a9": r"\ensuremath{\Omega}",
    "\u00b1": r"\ensuremath{\pm}", "\u00d7": r"\ensuremath{\times}",
    "\u00f7": r"\ensuremath{\div}", "\u2264": r"\ensuremath{\leq}",
    "\u2265": r"\ensuremath{\geq}", "\u2260": r"\ensuremath{\neq}",
    "\u2248": r"\ensuremath{\approx}", "\u221e": r"\ensuremath{\infty}",
    "\u2211": r"\ensuremath{\sum}", "\u220f": r"\ensuremath{\prod}",
    "\u222b": r"\ensuremath{\int}", "\u221a": r"\ensuremath{\surd}",
    "\u00b2": r"\ensuremath{^2}", "\u00b3": r"\ensuremath{^3}",
    "\u2080": r"\ensuremath{_0}", "\u2081": r"\ensuremath{_1}",
    "\u2082": r"\ensuremath{_2}", "\u2083": r"\ensuremath{_3}",
    "\u2192": r"\ensuremath{\rightarrow}", "\u2190": r"\ensuremath{\leftarrow}",
    "\u2194": r"\ensuremath{\leftrightarrow}", "\u2202": r"\ensuremath{\partial}",
    "\u2208": r"\ensuremath{\in}", "\u2209": r"\ensuremath{\notin}",
    "\u2212": "-", "\u2261": r"\ensuremath{\equiv}",
    "\u221d": r"\ensuremath{\propto}", "\u2207": r"\ensuremath{\nabla}",
    "\u2022": r"\textbullet{}", "\u2074": r"\ensuremath{^4}",
    "\u2075": r"\ensuremath{^5}", "\u2076": r"\ensuremath{^6}",
    "\u2077": r"\ensuremath{^7}", "\u2078": r"\ensuremath{^8}",
    "\u2079": r"\ensuremath{^9}", "\u00b0": r"\ensuremath{^\circ}",
    "\u00b9": r"\ensuremath{^1}",
    "\u00bc": r"\ensuremath{\frac{1}{4}}",
    "\u00bd": r"\ensuremath{\frac{1}{2}}",
    "\u00be": r"\ensuremath{\frac{3}{4}}",
    "\u00a9": r"\textcopyright{}", "\u00ae": r"\textregistered{}",
    "\u2122": r"\texttrademark{}", "\u20ac": r"\texteuro{}",
}

MAX_ARCHIVE_SIZE = 50 * 1024 * 1024


def _normalize_pdf_text(value: str) -> str:
    value = unicodedata.normalize("NFC", value)
    return (
        value.replace("\u00ad", "")
        .replace("\u00a0", " ")
        .replace("\ufb01", "fi").replace("\ufb02", "fl")
        .replace("\u201c", '"').replace("\u201d", '"')
        .replace("\u2018", "'").replace("\u2019", "'")
        .replace("\u2013", "-").replace("\u2014", "--")
        .replace("\u2026", "...")
    )


def escape_latex(value: str) -> str:
    value = _normalize_pdf_text(value)
    escaped = "".join(LATEX_ESCAPES.get(char, char) for char in value)
    symbols_converted = "".join(
        MATH_SYMBOLS.get(char, char) for char in escaped
    )
    return replace_latex_symbols(symbols_converted)


def _looks_like_heading(line: str) -> int:
    normalized = line.strip()
    if not normalized or len(normalized) > 140:
        return 0
    if re.match(r"^(?:\d+(?:\.\d+)*\.?\s+)[A-Z\u00c0-\u00dd]", normalized):
        return 1 if normalized.count(".") < 2 else 2
    if normalized.isupper() and len(normalized.split()) <= 12:
        return 1
    return 0


def _extract_pdf_pages(uploaded_file) -> tuple[list[list[str]], int, bool]:
    uploaded_file.seek(0)
    pdf_bytes = uploaded_file.read()
    uploaded_file.seek(0)
    try:
        document = fitz.open(stream=pdf_bytes, filetype="pdf")
    except Exception as exc:
        raise ValueError("Le fichier fourni n'est pas un PDF lisible.") from exc

    if not document.page_count:
        document.close()
        raise ValueError("Le PDF ne contient aucune page.")
    if document.page_count > 100:
        count = document.page_count
        document.close()
        raise ValueError(
            f"Le PDF contient {count} pages. La limite est de 100 pages."
        )

    ocr_used = False
    pages = []
    try:
        for index, page in enumerate(document, start=1):
            text = page.get_text("text").strip()
            used_ocr_for_page = False
            if len(text) < 40 and page.get_images(full=True):
                from assistant.document_service import DocumentService

                used_ocr_for_page = True
                ocr_used = True
                page_file = _SinglePagePdf(pdf_bytes, index, uploaded_file.name)
                try:
                    text = DocumentService.extract_pdf(page_file)
                    text = re.sub(r"^--- PAGE \d+ ---\s*", "", text).strip()
                except ValueError as exc:
                    if "Aucun texte exploitable" in str(exc):
                        text = ""
                    else:
                        raise

            if not text:
                pages.append([])
                continue

            if used_ocr_for_page:
                blocks = [line.strip() for line in text.splitlines() if line.strip()]
            else:
                blocks = [
                    re.sub(r"\s+", " ", block[4]).strip()
                    for block in page.get_text("blocks")
                    if len(block) > 4 and isinstance(block[4], str) and block[4].strip()
                ]
            pages.append(blocks or [text])
        page_count = document.page_count
    finally:
        document.close()

    if not any(block for page in pages for block in page):
        raise ValueError(
            "Aucun texte exploitable n'a ete extrait. Verifiez la qualite du scan "
            "et la disponibilite de l'OCR francais ou anglais."
        )
    return pages, page_count, ocr_used


def _render_latex(pages: list[list[str]], title: str) -> str:
    body = []
    for page_number, page_blocks in enumerate(pages, start=1):
        for block in page_blocks:
            line = re.sub(r"\s+", " ", block).strip()
            if not line:
                continue
            safe_line = escape_latex(line)
            heading_level = _looks_like_heading(line)
            if heading_level == 1:
                body.append(f"\\section{{{safe_line}}}")
            elif heading_level == 2:
                body.append(f"\\subsection{{{safe_line}}}")
            else:
                body.append(safe_line + "\n\n")
        if page_number < len(pages):
            body.append("\\par\\medskip\n")

    safe_title = escape_latex(title)
    return "\n".join([
        r"\documentclass[11pt,a4paper]{report}",
        r"\usepackage[utf8]{inputenc}",
        r"\usepackage[T1]{fontenc}",
        r"\usepackage[french]{babel}",
        r"\usepackage{geometry}",
        r"\geometry{margin=2.5cm}",
        r"\usepackage{graphicx}",
        r"\usepackage{textcomp}",
        r"\usepackage{lmodern}",
        r"\usepackage{float}",
        r"\usepackage{amsmath,amssymb}",
        r"\usepackage{hyperref}",
        r"\usepackage{setspace}",
        r"\onehalfspacing",
        r"\begin{document}",
        f"\\title{{{safe_title}}}",
        r"\author{}",
        r"\hypersetup{pageanchor=false}",
        r"\maketitle",
        r"\hypersetup{pageanchor=true}",
        r"\pagenumbering{roman}",
        r"\tableofcontents",
        r"\clearpage",
        r"\pagenumbering{arabic}",
        *body,
        r"\end{document}",
        "",
    ])


def convert_pdf(uploaded_file) -> dict:
    """Extract editable text and produce a self-contained pdfLaTeX source."""
    pages, page_count, ocr_used = _extract_pdf_pages(uploaded_file)
    title = Path(uploaded_file.name or "document").stem
    latex = _render_latex(pages, title)
    return {
        "latex_code": latex,
        "pages_count": page_count,
        "words_count": len(" ".join(block for page in pages for block in page).split()),
        "ocr_used": ocr_used,
        "notes": [
            "Le fichier .tex est une transcription editable du texte extrait; une reconstruction automatique ne peut pas garantir la mise en page exacte du PDF.",
            "Pour retrouver le rendu source, importez le ZIP Overleaf et compilez main.tex : il incorpore toutes les pages du PDF original.",
            "Le ZIP contient aussi editable-text.tex, la transcription editable du texte extrait.",
        ],
    }


def create_latex_archive(
    uploaded_file,
    conversion_result: dict | None = None,
) -> tuple[io.BytesIO, str]:
    """Create a complete Overleaf project that reproduces the source PDF."""
    result = conversion_result or convert_pdf(uploaded_file)
    uploaded_file.seek(0)
    pdf_bytes = uploaded_file.read()
    uploaded_file.seek(0)
    if len(pdf_bytes) > MAX_ARCHIVE_SIZE:
        raise ValueError("Le PDF source dépasse la taille maximale du projet ZIP (50 Mo).")

    title = Path(uploaded_file.name or "document").stem
    safe_title = re.sub(r"[^A-Za-z0-9_-]+", "_", title).strip("_") or "document"
    output = io.BytesIO()
    main_tex = "\n".join([
        r"\documentclass[a4paper]{article}",
        r"\usepackage[utf8]{inputenc}",
        r"\usepackage[T1]{fontenc}",
        r"\usepackage{pdfpages}",
        r"\usepackage[margin=0pt]{geometry}",
        r"\pagestyle{empty}",
        r"\begin{document}",
        r"\includepdf[pages=-,fitpaper=true]{source.pdf}",
        r"\end{document}",
        "",
    ])
    with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
        archive.writestr("main.tex", main_tex.encode("utf-8"))
        archive.writestr("editable-text.tex", result["latex_code"].encode("utf-8"))
        archive.writestr("source.pdf", pdf_bytes)
        archive.writestr(
            "README.txt",
            (
                "Projet MACEVO compatible avec Overleaf.\n"
                "Le document principal est main.tex : compilez-le avec pdfLaTeX pour reproduire exactement les pages du PDF source.\n"
                "editable-text.tex contient une transcription editable du texte extrait; sa mise en page peut differer de l'original.\n"
            ).encode("utf-8"),
        )
    output.seek(0)
    return output, f"{safe_title}-overleaf.zip"


class _SinglePagePdf:
    """File-like adapter that lets the existing OCR extractor process a page."""

    content_type = "application/pdf"

    def __init__(self, pdf_bytes: bytes, page_number: int, filename: str):
        self.name = f"{Path(filename).stem}-page-{page_number}.pdf"
        source = fitz.open(stream=pdf_bytes, filetype="pdf")
        output = fitz.open()
        try:
            output.insert_pdf(source, from_page=page_number - 1, to_page=page_number - 1)
            self._bytes = output.tobytes()
        finally:
            output.close()
            source.close()
        self.size = len(self._bytes)
        self._position = 0

    def seek(self, position):
        self._position = position

    def read(self, size=-1):
        if size is None or size < 0:
            size = len(self._bytes) - self._position
        result = self._bytes[self._position:self._position + size]
        self._position += len(result)
        return result
