"""
============================================================================
Hub Inteligente de Recursos Educacionais - Schemas Pydantic
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este módulo define os schemas de validação utilizando Pydantic v2,
responsáveis por garantir a integridade dos dados em todas as camadas
da aplicação (entrada, saída e comunicação com a IA).

Arquitetura dos Schemas (Padrão DTO - Data Transfer Object):
  - ResourceCreate: Valida dados de entrada na criação (POST).
  - ResourceUpdate: Valida dados de atualização parcial (PUT).
  - ResourceResponse: Serializa dados de saída (GET), incluindo campos
    gerados pelo banco (id, timestamps).
  - PaginatedResponse: Wrapper genérico para respostas paginadas.
  - AIGenerateRequest: Valida entrada para o endpoint de IA.
  - AIGenerateResponse: Estrutura a resposta da IA (descrição + tags).

O Pydantic v2 utiliza Rust internamente (via pydantic-core) para
validação, sendo até 50x mais rápido que o v1. Os validators são
definidos com o decorator @field_validator, que permite lógica
customizada de sanitização e validação.
"""

from datetime import datetime
from enum import Enum
from typing import Generic, Optional, TypeVar

from pydantic import BaseModel, ConfigDict, Field, field_validator


class ResourceType(str, Enum):
    """
    Enum que define os tipos válidos de recurso educacional.

    Herda de `str` e `Enum` simultaneamente (mixin pattern), permitindo
    que os valores sejam serializados como strings no JSON e comparados
    diretamente com strings no código.
    """

    VIDEO = "video"
    PDF = "pdf"
    LINK = "link"


# ── Schema de Criação ───────────────────────────────────────────────────


class ResourceCreate(BaseModel):
    """
    Schema de validação para criação de um novo recurso educacional.

    Todos os campos são obrigatórios exceto `tags`, que possui default
    como lista vazia. Os validators garantem sanitização dos dados
    antes de chegarem ao banco.
    """

    title: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Título do recurso educacional",
        examples=["Introdução à Álgebra Linear"],
    )

    description: str = Field(
        ...,
        min_length=10,
        max_length=5000,
        description="Descrição detalhada do conteúdo",
        examples=["Este vídeo aborda os conceitos fundamentais de vetores e matrizes..."],
    )

    resource_type: ResourceType = Field(
        ...,
        description="Tipo do recurso: video, pdf ou link",
        examples=["video"],
    )

    url: str = Field(
        ...,
        min_length=5,
        max_length=2048,
        description="URL de acesso ao recurso",
        examples=["https://youtube.com/watch?v=exemplo"],
    )

    tags: list[str] = Field(
        default_factory=list,
        max_length=10,  # Máximo de 10 tags por recurso
        description="Tags de categorização",
        examples=[["matemática", "álgebra", "linear"]],
    )

    @field_validator("title", "description")
    @classmethod
    def strip_whitespace(cls, value: str) -> str:
        """
        Remove espaços em branco desnecessários no início e fim.

        Este validator é executado automaticamente pelo Pydantic antes
        de qualquer outra validação, garantindo dados limpos.
        """
        return value.strip()

    @field_validator("url")
    @classmethod
    def validate_url_format(cls, value: str) -> str:
        """
        Valida que a URL possui um formato minimamente válido.

        Verifica se a URL começa com http:// ou https://, prevenindo
        injeção de protocolos maliciosos (javascript:, data:, etc.).
        """
        value = value.strip()
        if not value.startswith(("http://", "https://")):
            raise ValueError("A URL deve começar com http:// ou https://")
        return value

    @field_validator("tags")
    @classmethod
    def sanitize_tags(cls, value: list[str]) -> list[str]:
        """
        Sanitiza as tags: lowercase, trim e remoção de duplicatas.

        A normalização para lowercase garante que "Python" e "python"
        sejam tratados como a mesma tag, evitando fragmentação na busca.
        """
        seen: set[str] = set()
        sanitized: list[str] = []
        for tag in value:
            normalized = tag.strip().lower()
            if normalized and normalized not in seen:
                seen.add(normalized)
                sanitized.append(normalized)
        return sanitized

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "title": "Cálculo Diferencial - Aula 01",
                "description": "Primeira aula do curso de Cálculo, cobrindo limites e continuidade.",
                "resource_type": "video",
                "url": "https://youtube.com/watch?v=calc01",
                "tags": ["cálculo", "limites", "matemática"],
            }
        }
    )


# ── Schema de Atualização ──────────────────────────────────────────────


class ResourceUpdate(BaseModel):
    """
    Schema de validação para atualização de um recurso existente.

    Todos os campos são opcionais (Optional), permitindo atualização
    parcial (PATCH semantics). Apenas os campos enviados serão
    atualizados no banco de dados.
    """

    title: Optional[str] = Field(
        None,
        min_length=3,
        max_length=255,
        description="Novo título do recurso",
    )
    description: Optional[str] = Field(
        None,
        min_length=10,
        max_length=5000,
        description="Nova descrição do recurso",
    )
    resource_type: Optional[ResourceType] = Field(
        None,
        description="Novo tipo do recurso",
    )
    url: Optional[str] = Field(
        None,
        min_length=5,
        max_length=2048,
        description="Nova URL do recurso",
    )
    tags: Optional[list[str]] = Field(
        None,
        max_length=10,
        description="Novas tags do recurso",
    )

    @field_validator("title", "description", mode="before")
    @classmethod
    def strip_whitespace(cls, value: Optional[str]) -> Optional[str]:
        """Strip whitespace de campos de texto, se fornecidos."""
        if value is not None:
            return value.strip()
        return value

    @field_validator("url", mode="before")
    @classmethod
    def validate_url_format(cls, value: Optional[str]) -> Optional[str]:
        """Valida formato da URL, se fornecida."""
        if value is not None:
            value = value.strip()
            if not value.startswith(("http://", "https://")):
                raise ValueError("A URL deve começar com http:// ou https://")
        return value

    @field_validator("tags", mode="before")
    @classmethod
    def sanitize_tags(cls, value: Optional[list[str]]) -> Optional[list[str]]:
        """Sanitiza tags, se fornecidas."""
        if value is not None:
            seen: set[str] = set()
            sanitized: list[str] = []
            for tag in value:
                normalized = tag.strip().lower()
                if normalized and normalized not in seen:
                    seen.add(normalized)
                    sanitized.append(normalized)
            return sanitized
        return value


# ── Schema de Resposta ──────────────────────────────────────────────────


class ResourceResponse(BaseModel):
    """
    Schema de serialização para resposta da API.

    Inclui todos os campos do recurso mais os campos gerados pelo banco
    (id, created_at, updated_at). O `model_config` com `from_attributes=True`
    permite converter diretamente objetos ORM do SQLAlchemy para Pydantic.
    """

    id: int = Field(..., description="ID único do recurso")
    title: str = Field(..., description="Título do recurso")
    description: str = Field(..., description="Descrição do recurso")
    resource_type: str = Field(..., description="Tipo do recurso")
    url: str = Field(..., description="URL de acesso")
    tags: list[str] = Field(..., description="Tags de categorização")
    created_at: datetime = Field(..., description="Data de criação")
    updated_at: datetime = Field(..., description="Data da última atualização")

    model_config = ConfigDict(from_attributes=True)


# ── Schema de Paginação ────────────────────────────────────────────────

T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    """
    Schema genérico para respostas paginadas.

    Utiliza Generics do Python (TypeVar) para ser reutilizável com
    qualquer tipo de dado. O frontend utiliza `total_pages` e `page`
    para renderizar a navegação de paginação.

    Atributos:
        items: Lista de itens da página atual.
        total: Total de itens no banco (para cálculo de páginas).
        page: Número da página atual (1-indexed).
        page_size: Quantidade de itens por página.
        total_pages: Total de páginas calculado.
    """

    items: list[T]
    total: int = Field(..., ge=0, description="Total de registros")
    page: int = Field(..., ge=1, description="Página atual")
    page_size: int = Field(..., ge=1, description="Itens por página")
    total_pages: int = Field(..., ge=0, description="Total de páginas")


# ── Schemas de IA (Smart Assist) ────────────────────────────────────────


class AIGenerateRequest(BaseModel):
    """
    Schema de entrada para o endpoint de geração com IA.

    O frontend envia o título e o tipo do recurso, e o backend
    consulta o Google Gemini para gerar uma descrição pedagógica
    e tags recomendadas.
    """

    title: str = Field(
        ...,
        min_length=3,
        max_length=255,
        description="Título do recurso para geração de descrição",
        examples=["Introdução à Programação em Python"],
    )

    resource_type: ResourceType = Field(
        ...,
        description="Tipo do recurso para contextualização da IA",
        examples=["video"],
    )

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        """Remove espaços extras do título antes de enviar à IA."""
        return value.strip()


class AIGenerateResponse(BaseModel):
    """
    Schema de resposta do endpoint de geração com IA.

    Estrutura o retorno do Gemini em um formato previsível para
    o frontend, contendo a descrição gerada e exatamente 3 tags.
    """

    description: str = Field(
        ...,
        description="Descrição pedagógica gerada pela IA",
    )

    tags: list[str] = Field(
        ...,
        min_length=3,
        max_length=3,
        description="Exatamente 3 tags recomendadas pela IA",
    )