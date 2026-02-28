"""
============================================================================
Hub Inteligente de Recursos Educacionais - Módulo de Logging Estruturado
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este módulo implementa um sistema de logging estruturado que segue as
melhores práticas de observabilidade em sistemas distribuídos. Utiliza
o módulo nativo `logging` do Python com formatação customizada para
produzir logs legíveis tanto para humanos quanto para ferramentas de
agregação (ELK Stack, Grafana Loki, etc.).

O formato dos logs segue o padrão:
  [LEVEL] YYYY-MM-DD HH:MM:SS | module | message

Para a interação com a IA (Gemini), os logs incluem métricas de
performance como latência e uso de tokens, essenciais para monitorar
custos e degradação de serviço.
"""

import logging
import sys
from typing import Optional


class StructuredFormatter(logging.Formatter):
    """
    Formatter customizado que produz logs estruturados e legíveis.

    O formato inclui:
    - Nível do log (colorido no terminal)
    - Timestamp ISO 8601
    - Nome do módulo emissor
    - Mensagem formatada

    A colorização utiliza códigos ANSI e é automaticamente desabilitada
    quando a saída não é um terminal (ex: redirecionamento para arquivo).
    """

    # Mapeamento de cores ANSI para cada nível de log
    COLORS: dict[int, str] = {
        logging.DEBUG: "\033[36m",  # Ciano
        logging.INFO: "\033[32m",  # Verde
        logging.WARNING: "\033[33m",  # Amarelo
        logging.ERROR: "\033[31m",  # Vermelho
        logging.CRITICAL: "\033[35m",  # Magenta
    }
    RESET = "\033[0m"

    def format(self, record: logging.LogRecord) -> str:
        """
        Formata o registro de log com cores e estrutura padronizada.

        Args:
            record: Registro de log do Python contendo nível, mensagem, etc.

        Returns:
            String formatada pronta para output no console/arquivo.
        """
        color = self.COLORS.get(record.levelno, self.RESET)
        timestamp = self.formatTime(record, "%Y-%m-%d %H:%M:%S")

        # Aplica cor apenas se a saída for um terminal interativo
        if sys.stderr.isatty():
            return f"{color}[{record.levelname}]{self.RESET} " f"{timestamp} | {record.name} | {record.getMessage()}"
        return f"[{record.levelname}] {timestamp} | " f"{record.name} | {record.getMessage()}"


def setup_logger(name: str = "hub_educacional", level: int = logging.INFO) -> logging.Logger:
    """
    Configura e retorna um logger com formatação estruturada.

    Esta função é idempotente — se o logger já possui handlers configurados,
    retorna a instância existente sem duplicar handlers (evitando logs
    repetidos, um bug comum em aplicações Python).

    Args:
        name: Nome do logger (namespace hierárquico).
        level: Nível mínimo de log (default: INFO).

    Returns:
        Logger configurado com handler de console e formatter estruturado.
    """
    logger = logging.getLogger(name)

    # Evita duplicação de handlers em chamadas repetidas
    if logger.handlers:
        return logger

    logger.setLevel(level)

    # Handler para saída no console (stderr por convenção)
    console_handler = logging.StreamHandler(sys.stderr)
    console_handler.setLevel(level)
    console_handler.setFormatter(StructuredFormatter())

    logger.addHandler(console_handler)

    return logger


def log_ai_request(
    logger: logging.Logger,
    title: str,
    resource_type: str,
    latency: float,
    token_usage: Optional[int] = None,
    success: bool = True,
) -> None:
    """
    Registra métricas estruturadas de uma requisição à API de IA.

    Este helper padroniza o formato dos logs de interação com o Gemini,
    facilitando a criação de dashboards e alertas baseados em padrões
    de texto (regex) em ferramentas de observabilidade.

    Formato do log:
        [INFO] AI Request: Title="...", Type="...", TokenUsage=N, Latency=Xs

    Args:
        logger: Instância do logger para emissão do registro.
        title: Título do recurso enviado à IA.
        resource_type: Tipo do recurso (Vídeo, PDF, Link).
        latency: Tempo de resposta da API em segundos.
        token_usage: Quantidade de tokens consumidos (se disponível).
        success: Indica se a requisição foi bem-sucedida.
    """
    status = "SUCCESS" if success else "FAILURE"
    token_info = f"TokenUsage={token_usage}" if token_usage else "TokenUsage=N/A"

    log_message = (
        f'AI Request: Title="{title}", Type="{resource_type}", '
        f"{token_info}, Latency={latency:.2f}s, Status={status}"
    )

    if success:
        logger.info(log_message)
    else:
        logger.error(log_message)
