from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services.latex_service import latex_service


router = APIRouter(
    prefix="/api/latex",
    tags=["LaTeX"],
)


# ==========================================================
# MODÈLE DE REQUÊTE
# ==========================================================

class LatexCompileRequest(BaseModel):
    latex: str = ""


# ==========================================================
# COMPILATION
# ==========================================================

@router.post("/compile")
async def compile_latex(request: LatexCompileRequest):

    result = latex_service.compile(
        request.latex
    )

    return result


# ==========================================================
# PDF
# ==========================================================

@router.get("/pdf/{compilation_id}")
async def download_pdf(compilation_id: str):

    pdf_file = latex_service.get_pdf(
        compilation_id
    )

    if pdf_file is None:
        raise HTTPException(
            status_code=404,
            detail="PDF introuvable."
        )

    return FileResponse(
        path=str(pdf_file),
        media_type="application/pdf",
        filename="macevo.pdf",
    )


# ==========================================================
# LOGS
# ==========================================================

@router.get("/logs/{compilation_id}")
async def get_logs(compilation_id: str):

    logs = latex_service.get_logs(
        compilation_id
    )

    if not logs:
        raise HTTPException(
            status_code=404,
            detail="Logs introuvables."
        )

    return {
        "success": True,
        "compilationId": compilation_id,
        "logs": logs,
    }


# ==========================================================
# PING
# ==========================================================

@router.get("/ping")
async def ping():

    return {
        "success": True,
        "service": "latex",
        "pdflatex": latex_service.pdflatex,
        "message": "Le service LaTeX MACEVO fonctionne.",
    }