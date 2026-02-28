"""
Pacote de serviços do Hub Inteligente de Recursos Educacionais.
Contém a lógica de negócio isolada dos endpoints da API.
"""

from app.services.ai_service import AIService
from app.services.resource_service import ResourceService

__all__ = ["AIService", "ResourceService"]
