"""Persistent, project-scoped text extraction and retrieval."""

from __future__ import annotations

import hashlib
import re
from pathlib import Path

from django.db import IntegrityError, transaction

from assistant.document_service import DocumentService
from projects.models import ProjectDocument, ProjectDocumentChunk


CHUNK_CHARACTERS = 1400
CHUNK_OVERLAP = 180
MAX_RESULTS = 5
TOKEN_RE = re.compile(r"[\wÀ-ÖØ-öø-ÿ]{2,}", re.UNICODE)


def _chunk_text(text: str):
    """Split on paragraph boundaries where possible, retaining source offsets."""
    text = re.sub(r"\r\n?", "\n", text).strip()
    chunks = []
    start = 0
    length = len(text)
    while start < length:
        hard_end = min(start + CHUNK_CHARACTERS, length)
        end = hard_end
        if hard_end < length:
            boundary = text.rfind("\n", start + CHUNK_CHARACTERS // 2, hard_end)
            if boundary > start:
                end = boundary
        chunk = text[start:end].strip()
        if chunk:
            leading = len(text[start:end]) - len(text[start:end].lstrip())
            chunks.append((start + leading, start + leading + len(chunk), chunk))
        if end >= length:
            break
        start = max(end - CHUNK_OVERLAP, start + 1)
    return chunks


def index_project_document(*, user, project, uploaded_file):
    """Validate, extract, persist and chunk a supported project document."""
    if project.author_id != user.pk:
        raise PermissionError("Le projet ne vous appartient pas.")
    if uploaded_file.size > DocumentService.MAX_FILE_SIZE:
        raise ValueError("Le fichier dépasse la limite autorisée de 20 Mo.")

    original_name = Path(uploaded_file.name or "document").name[:255]
    digest = hashlib.sha256()
    for block in uploaded_file.chunks():
        digest.update(block)
    file_hash = digest.hexdigest()
    uploaded_file.seek(0)

    existing = ProjectDocument.objects.filter(
        user=user, project=project, sha256=file_hash
    ).first()
    if existing:
        return existing, False

    extracted = DocumentService.extract_text(uploaded_file)
    extracted = re.sub(r"\x00", "", str(extracted or "")).strip()
    if not extracted:
        raise ValueError(
            "Aucun texte exploitable n'a été extrait. Le document peut être numérisé "
            "ou ne pas contenir de texte lisible."
        )

    media_type = getattr(uploaded_file, "content_type", "") or ""
    with transaction.atomic():
        document = ProjectDocument(
            user=user,
            project=project,
            original_name=original_name,
            content_type=media_type[:120],
            size_bytes=uploaded_file.size,
            sha256=file_hash,
            extracted_text=extracted,
            extraction_status="complete",
        )
        document.file.save(original_name, uploaded_file, save=False)
        try:
            with transaction.atomic():
                document.save()
        except IntegrityError:
            document.file.delete(save=False)
            duplicate = ProjectDocument.objects.get(
                user=user, project=project, sha256=file_hash
            )
            return duplicate, False

        ProjectDocumentChunk.objects.bulk_create(
            [
                ProjectDocumentChunk(
                    user=user,
                    project=project,
                    document=document,
                    ordinal=ordinal,
                    start_offset=start,
                    end_offset=end,
                    text=chunk,
                )
                for ordinal, (start, end, chunk) in enumerate(_chunk_text(extracted))
            ],
            batch_size=200,
        )
    return document, True


def search_project_documents(*, user, project, query, limit=MAX_RESULTS):
    """Rank project chunks by lexical overlap; scope is enforced in SQL."""
    terms = {term.casefold() for term in TOKEN_RE.findall(query or "")}
    if not terms:
        return []

    candidates = ProjectDocumentChunk.objects.filter(
        user=user, project=project
    ).select_related("document")
    ranked = []
    for chunk in candidates.iterator(chunk_size=300):
        text_terms = {term.casefold() for term in TOKEN_RE.findall(chunk.text)}
        overlap = terms & text_terms
        if overlap:
            score = len(overlap) / (len(terms) ** 0.5)
            ranked.append((score, chunk))
    ranked.sort(key=lambda item: (-item[0], item[1].document_id, item[1].ordinal))
    return [chunk for _, chunk in ranked[:max(1, min(int(limit), MAX_RESULTS))]]


def format_retrieved_context(chunks):
    if not chunks:
        return ""
    parts = []
    for chunk in chunks:
        location = f"fragment {chunk.ordinal + 1}"
        if chunk.page_number:
            location += f", page {chunk.page_number}"
        if chunk.section_title:
            location += f", section {chunk.section_title}"
        parts.append(
            f"[Document : {chunk.document.original_name} ; {location}]\n{chunk.text}"
        )
    return "Extraits retrouvés dans les documents du projet :\n\n" + "\n\n".join(parts)
