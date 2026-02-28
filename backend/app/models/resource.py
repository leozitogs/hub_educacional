"""
============================================================================
Hub Inteligente de Recursos Educacionais - Modelo ORM: Resource
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este módulo define o modelo ORM (Object-Relational Mapping) para a
entidade Resource, que representa um material didático no sistema.

O modelo utiliza SQLAlchemy 2.0+ com Mapped Annotations, a forma mais
moderna e type-safe de definir modelos ORM em Python. Cada atributo
é anotado com `Mapped[tipo]` e configurado via `mapped_column()`,
permitindo que type checkers (mypy, pyright) validem os tipos em
tempo de desenvolvimento.

Decisões de design:
  - ARRAY(String) para tags: PostgreSQL suporta arrays nativamente,
    eliminando a necessidade de uma tabela de junção (N:N) para um
    campo simples de categorização. Isso simplifica queries de busca
    por tags usando operadores como @> (contains) e && (overlap).
  - server_default para timestamps: Delega a geração de timestamps ao
    PostgreSQL (func.now()), garantindo consistência mesmo em cenários
    de inserção direta no banco.
  - Enum como String: O tipo do recurso é armazenado como VARCHAR para
    flexibilidade, com validação no nível do schema Pydantic.
"""

from datetime import datetime

from sqlalchemy import ARRAY, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base


class Resource(Base):
    """
    Modelo ORM representando um recurso educacional no banco de dados.

    Mapeamento para a tabela `resources` no PostgreSQL.

    Colunas:
        id (int): Chave primária auto-incrementada.
        title (str): Título do recurso educacional (max 255 caracteres).
        description (str): Descrição detalhada do conteúdo (TEXT, sem limite).
        resource_type (str): Tipo do recurso — "video", "pdf" ou "link".
        url (str): URL de acesso ao recurso (max 2048 caracteres, padrão RFC).
        tags (list[str]): Lista de tags para categorização (ARRAY nativo do PostgreSQL).
        created_at (datetime): Timestamp de criação (gerado pelo banco).
        updated_at (datetime): Timestamp da última atualização (atualizado automaticamente).
    """

    __tablename__ = "resources"

    # ── Chave Primária ──────────────────────────────────────────────────
    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
        comment="Identificador único auto-incrementado",
    )

    # ── Campos de Conteúdo ──────────────────────────────────────────────
    title: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True,  # Índice B-tree para buscas por título
        comment="Título do recurso educacional",
    )

    description: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        comment="Descrição detalhada do conteúdo para os alunos",
    )

    resource_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,  # Índice para filtragem por tipo
        comment="Tipo do recurso: video, pdf ou link",
    )

    url: Mapped[str] = mapped_column(
        String(2048),
        nullable=False,
        comment="URL de acesso ao recurso (RFC 2616 max length)",
    )

    # ── Tags (Array Nativo PostgreSQL) ──────────────────────────────────
    # O tipo ARRAY do PostgreSQL permite armazenar listas diretamente na
    # coluna, sem necessidade de tabela de junção. Suporta operadores de
    # busca como @> (contém) e && (interseção), otimizados com índice GIN.
    tags: Mapped[list[str]] = mapped_column(
        ARRAY(String(100)),
        nullable=False,
        server_default="{}",  # Array vazio como default no PostgreSQL
        comment="Tags de categorização do recurso",
    )

    # ── Timestamps Automáticos ──────────────────────────────────────────
    created_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        comment="Data e hora de criação do registro",
    )

    updated_at: Mapped[datetime] = mapped_column(
        server_default=func.now(),
        onupdate=func.now(),  # Atualiza automaticamente em cada UPDATE
        comment="Data e hora da última modificação",
    )

    def __repr__(self) -> str:
        """Representação legível do modelo para debugging e logs."""
        return (
            f"<Resource(id={self.id}, title='{self.title}', "
            f"type='{self.resource_type}')>"
        )
