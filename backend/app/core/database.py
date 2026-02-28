"""
============================================================================
Hub Inteligente de Recursos Educacionais - Módulo de Banco de Dados
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este módulo gerencia a conexão assíncrona com o PostgreSQL utilizando
SQLAlchemy 2.0+ com o driver asyncpg. A arquitetura segue o padrão
Session-per-Request, onde cada requisição HTTP recebe uma sessão
exclusiva do banco que é automaticamente fechada ao final.

Conceitos-chave implementados:
  - AsyncEngine: Motor assíncrono que gerencia o pool de conexões TCP.
  - AsyncSessionLocal: Factory de sessões com escopo de transação.
  - get_db(): Dependency Injection via generator (yield pattern do FastAPI).
  - Base: Classe declarativa base para todos os modelos ORM.

O pool de conexões (pool_size=20, max_overflow=10) é dimensionado para
suportar até 30 conexões simultâneas, adequado para aplicações de médio
porte. Em produção, esses valores devem ser ajustados conforme a carga.
"""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

settings = get_settings()

# ── Engine Assíncrono ───────────────────────────────────────────────────
# O create_async_engine cria um pool de conexões TCP persistentes com o
# PostgreSQL. O parâmetro `echo` ativa o log de queries SQL quando em
# modo debug, útil para otimização de consultas durante o desenvolvimento.
engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_size=20,
    max_overflow=10,
    pool_pre_ping=True,  # Verifica conexões mortas antes de reutilizar
)

# ── Session Factory ─────────────────────────────────────────────────────
# async_sessionmaker cria uma factory que produz sessões assíncronas.
# expire_on_commit=False evita que atributos dos objetos ORM expirem
# após o commit, permitindo acessá-los sem queries adicionais.
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """
    Classe base declarativa para todos os modelos ORM.

    Todos os modelos do projeto herdam desta classe, que fornece:
    - Mapeamento automático de classes Python para tabelas SQL.
    - Metadata compartilhado para operações de migração (Alembic).
    - Introspecção de colunas e relacionamentos via __table__.
    """

    pass


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency Injection para sessões do banco de dados.

    Implementa o padrão Context Manager assíncrono via generator (yield).
    O FastAPI detecta o yield e garante que o bloco finally será executado
    mesmo em caso de exceção, prevenindo connection leaks.

    Fluxo:
        1. Cria uma nova sessão do pool.
        2. Yield a sessão para o endpoint (injeção de dependência).
        3. Fecha a sessão no finally (devolve conexão ao pool).

    Yields:
        AsyncSession: Sessão assíncrona do SQLAlchemy para operações CRUD.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def init_db() -> None:
    """
    Inicializa o banco de dados criando todas as tabelas definidas nos modelos.

    Utiliza o método create_all do metadata da Base, que inspeciona todas
    as classes que herdam de Base e cria as tabelas correspondentes caso
    não existam (IF NOT EXISTS implícito).

    NOTA: Em produção, prefira usar Alembic para migrações versionadas.
    Este método é adequado para desenvolvimento e prototipagem rápida.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
