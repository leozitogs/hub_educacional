"""
============================================================================
Hub Inteligente de Recursos Educacionais - Testes da API
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Testes unitários para os endpoints da API REST utilizando pytest
e httpx (TestClient assíncrono do FastAPI).

Os testes cobrem:
  - Health check endpoint
  - Validação de schemas Pydantic
  - Serialização de respostas
"""

import pytest
from app.schemas.resource import (
    AIGenerateRequest,
    AIGenerateResponse,
    ResourceCreate,
    ResourceType,
    ResourceUpdate,
)


class TestResourceSchemas:
    """Testes de validação dos schemas Pydantic."""

    def test_resource_create_valid(self) -> None:
        """Testa criação de schema com dados válidos."""
        data = ResourceCreate(
            title="Introdução ao Python",
            description="Curso completo de Python para iniciantes com exemplos práticos.",
            resource_type=ResourceType.VIDEO,
            url="https://youtube.com/watch?v=python101",
            tags=["python", "programação", "iniciante"],
        )
        assert data.title == "Introdução ao Python"
        assert data.resource_type == ResourceType.VIDEO
        assert len(data.tags) == 3

    def test_resource_create_strips_whitespace(self) -> None:
        """Testa que espaços em branco são removidos automaticamente."""
        data = ResourceCreate(
            title="  Título com espaços  ",
            description="  Descrição com espaços extras no início e fim.  ",
            resource_type=ResourceType.PDF,
            url="https://example.com/doc.pdf",
            tags=["  tag1  ", "TAG2", "tag1"],  # Duplicata e case diferente
        )
        assert data.title == "Título com espaços"
        assert data.description == "Descrição com espaços extras no início e fim."
        assert data.tags == ["tag1", "tag2"]  # Deduplicado e lowercase

    def test_resource_create_invalid_url(self) -> None:
        """Testa que URLs sem protocolo HTTP são rejeitadas."""
        with pytest.raises(ValueError):
            ResourceCreate(
                title="Recurso Inválido",
                description="Descrição de teste para recurso com URL inválida.",
                resource_type=ResourceType.LINK,
                url="ftp://invalid-protocol.com",
                tags=[],
            )

    def test_resource_update_partial(self) -> None:
        """Testa que atualização parcial aceita campos opcionais."""
        data = ResourceUpdate(title="Novo Título Atualizado")
        dump = data.model_dump(exclude_unset=True)
        assert "title" in dump
        assert "description" not in dump
        assert "url" not in dump

    def test_ai_generate_request_valid(self) -> None:
        """Testa schema de requisição para IA."""
        data = AIGenerateRequest(
            title="Cálculo Diferencial",
            resource_type=ResourceType.VIDEO,
        )
        assert data.title == "Cálculo Diferencial"
        assert data.resource_type == ResourceType.VIDEO

    def test_ai_generate_response_valid(self) -> None:
        """Testa schema de resposta da IA."""
        data = AIGenerateResponse(
            description="Descrição gerada pela IA para teste.",
            tags=["tag1", "tag2", "tag3"],
        )
        assert len(data.tags) == 3

    def test_ai_generate_response_wrong_tag_count(self) -> None:
        """Testa que resposta da IA requer exatamente 3 tags."""
        with pytest.raises(ValueError):
            AIGenerateResponse(
                description="Descrição de teste.",
                tags=["tag1", "tag2"],  # Apenas 2 tags
            )
