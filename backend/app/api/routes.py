"""
============================================================================
Hub Inteligente de Recursos Educacionais - Rotas da API REST
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este módulo define todos os endpoints da API REST utilizando o APIRouter
do FastAPI. A organização segue o padrão de separação de concerns:

  - Endpoints (este módulo): Recebem requisições HTTP, validam parâmetros
    de rota/query e delegam a lógica para os serviços.
  - Services: Contêm a lógica de negócio e interação com o banco.
  - Schemas: Validam e serializam dados de entrada/saída.

Cada endpoint é documentado com docstrings que o FastAPI converte
automaticamente em documentação Swagger/OpenAPI interativa, acessível
em /docs (Swagger UI) e /redoc (ReDoc).

Padrões HTTP implementados:
  - GET /resources       → Lista paginada (200 OK)
  - GET /resources/{id}  → Detalhe (200 OK | 404 Not Found)
  - POST /resources      → Criação (201 Created)
  - PUT /resources/{id}  → Atualização (200 OK | 404 Not Found)
  - DELETE /resources/{id} → Remoção (204 No Content | 404 Not Found)
  - POST /ai/generate    → Geração com IA (200 OK | 500/503)
"""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.logging import setup_logger
from app.schemas.resource import (
    AIGenerateRequest,
    AIGenerateResponse,
    PaginatedResponse,
    ResourceCreate,
    ResourceResponse,
    ResourceUpdate,
)
from app.services.ai_service import AIService
from app.services.resource_service import ResourceService

logger = setup_logger("hub_educacional.api")

# ── Router Principal ────────────────────────────────────────────────────
# O APIRouter permite agrupar endpoints com prefixo e tags comuns,
# facilitando a organização e documentação da API.
router = APIRouter()

# ── Instâncias dos Serviços ─────────────────────────────────────────────
resource_service = ResourceService()
ai_service = AIService()


# ═══════════════════════════════════════════════════════════════════════
# ENDPOINTS DE RECURSOS (CRUD)
# ═══════════════════════════════════════════════════════════════════════


@router.get(
    "/resources",
    response_model=PaginatedResponse[ResourceResponse],
    summary="Listar recursos educacionais",
    description="Retorna uma lista paginada de recursos com suporte a busca por título e filtro por tipo.",
    tags=["Recursos"],
)
async def list_resources(
    page: int = Query(1, ge=1, description="Número da página (1-indexed)"),
    page_size: int = Query(10, ge=1, le=100, description="Itens por página"),
    search: Optional[str] = Query(None, max_length=255, description="Busca por título"),
    resource_type: Optional[str] = Query(None, description="Filtro por tipo: video, pdf, link"),
    db: AsyncSession = Depends(get_db),
) -> PaginatedResponse[ResourceResponse]:
    """
    Lista recursos educacionais com paginação server-side.

    O endpoint aceita parâmetros de query para paginação, busca textual
    e filtragem por tipo. A busca é case-insensitive e utiliza LIKE
    do PostgreSQL com índice B-tree.

    Query Parameters:
        page: Página desejada (default: 1).
        page_size: Itens por página (default: 10, max: 100).
        search: Termo para busca no título.
        resource_type: Filtro por tipo (video, pdf, link).

    Returns:
        PaginatedResponse contendo items, total, page, page_size e total_pages.
    """
    result = await resource_service.get_all(
        db=db,
        page=page,
        page_size=page_size,
        search=search,
        resource_type=resource_type,
    )
    return PaginatedResponse[ResourceResponse](**result)


@router.get(
    "/resources/{resource_id}",
    response_model=ResourceResponse,
    summary="Obter recurso por ID",
    description="Retorna os detalhes completos de um recurso educacional específico.",
    tags=["Recursos"],
)
async def get_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
) -> ResourceResponse:
    """
    Busca um recurso específico pelo seu ID.

    Retorna 404 Not Found se o recurso não existir, seguindo a
    semântica HTTP correta para recursos inexistentes.

    Path Parameters:
        resource_id: ID único do recurso.

    Returns:
        ResourceResponse com todos os campos do recurso.

    Raises:
        HTTPException 404: Se o recurso não for encontrado.
    """
    resource = await resource_service.get_by_id(db, resource_id)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recurso com ID {resource_id} não encontrado.",
        )
    return ResourceResponse.model_validate(resource)


@router.post(
    "/resources",
    response_model=ResourceResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Criar novo recurso",
    description="Cadastra um novo recurso educacional no sistema.",
    tags=["Recursos"],
)
async def create_resource(
    data: ResourceCreate,
    db: AsyncSession = Depends(get_db),
) -> ResourceResponse:
    """
    Cria um novo recurso educacional.

    O corpo da requisição é validado automaticamente pelo schema
    ResourceCreate do Pydantic. Campos como tags são sanitizados
    (lowercase, deduplicação) antes da persistência.

    Request Body:
        ResourceCreate com title, description, resource_type, url e tags.

    Returns:
        ResourceResponse com o recurso criado (incluindo id e timestamps).
        Status 201 Created conforme RFC 7231.
    """
    resource = await resource_service.create(db, data)
    return ResourceResponse.model_validate(resource)


@router.put(
    "/resources/{resource_id}",
    response_model=ResourceResponse,
    summary="Atualizar recurso",
    description="Atualiza parcialmente um recurso educacional existente.",
    tags=["Recursos"],
)
async def update_resource(
    resource_id: int,
    data: ResourceUpdate,
    db: AsyncSession = Depends(get_db),
) -> ResourceResponse:
    """
    Atualiza parcialmente um recurso existente.

    Implementa semântica de PATCH: apenas os campos enviados no corpo
    da requisição serão atualizados. Campos omitidos mantêm seus
    valores originais.

    Path Parameters:
        resource_id: ID do recurso a ser atualizado.

    Request Body:
        ResourceUpdate com campos opcionais para atualização.

    Returns:
        ResourceResponse com o recurso atualizado.

    Raises:
        HTTPException 404: Se o recurso não for encontrado.
    """
    resource = await resource_service.update(db, resource_id, data)
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recurso com ID {resource_id} não encontrado.",
        )
    return ResourceResponse.model_validate(resource)


@router.delete(
    "/resources/{resource_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Excluir recurso",
    description="Remove permanentemente um recurso educacional do sistema.",
    tags=["Recursos"],
)
async def delete_resource(
    resource_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Remove permanentemente um recurso do banco de dados.

    Retorna 204 No Content em caso de sucesso (sem corpo na resposta),
    seguindo a convenção REST para operações de deleção.

    Path Parameters:
        resource_id: ID do recurso a ser removido.

    Raises:
        HTTPException 404: Se o recurso não for encontrado.
    """
    deleted = await resource_service.delete(db, resource_id)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Recurso com ID {resource_id} não encontrado.",
        )


# ═══════════════════════════════════════════════════════════════════════
# ENDPOINT DE INTELIGÊNCIA ARTIFICIAL (Smart Assist)
# ═══════════════════════════════════════════════════════════════════════


@router.post(
    "/ai/generate",
    response_model=AIGenerateResponse,
    summary="Gerar descrição com IA",
    description="Utiliza o Google Gemini para gerar automaticamente uma descrição pedagógica e tags recomendadas.",
    tags=["Inteligência Artificial"],
)
async def generate_with_ai(
    data: AIGenerateRequest,
) -> AIGenerateResponse:
    """
    Gera descrição e tags automaticamente via Google Gemini.

    Este endpoint implementa a funcionalidade "Smart Assist" do sistema.
    O frontend envia o título e tipo do recurso, e o backend consulta
    a API do Gemini com um System Prompt especializado em pedagogia.

    O endpoint não requer sessão do banco pois não persiste dados —
    apenas atua como proxy inteligente para a API de IA.

    Request Body:
        AIGenerateRequest com title e resource_type.

    Returns:
        AIGenerateResponse com description e tags (3 tags).

    Raises:
        HTTPException 503: Se a API do Gemini estiver indisponível.
        HTTPException 500: Se houver erro no processamento da resposta.
    """
    try:
        result = await ai_service.generate_description(
            title=data.title,
            resource_type=data.resource_type.value,
        )
        return AIGenerateResponse(**result)

    except ValueError as e:
        logger.error(f"Erro no serviço de IA: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(e),
        )
    except Exception as e:
        logger.error(f"Erro inesperado no endpoint de IA: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro interno ao processar a requisição de IA.",
        )
