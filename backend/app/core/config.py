"""
============================================================================
Hub Inteligente de Recursos Educacionais - Módulo de Configuração
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este módulo centraliza todas as configurações da aplicação utilizando
Pydantic Settings, que permite carregar variáveis de ambiente de forma
tipada e validada. O padrão BaseSettings do Pydantic v2 garante que
nenhuma variável crítica (como DATABASE_URL ou GEMINI_API_KEY) fique
sem valor em tempo de execução, prevenindo falhas silenciosas.

A classe Settings utiliza o decorator @lru_cache para implementar o
padrão Singleton funcional — a configuração é carregada uma única vez
do disco (.env) e reutilizada em todas as injeções de dependência,
eliminando I/O redundante.
"""

from functools import lru_cache
from typing import Optional

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configurações globais da aplicação carregadas via variáveis de ambiente.

    Utiliza o Pydantic v2 Settings com model_config para definir o arquivo
    .env como fonte de dados. Cada atributo mapeia diretamente para uma
    variável de ambiente (case-insensitive por padrão).

    Atributos:
        app_name: Nome exibido no health check e logs.
        app_version: Versão semântica da API (SemVer).
        debug: Ativa modo debug com reload automático e logs verbosos.
        database_url: String de conexão PostgreSQL no formato asyncpg.
        gemini_api_key: Chave de autenticação da API Google Gemini.
        gemini_model: Modelo do Gemini a ser utilizado nas requisições.
        cors_origins: Lista de origens permitidas para CORS (separadas por vírgula).
        page_size: Quantidade padrão de itens por página na listagem.
    """

    # ── Metadados da Aplicação ──────────────────────────────────────────
    app_name: str = "Hub Inteligente de Recursos Educacionais"
    app_version: str = "1.0.0"
    debug: bool = False

    # ── Banco de Dados ──────────────────────────────────────────────────
    # Formato: postgresql+asyncpg://user:password@host:port/dbname
    database_url: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/hub_educacional"

    # ── Google Gemini AI ────────────────────────────────────────────────
    gemini_api_key: Optional[str] = None
    gemini_model: str = "gemini-2.5-flash"

    # ── Segurança e CORS ────────────────────────────────────────────────
    cors_origins: str = "http://localhost:5173,http://localhost:3000"

    # ── Paginação ───────────────────────────────────────────────────────
    page_size: int = 10

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",  # Ignora variáveis extras no .env sem lançar erro
    )

    @property
    def cors_origins_list(self) -> list[str]:
        """
        Converte a string de origens CORS em uma lista.
        Permite configurar múltiplas origens via uma única variável de ambiente.
        """
        return [origin.strip() for origin in self.cors_origins.split(",")]


@lru_cache()
def get_settings() -> Settings:
    """
    Factory function com cache (Singleton funcional).

    O decorator @lru_cache garante que a instância de Settings é criada
    apenas uma vez durante o ciclo de vida da aplicação. Chamadas
    subsequentes retornam a mesma instância do cache, evitando leitura
    repetida do arquivo .env.

    Returns:
        Settings: Instância única e imutável das configurações.
    """
    return Settings()