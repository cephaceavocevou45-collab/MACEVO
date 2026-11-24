FROM python:3.12-slim-bookworm

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PORT=8000

WORKDIR /app

# MACEVO compiles documents with pdfLaTeX/XeLaTeX and Biber, and uses
# Tesseract for OCR. Keep the toolchain in the runtime image so both Django
# services use the same, reproducible environment.
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        biber \
        ca-certificates \
        poppler-utils \
        texlive-fonts-recommended \
        texlive-lang-french \
        texlive-latex-base \
        texlive-latex-extra \
        texlive-latex-recommended \
        texlive-xetex \
        tesseract-ocr \
        tesseract-ocr-eng \
        tesseract-ocr-fra \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/requirements.txt
RUN pip install --upgrade pip \
    && pip install -r /app/requirements.txt

COPY . /app

EXPOSE 8000

# Railway services override this command separately for the API and IA.
CMD ["sh", "scripts/start-main.sh"]
