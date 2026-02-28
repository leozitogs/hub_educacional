"""
============================================================================
Hub Inteligente de Recursos Educacionais - Serviço de Inteligência Artificial
============================================================================
Autor: Leonardo Gonçalves Sobral - 19 anos
       Ciência da Computação - 3° Período
============================================================================

Este módulo implementa a integração com a API do Google Gemini para
geração automática de descrições pedagógicas e tags de categorização.

Arquitetura do Serviço:
  O AIService segue o padrão Service Layer, encapsulando toda a lógica
  de comunicação com a API externa. Isso isola o endpoint HTTP da
  complexidade da integração, facilitando testes (mock) e manutenção.

Engenharia de Prompt:
  O System Prompt foi cuidadosamente projetado para instruir o Gemini
  a atuar como um "Assistente Pedagógico Especializado". A estratégia
  utiliza as seguintes técnicas de prompt engineering:

  1. Role Assignment: Define explicitamente o papel da IA como
     assistente pedagógico, direcionando o tom e vocabulário.

  2. Output Formatting: Exige resposta em JSON estrito, eliminando
     ambiguidade na estrutura do retorno.

  3. Constraint Setting: Limita o tamanho da descrição (2-4 frases)
     e a quantidade de tags (exatamente 3), garantindo consistência.

  4. Audience Specification: Instrui que o conteúdo deve ser útil
     para alunos universitários, calibrando o nível de complexidade.

  5. Few-shot Example: Inclui um exemplo de saída esperada, reduzindo
     a variância nas respostas do modelo.

Tratamento de Erros:
  O serviço implementa tratamento granular de exceções, diferenciando
  entre erros de rede, erros de parsing JSON e erros da API do Gemini.
  Cada cenário produz logs estruturados para diagnóstico.
"""

import json
import time
from typing import Any, Optional

import httpx

from app.core.config import get_settings
from app.core.logging import log_ai_request, setup_logger

logger = setup_logger("hub_educacional.ai_service")
settings = get_settings()

# ── System Prompt (Engenharia de Prompt Rigorosa) ───────────────────────
# Este prompt é o "cérebro" da funcionalidade Smart Assist. Cada linha
# foi projetada para maximizar a qualidade e consistência das respostas.

SYSTEM_PROMPT = (
    "Você é um Assistente Pedagógico Especializado em curadoria de "
    "materiais educacionais para ensino superior. Sua função é auxiliar "
    "professores e alunos na catalogação inteligente de recursos "
    "didáticos.\n\n"
    "REGRAS OBRIGATÓRIAS:\n"
    "1. Você DEVE responder EXCLUSIVAMENTE em formato JSON válido, "
    "sem markdown, sem explicações adicionais, sem blocos de código.\n"
    '2. O JSON deve conter exatamente dois campos: "description" '
    '(string) e "tags" (array de 3 strings).\n'
    "3. A descrição deve ter entre 2 e 4 frases, ser informativa e "
    "útil para alunos universitários.\n"
    "4. A descrição deve explicar o que o aluno aprenderá ou "
    "encontrará no recurso.\n"
    "5. As 3 tags devem ser palavras-chave relevantes em português, "
    "em letras minúsculas.\n"
    "6. Adapte o tom e vocabulário ao tipo de recurso "
    "(vídeo = linguagem dinâmica, PDF = linguagem técnica, "
    "link = linguagem informativa).\n\n"
    "EXEMPLO DE SAÍDA ESPERADA:\n"
    '{"description": "Este vídeo apresenta os conceitos fundamentais '
    "de derivadas e integrais, essenciais para o curso de Cálculo I. "
    "O aluno aprenderá a resolver problemas práticos de taxa de "
    "variação e área sob curvas, com exemplos resolvidos passo a "
    'passo.", "tags": ["cálculo", "derivadas", "integrais"]}'
    "\n\n"
    "IMPORTANTE: Retorne APENAS o JSON, sem nenhum texto antes "
    "ou depois."
)


class AIService:
    """
    Serviço de integração com a API do Google Gemini.

    Encapsula a comunicação HTTP assíncrona com a API, o parsing da
    resposta JSON e o logging estruturado de métricas de performance.

    O serviço utiliza httpx (cliente HTTP assíncrono) ao invés do
    requests (síncrono), evitando bloqueio do event loop do FastAPI.

    Attributes:
        api_key: Chave de autenticação da API Gemini.
        model: Modelo do Gemini a ser utilizado.
        base_url: URL base da API Gemini.
    """

    def __init__(self) -> None:
        """
        Inicializa o serviço com as configurações do ambiente.

        Raises:
            ValueError: Se a GEMINI_API_KEY não estiver configurada.
        """
        self.api_key: Optional[str] = settings.gemini_api_key
        self.model: str = settings.gemini_model
        self.base_url: str = "https://generativelanguage.googleapis.com/v1beta"

    def _build_request_payload(self, title: str, resource_type: str) -> dict[str, Any]:
        """
        Constrói o payload da requisição para a API do Gemini.

        O payload segue a especificação da API Gemini v1beta, utilizando
        o formato `contents` com roles (user/model) e `systemInstruction`
        para o System Prompt.

        A separação do System Prompt no campo `systemInstruction` (ao invés
        de incluí-lo no histórico de mensagens) é uma best practice que
        garante que o modelo trate as instruções com maior prioridade.

        Args:
            title: Título do recurso educacional.
            resource_type: Tipo do recurso (video, pdf, link).

        Returns:
            Dicionário com o payload formatado para a API.
        """
        # Mapeamento de tipos para nomes legíveis em português
        type_labels: dict[str, str] = {
            "video": "Vídeo Educacional",
            "pdf": "Documento PDF",
            "link": "Link/Recurso Web",
        }

        user_message = (
            f"Gere uma descrição pedagógica e 3 tags para o seguinte recurso:\n"
            f"- Título: {title}\n"
            f"- Tipo: {type_labels.get(resource_type, resource_type)}\n\n"
            f"Responda APENAS com o JSON no formato especificado."
        )

        return {
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
            "contents": [{"role": "user", "parts": [{"text": user_message}]}],
            "generationConfig": {
                "temperature": 0.7,  # Balanceamento entre criatividade e consistência
                "topP": 0.9,  # Nucleus sampling para diversidade controlada
                "topK": 40,  # Limita o vocabulário considerado
                "maxOutputTokens": 500,  # Limite de tokens na resposta
            },
        }

    def _parse_gemini_response(self, response_data: dict[str, Any]) -> dict[str, Any]:
        """
        Extrai e valida o JSON da resposta do Gemini.

        O Gemini pode retornar o JSON dentro de blocos de código markdown
        (```json ... ```) ou como texto puro. Este parser lida com ambos
        os cenários, extraindo o JSON válido independente do formato.

        A estratégia de parsing em cascata tenta:
          1. Parse direto do texto como JSON.
          2. Extração de JSON de blocos markdown.
          3. Busca por padrão { ... } no texto.

        Args:
            response_data: Resposta completa da API do Gemini.

        Returns:
            Dicionário com 'description' (str) e 'tags' (list[str]).

        Raises:
            ValueError: Se o JSON não puder ser extraído ou validado.
        """
        try:
            # Navega na estrutura de resposta do Gemini
            candidates = response_data.get("candidates", [])
            if not candidates:
                raise ValueError("Resposta do Gemini não contém candidates")

            content = candidates[0].get("content", {})
            parts = content.get("parts", [])
            if not parts:
                raise ValueError("Resposta do Gemini não contém parts")

            text = parts[0].get("text", "").strip()
            logger.debug(f"Texto bruto do Gemini: {text}")

            # ── Estratégia 1: Parse direto ──────────────────────────────
            try:
                result = json.loads(text)
            except json.JSONDecodeError:
                # ── Estratégia 2: Extrair de bloco markdown ─────────────
                if "```" in text:
                    # Remove delimitadores de bloco de código
                    clean = text.split("```json")[-1] if "```json" in text else text.split("```")[-2]
                    clean = clean.split("```")[0].strip()
                    result = json.loads(clean)
                else:
                    # ── Estratégia 3: Buscar padrão JSON no texto ───────
                    start = text.find("{")
                    end = text.rfind("}") + 1
                    if start == -1 or end == 0:
                        raise ValueError(f"JSON não encontrado na resposta: {text[:200]}")
                    result = json.loads(text[start:end])

            # ── Validação da estrutura do JSON ──────────────────────────
            if "description" not in result:
                raise ValueError("Campo 'description' ausente na resposta da IA")
            if "tags" not in result or not isinstance(result["tags"], list):
                raise ValueError("Campo 'tags' ausente ou inválido na resposta da IA")

            # Garante exatamente 3 tags (trunca ou preenche se necessário)
            tags = [str(tag).strip().lower() for tag in result["tags"]]
            if len(tags) > 3:
                tags = tags[:3]
            elif len(tags) < 3:
                # Preenche com tags genéricas baseadas no tipo
                fallback_tags = ["educação", "aprendizado", "estudo"]
                while len(tags) < 3:
                    for ft in fallback_tags:
                        if ft not in tags and len(tags) < 3:
                            tags.append(ft)

            return {
                "description": str(result["description"]).strip(),
                "tags": tags,
            }

        except (KeyError, IndexError, TypeError) as e:
            raise ValueError(f"Erro ao processar resposta do Gemini: {str(e)}")

    async def generate_description(self, title: str, resource_type: str) -> dict[str, Any]:
        """
        Gera descrição pedagógica e tags via API do Google Gemini.

        Este é o método principal do serviço, orquestrando:
          1. Construção do payload com engenharia de prompt.
          2. Requisição HTTP assíncrona para a API do Gemini.
          3. Parsing e validação da resposta JSON.
          4. Logging estruturado de métricas de performance.

        O método utiliza httpx.AsyncClient como context manager, garantindo
        que a conexão HTTP seja fechada mesmo em caso de exceção.

        Args:
            title: Título do recurso educacional.
            resource_type: Tipo do recurso (video, pdf, link).

        Returns:
            Dicionário com 'description' e 'tags' gerados pela IA.

        Raises:
            ValueError: Se a API key não estiver configurada.
            httpx.HTTPStatusError: Se a API retornar erro HTTP.
            ValueError: Se a resposta não puder ser parseada.
        """
        if not self.api_key:
            logger.warning("GEMINI_API_KEY não configurada — usando resposta mock")
            return self._generate_mock_response(title, resource_type)

        # URL da API com modelo e chave de autenticação
        url = f"{self.base_url}/models/{self.model}:generateContent" f"?key={self.api_key}"

        payload = self._build_request_payload(title, resource_type)
        start_time = time.perf_counter()

        try:
            # httpx.AsyncClient é o equivalente assíncrono do requests.Session
            # O timeout de 30s previne que a requisição bloqueie indefinidamente
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )
                response.raise_for_status()

            latency = time.perf_counter() - start_time
            response_data = response.json()

            # Extrai métricas de uso de tokens (se disponível)
            usage = response_data.get("usageMetadata", {})
            token_count = usage.get("totalTokenCount")

            # Log estruturado da interação com a IA
            log_ai_request(
                logger=logger,
                title=title,
                resource_type=resource_type,
                latency=latency,
                token_usage=token_count,
                success=True,
            )

            return self._parse_gemini_response(response_data)

        except httpx.HTTPStatusError as e:
            latency = time.perf_counter() - start_time
            log_ai_request(
                logger=logger,
                title=title,
                resource_type=resource_type,
                latency=latency,
                success=False,
            )
            logger.error(f"Erro HTTP da API Gemini: {e.response.status_code} - {e.response.text[:300]}")
            raise ValueError(
                f"Erro na API do Gemini (HTTP {e.response.status_code}). "
                f"Verifique sua GEMINI_API_KEY e tente novamente."
            )

        except httpx.RequestError as e:
            latency = time.perf_counter() - start_time
            log_ai_request(
                logger=logger,
                title=title,
                resource_type=resource_type,
                latency=latency,
                success=False,
            )
            logger.error(f"Erro de conexão com a API Gemini: {str(e)}")
            raise ValueError("Não foi possível conectar à API do Gemini. " "Verifique sua conexão com a internet.")

        except ValueError:
            # Re-raise ValueError do parsing sem encapsular
            raise

        except Exception as e:
            latency = time.perf_counter() - start_time
            log_ai_request(
                logger=logger,
                title=title,
                resource_type=resource_type,
                latency=latency,
                success=False,
            )
            logger.error(f"Erro inesperado no serviço de IA: {str(e)}")
            raise ValueError(f"Erro inesperado ao processar a requisição de IA: {str(e)}")

    @staticmethod
    def _generate_mock_response(title: str, resource_type: str) -> dict[str, Any]:
        """
        Gera uma resposta mock quando a API key não está configurada.

        Este fallback permite que o sistema funcione em modo de demonstração
        sem necessidade de uma chave de API válida. A resposta simula o
        formato exato do Gemini para manter compatibilidade com o frontend.

        Args:
            title: Título do recurso.
            resource_type: Tipo do recurso.

        Returns:
            Dicionário mock com descrição e tags.
        """
        type_descriptions: dict[str, str] = {
            "video": (
                f"Este vídeo educacional sobre '{title}' apresenta os conceitos "
                f"fundamentais do tema de forma dinâmica e acessível. O conteúdo "
                f"é ideal para alunos que buscam compreender a teoria e suas "
                f"aplicações práticas no contexto acadêmico."
            ),
            "pdf": (
                f"Este documento PDF sobre '{title}' oferece uma abordagem "
                f"técnica e aprofundada do assunto. O material inclui definições "
                f"formais, exemplos resolvidos e exercícios propostos para "
                f"fixação do conteúdo."
            ),
            "link": (
                f"Este recurso web sobre '{title}' disponibiliza conteúdo "
                f"interativo e atualizado sobre o tema. O aluno encontrará "
                f"referências complementares e materiais de apoio para "
                f"aprofundar seus estudos."
            ),
        }

        description = type_descriptions.get(
            resource_type, f"Recurso educacional sobre '{title}' com conteúdo relevante para estudantes universitários."
        )

        # Gera tags baseadas no título (palavras significativas)
        stop_words = {"de", "do", "da", "dos", "das", "em", "no", "na", "a", "o", "e", "à", "ao", "para", "com", "por"}
        words = [w.lower() for w in title.split() if w.lower() not in stop_words and len(w) > 2]
        tags = (words[:3] if len(words) >= 3 else words + ["educação", "aprendizado", "estudo"])[:3]

        logger.info(f'Resposta mock gerada para: Title="{title}", Type="{resource_type}"')

        return {"description": description, "tags": tags}