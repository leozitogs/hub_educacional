"""
============================================================================
Hub Inteligente de Recursos Educacionais - Serviço de Recursos (CRUD)
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este módulo implementa o Service Layer para operações CRUD de recursos
educacionais. O padrão Service Layer separa a lógica de negócio dos
endpoints HTTP, promovendo:

  - Testabilidade: Serviços podem ser testados isoladamente com mocks.
  - Reutilização: A mesma lógica pode ser chamada de diferentes endpoints.
  - Manutenibilidade: Mudanças na lógica de negócio não afetam os endpoints.

Todas as operações são assíncronas (async/await) para não bloquear o
event loop do FastAPI durante queries ao PostgreSQL. O SQLAlchemy 2.0
com asyncpg permite que múltiplas queries sejam executadas em paralelo
quando não há dependência entre elas.

Padrão de Paginação:
  Utiliza OFFSET/LIMIT do SQL para paginação server-side. O cálculo
  de total_pages usa divisão inteira com arredondamento para cima:
    total_pages = ceil(total / page_size) = -(-total // page_size)
  O truque com negação dupla é uma forma Pythonic de ceil division
  sem importar o módulo math.
"""

from typing import Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import setup_logger
from app.models.resource import Resource
from app.schemas.resource import ResourceCreate, ResourceUpdate

logger = setup_logger("hub_educacional.resource_service")


class ResourceService:
    """
    Serviço de operações CRUD para recursos educacionais.

    Cada método recebe uma sessão do banco (injetada pelo FastAPI)
    e executa a operação correspondente de forma assíncrona.

    O padrão de injeção de sessão (ao invés de criar sessões internamente)
    permite que o chamador controle o escopo da transação, possibilitando
    operações compostas (ex: criar recurso + log de auditoria) em uma
    única transação atômica.
    """

    @staticmethod
    async def get_all(
        db: AsyncSession,
        page: int = 1,
        page_size: int = 10,
        search: Optional[str] = None,
        resource_type: Optional[str] = None,
    ) -> dict:
        """
        Lista recursos com paginação, busca e filtro por tipo.

        A query utiliza:
          - ilike: Busca case-insensitive por título (índice B-tree).
          - OFFSET/LIMIT: Paginação server-side eficiente.
          - ORDER BY created_at DESC: Recursos mais recentes primeiro.

        O COUNT é executado em uma query separada para evitar o overhead
        de carregar todos os registros apenas para contar. Em tabelas
        grandes, considerar usar COUNT estimado via pg_class.reltuples.

        Args:
            db: Sessão assíncrona do SQLAlchemy.
            page: Número da página (1-indexed).
            page_size: Quantidade de itens por página.
            search: Termo de busca para filtrar por título.
            resource_type: Filtro por tipo de recurso.

        Returns:
            Dicionário com items, total, page, page_size e total_pages.
        """
        # ── Construção dinâmica da query ────────────────────────────────
        # O SQLAlchemy 2.0 utiliza o padrão select() ao invés do
        # session.query() legado, oferecendo melhor composição e tipagem.
        query = select(Resource)
        count_query = select(func.count(Resource.id))

        # Aplica filtro de busca por título (case-insensitive)
        if search:
            search_filter = Resource.title.ilike(f"%{search}%")
            query = query.where(search_filter)
            count_query = count_query.where(search_filter)

        # Aplica filtro por tipo de recurso
        if resource_type:
            type_filter = Resource.resource_type == resource_type
            query = query.where(type_filter)
            count_query = count_query.where(type_filter)

        # ── Contagem total (query separada para performance) ────────────
        total_result = await db.execute(count_query)
        total = total_result.scalar_one()

        # ── Cálculo de paginação ────────────────────────────────────────
        # ceil division sem math.ceil: -(-a // b) é equivalente a ceil(a/b)
        total_pages = max(1, -(-total // page_size))
        offset = (page - 1) * page_size

        # ── Query principal com ordenação e paginação ───────────────────
        query = (
            query
            .order_by(Resource.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )

        result = await db.execute(query)
        items = list(result.scalars().all())

        logger.info(
            f"Listagem: page={page}, page_size={page_size}, "
            f"total={total}, filters=[search={search}, type={resource_type}]"
        )

        return {
            "items": items,
            "total": total,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        }

    @staticmethod
    async def get_by_id(db: AsyncSession, resource_id: int) -> Optional[Resource]:
        """
        Busca um recurso pelo ID.

        Utiliza session.get() que é otimizado para busca por chave primária,
        consultando primeiro o identity map (cache da sessão) antes de
        executar uma query SQL.

        Args:
            db: Sessão assíncrona do SQLAlchemy.
            resource_id: ID do recurso a ser buscado.

        Returns:
            Instância do Resource ou None se não encontrado.
        """
        result = await db.get(Resource, resource_id)
        return result

    @staticmethod
    async def create(db: AsyncSession, data: ResourceCreate) -> Resource:
        """
        Cria um novo recurso educacional no banco de dados.

        O fluxo segue o padrão Unit of Work do SQLAlchemy:
          1. Cria instância do modelo ORM com dados validados.
          2. Adiciona ao session (staging area).
          3. Commit persiste no banco (transação atômica).
          4. Refresh recarrega campos gerados pelo banco (id, timestamps).

        Args:
            db: Sessão assíncrona do SQLAlchemy.
            data: Dados validados pelo schema ResourceCreate.

        Returns:
            Instância do Resource com ID e timestamps preenchidos.
        """
        resource = Resource(
            title=data.title,
            description=data.description,
            resource_type=data.resource_type.value,
            url=data.url,
            tags=data.tags,
        )

        db.add(resource)
        await db.commit()
        await db.refresh(resource)

        logger.info(f"Recurso criado: id={resource.id}, title='{resource.title}'")
        return resource

    @staticmethod
    async def update(
        db: AsyncSession, resource_id: int, data: ResourceUpdate
    ) -> Optional[Resource]:
        """
        Atualiza parcialmente um recurso existente.

        Utiliza model_dump(exclude_unset=True) do Pydantic v2 para obter
        apenas os campos que foram explicitamente enviados na requisição.
        Isso implementa semântica de PATCH (atualização parcial), onde
        campos não enviados mantêm seus valores originais.

        O setattr() dinâmico evita código repetitivo de atribuição
        campo a campo, sendo seguro aqui porque os nomes dos campos
        já foram validados pelo schema Pydantic.

        Args:
            db: Sessão assíncrona do SQLAlchemy.
            resource_id: ID do recurso a ser atualizado.
            data: Dados validados pelo schema ResourceUpdate.

        Returns:
            Instância atualizada do Resource ou None se não encontrado.
        """
        resource = await db.get(Resource, resource_id)
        if not resource:
            return None

        # exclude_unset=True retorna apenas campos enviados na requisição
        update_data = data.model_dump(exclude_unset=True)

        for field, value in update_data.items():
            # Converte Enum para string antes de atribuir ao ORM
            if field == "resource_type" and value is not None:
                value = value.value
            setattr(resource, field, value)

        await db.commit()
        await db.refresh(resource)

        logger.info(
            f"Recurso atualizado: id={resource.id}, "
            f"campos={list(update_data.keys())}"
        )
        return resource

    @staticmethod
    async def delete(db: AsyncSession, resource_id: int) -> bool:
        """
        Remove um recurso do banco de dados.

        Implementa hard delete (remoção permanente). Em sistemas de
        produção, considere implementar soft delete (flag is_deleted)
        para permitir recuperação de dados.

        Args:
            db: Sessão assíncrona do SQLAlchemy.
            resource_id: ID do recurso a ser removido.

        Returns:
            True se o recurso foi removido, False se não encontrado.
        """
        resource = await db.get(Resource, resource_id)
        if not resource:
            return False

        await db.delete(resource)
        await db.commit()

        logger.info(f"Recurso removido: id={resource_id}")
        return True
