from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes.latex import router as latex_router


# ==========================================================
# APPLICATION MACEVO
# ==========================================================

app = FastAPI(
    title="MACEVO Backend",
    description="Backend de compilation LaTeX de MACEVO",
    version="1.0.0",
)


# ==========================================================
# CORS
# ==========================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==========================================================
# ROUTES LATEX
# ==========================================================

app.include_router(
    latex_router,
)


# ==========================================================
# ROUTE RACINE
# ==========================================================

@app.get("/")
async def root():
    return {
        "success": True,
        "service": "MACEVO Backend",
        "version": "1.0.0",
        "message": "Backend MACEVO opérationnel.",
    }


# ==========================================================
# HEALTH CHECK
# ==========================================================

@app.get("/health")
async def health():
    return {
        "success": True,
        "service": "MACEVO Backend",
        "status": "healthy",
    }


# ==========================================================
# DEBUG ROUTES
# ==========================================================

@app.get("/debug/routes")
async def debug_routes():
    return {
        "routes": [
            route.path
            for route in app.routes
            if hasattr(route, "path")
        ]
    }