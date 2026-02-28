/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Serviço de API (Axios)
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Este módulo centraliza todas as chamadas HTTP para o backend FastAPI
 * utilizando Axios. A centralização oferece:
 *
 *   - Base URL configurável: Facilita troca entre ambientes (dev/prod).
 *   - Interceptors: Permite adicionar headers, tokens e logging global.
 *   - Tipagem forte: Cada função retorna tipos TypeScript específicos.
 *   - Tratamento de erros: Erros são padronizados antes de chegar aos componentes.
 *
 * O Axios foi escolhido ao invés do fetch nativo por oferecer:
 *   - Interceptors de request/response
 *   - Cancelamento de requisições (AbortController)
 *   - Transformação automática de JSON
 *   - Timeout configurável
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

// ── Tipos TypeScript ───────────────────────────────────────────────────

/** Tipos válidos de recurso educacional */
export type ResourceType = 'video' | 'pdf' | 'link';

/** Estrutura de um recurso retornado pela API */
export interface Resource {
  id: number;
  title: string;
  description: string;
  resource_type: ResourceType;
  url: string;
  tags: string[];
  created_at: string;
  updated_at: string;
}

/** Dados para criação de um novo recurso */
export interface ResourceCreateData {
  title: string;
  description: string;
  resource_type: ResourceType;
  url: string;
  tags: string[];
}

/** Dados para atualização parcial de um recurso */
export interface ResourceUpdateData {
  title?: string;
  description?: string;
  resource_type?: ResourceType;
  url?: string;
  tags?: string[];
}

/** Resposta paginada genérica */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

/** Requisição para geração com IA */
export interface AIGenerateRequest {
  title: string;
  resource_type: ResourceType;
}

/** Resposta da geração com IA */
export interface AIGenerateResponse {
  description: string;
  tags: string[];
}

/** Parâmetros de listagem com filtros */
export interface ListParams {
  page?: number;
  page_size?: number;
  search?: string;
  resource_type?: string;
}

// ── Instância do Axios ─────────────────────────────────────────────────
/**
 * Cria uma instância configurada do Axios com base URL e timeout.
 *
 * O baseURL aponta para /api/v1, que em desenvolvimento é redirecionado
 * pelo proxy do Vite para http://localhost:8000/api/v1.
 *
 * O timeout de 60 segundos acomoda a latência variável da API do Gemini,
 * que pode levar entre 5-30s dependendo da carga do servidor.
 */
const api: AxiosInstance = axios.create({
  baseURL: `${import.meta.env.VITE_API_URL}/api/v1`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Interceptor de Erro ────────────────────────────────────────────────
/**
 * Interceptor global que padroniza o tratamento de erros.
 *
 * Extrai a mensagem de erro do corpo da resposta (campo `detail` do FastAPI)
 * e a propaga de forma consistente para os componentes React.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail: string }>) => {
    let message: string;

    if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
      message = 'A requisição demorou muito para responder. Tente novamente.';
    } else {
      message =
        error.response?.data?.detail ||
        error.message ||
        'Erro desconhecido ao comunicar com o servidor.';
    }

    console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}: ${message}`);

    return Promise.reject(new Error(message));
  }
);

// ── Funções de API (CRUD) ──────────────────────────────────────────────

/**
 * Lista recursos educacionais com paginação e filtros.
 *
 * @param params - Parâmetros de paginação e filtro.
 * @returns Resposta paginada com lista de recursos.
 */
export const listResources = async (
  params: ListParams = {}
): Promise<PaginatedResponse<Resource>> => {
  const response = await api.get<PaginatedResponse<Resource>>('/resources', {
    params,
  });
  return response.data;
};

/**
 * Busca um recurso específico pelo ID.
 *
 * @param id - ID do recurso.
 * @returns Dados completos do recurso.
 */
export const getResource = async (id: number): Promise<Resource> => {
  const response = await api.get<Resource>(`/resources/${id}`);
  return response.data;
};

/**
 * Cria um novo recurso educacional.
 *
 * @param data - Dados do recurso a ser criado.
 * @returns Recurso criado com ID e timestamps.
 */
export const createResource = async (
  data: ResourceCreateData
): Promise<Resource> => {
  const response = await api.post<Resource>('/resources', data);
  return response.data;
};

/**
 * Atualiza parcialmente um recurso existente.
 *
 * @param id - ID do recurso a ser atualizado.
 * @param data - Campos a serem atualizados.
 * @returns Recurso atualizado.
 */
export const updateResource = async (
  id: number,
  data: ResourceUpdateData
): Promise<Resource> => {
  const response = await api.put<Resource>(`/resources/${id}`, data);
  return response.data;
};

/**
 * Remove permanentemente um recurso.
 *
 * @param id - ID do recurso a ser removido.
 */
export const deleteResource = async (id: number): Promise<void> => {
  await api.delete(`/resources/${id}`);
};

// ── Função de IA (Smart Assist) ────────────────────────────────────────

/**
 * Gera descrição e tags automaticamente via Google Gemini.
 *
 * Esta função é chamada pelo botão "Gerar Descrição com IA" no
 * formulário de cadastro. Envia título e tipo ao backend, que
 * consulta o Gemini e retorna a sugestão.
 *
 * @param data - Título e tipo do recurso.
 * @returns Descrição gerada e 3 tags recomendadas.
 */
export const generateWithAI = async (
  data: AIGenerateRequest
): Promise<AIGenerateResponse> => {
  const response = await api.post<AIGenerateResponse>('/ai/generate', data);
  return response.data;
};

export default api;
