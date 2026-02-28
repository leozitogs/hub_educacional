"""
Pacote de schemas Pydantic do Hub Inteligente de Recursos Educacionais.
Exporta todos os schemas de validação para uso nos endpoints da API.
"""

from app.schemas.resource import (
    AIGenerateRequest,
    AIGenerateResponse,
    ResourceCreate,
    ResourceResponse,
    ResourceUpdate,
    PaginatedResponse,
)

__all__ = [
    "ResourceCreate",
    "ResourceUpdate",
    "ResourceResponse",
    "PaginatedResponse",
    "AIGenerateRequest",
    "AIGenerateResponse",
]
