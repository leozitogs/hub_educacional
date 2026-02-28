"""
============================================================================
Hub Inteligente de Recursos Educacionais - Aplicação Principal (FastAPI)
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este é o ponto de entrada da aplicação FastAPI. Aqui são configurados:

  1. Instância do FastAPI: Com metadados para documentação OpenAPI.
  2. Middleware CORS: Permite requisições cross-origin do frontend React.
  3. Lifecycle Events: Inicialização do banco de dados no startup.
  4. Rotas: Registro do router principal com prefixo /api/v1.
  5. Health Check: Endpoint /health para monitoramento.

Arquitetura de Inicialização:
  O FastAPI utiliza o padrão Lifespan (substituto do @app.on_event
  deprecado) para gerenciar o ciclo de vida da aplicação. O context
  manager `lifespan` é executado uma vez no startup e garante que
  o banco de dados esteja pronto antes de aceitar requisições.

CORS (Cross-Origin Resource Sharing):
  O middleware CORS é essencial para permitir que o frontend React
  (rodando em localhost:5173) faça requisições para o backend
  (rodando em localhost:8000). Sem ele, o navegador bloquearia
  todas as requisições por política de Same-Origin.
"""

from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import router
from app.core.config import get_settings
from app.core.database import init_db
from app.core.logging import setup_logger

settings = get_settings()
logger = setup_logger("hub_educacional.main")


# ── Lifespan Context Manager ───────────────────────────────────────────
# O padrão Lifespan do FastAPI substitui os decorators @app.on_event
# (deprecados desde v0.109). O código antes do yield executa no startup,
# e o código após o yield executa no shutdown.


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Gerencia o ciclo de vida da aplicação.

    Startup:
      - Inicializa o banco de dados (cria tabelas se necessário).
      - Registra log de inicialização com timestamp.

    Shutdown:
      - Registra log de encerramento.
      - (Futuro: fechar pool de conexões, flush de logs, etc.)
    """
    logger.info(f"🚀 Iniciando {settings.app_name} v{settings.app_version}")
    logger.info(f"📊 Debug mode: {settings.debug}")

    # Inicializa o banco de dados (cria tabelas via CREATE IF NOT EXISTS)
    await init_db()
    logger.info("✅ Banco de dados inicializado com sucesso")

    yield  # Aplicação rodando e aceitando requisições

    logger.info(f"🛑 Encerrando {settings.app_name}")


# ── Instância do FastAPI ────────────────────────────────────────────────
app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "API RESTful para gerenciamento inteligente de recursos educacionais. "
        "Integra IA generativa (Google Gemini) para sugestão automática de "
        "descrições e categorização de materiais didáticos."
    ),
    docs_url="/docs",  # Swagger UI
    redoc_url="/redoc",  # ReDoc
    lifespan=lifespan,
)


# ── Middleware CORS ─────────────────────────────────────────────────────
# Configura o CORS para permitir requisições do frontend React.
# Em produção, restrinja `allow_origins` apenas aos domínios autorizados.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],  # Permite todos os métodos HTTP
    allow_headers=["*"],  # Permite todos os headers
)


# ── Registro de Rotas ──────────────────────────────────────────────────
# O prefixo /api/v1 segue a convenção de versionamento de API,
# permitindo futuras versões (/api/v2) sem quebrar clientes existentes.
app.include_router(router, prefix="/api/v1")


# ── Health Check ────────────────────────────────────────────────────────
@app.get(
    "/health",
    summary="Health Check",
    description="Verifica se a aplicação está rodando e responsiva.",
    tags=["Sistema"],
)
async def health_check() -> dict:
    """
    Endpoint de health check para monitoramento.

    Retorna o status da aplicação, versão e timestamp atual.
    Utilizado por load balancers, Kubernetes probes e ferramentas
    de monitoramento para verificar a disponibilidade do serviço.

    Returns:
        Dicionário com status, versão e timestamp UTC.
    """
    return {
        "status": "healthy",
        "app": settings.app_name,
        "version": settings.app_version,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }