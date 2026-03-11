"""
Flow Builder API - Main Application
FastAPI application para o Flow Builder Visual.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging

from .core.config import settings
from .routers import flows, simulate

# Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# App
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    API para o Flow Builder Visual - Interface estilo Miro/Figma
    para criar, visualizar e simular fluxos conversacionais de vendas.

    ## Features

    - **Flows**: CRUD de flows (canvas com nodes e edges)
    - **Nodes**: Cards de diferentes tipos (Mode, Etapa, Mensagem, Script, Decisão, Simulação)
    - **Edges**: Conexões entre nodes (default, conditional, fallback)
    - **Simulation**: Simulação de conversas com IA e visualização de reasoning

    ## Stack

    - FastAPI (Python)
    - Supabase (PostgreSQL)
    - Anthropic Claude (Simulação)
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(flows.router, prefix=settings.API_PREFIX)
app.include_router(simulate.router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """Health check"""
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "flow_builder_api.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
