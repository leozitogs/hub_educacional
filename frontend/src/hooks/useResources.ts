/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Hook: useResources
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Custom Hook que encapsula toda a lógica de estado e efeitos colaterais
 * relacionados ao CRUD de recursos educacionais.
 *
 * O padrão Custom Hook do React permite:
 *   - Reutilização de lógica stateful entre componentes.
 *   - Separação de concerns (UI vs lógica de dados).
 *   - Testabilidade isolada da lógica de negócio.
 *
 * Este hook gerencia:
 *   - Estado de paginação (page, totalPages)
 *   - Estado de filtros (search, resourceType)
 *   - Estado de loading e erro
 *   - Operações CRUD (fetch, create, update, delete)
 *   - Debounce de busca (evita requisições excessivas)
 */

import { useState, useEffect, useCallback } from 'react';
import {
  listResources,
  createResource,
  updateResource,
  deleteResource,
  Resource,
  ResourceCreateData,
  ResourceUpdateData,
  PaginatedResponse,
} from '../services/api';

interface UseResourcesReturn {
  /** Lista de recursos da página atual */
  resources: Resource[];
  /** Indicador de carregamento */
  loading: boolean;
  /** Mensagem de erro (null se sem erro) */
  error: string | null;
  /** Página atual (1-indexed) */
  page: number;
  /** Total de páginas disponíveis */
  totalPages: number;
  /** Total de registros no banco */
  total: number;
  /** Termo de busca atual */
  search: string;
  /** Filtro de tipo atual */
  filterType: string;
  /** Navega para uma página específica */
  setPage: (page: number) => void;
  /** Define o termo de busca */
  setSearch: (search: string) => void;
  /** Define o filtro de tipo */
  setFilterType: (type: string) => void;
  /** Recarrega a lista de recursos */
  refresh: () => Promise<void>;
  /** Cria um novo recurso */
  handleCreate: (data: ResourceCreateData) => Promise<Resource>;
  /** Atualiza um recurso existente */
  handleUpdate: (id: number, data: ResourceUpdateData) => Promise<Resource>;
  /** Remove um recurso */
  handleDelete: (id: number) => Promise<void>;
}

/**
 * Hook customizado para gerenciamento de recursos educacionais.
 *
 * Implementa o padrão "fetch on mount + refetch on dependency change",
 * onde a lista é recarregada automaticamente quando page, search ou
 * filterType mudam.
 *
 * @param pageSize - Quantidade de itens por página (default: 10).
 * @returns Objeto com estado e funções de manipulação.
 */
export function useResources(pageSize: number = 10): UseResourcesReturn {
  // ── Estado ───────────────────────────────────────────────────────────
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [total, setTotal] = useState<number>(0);
  const [search, setSearch] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('');

  // ── Fetch de Recursos ────────────────────────────────────────────────
  /**
   * Busca recursos da API com os filtros atuais.
   *
   * useCallback memoriza a função para evitar re-criação a cada render,
   * o que causaria loops infinitos no useEffect.
   */
  const fetchResources = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params: Record<string, string | number> = {
        page,
        page_size: pageSize,
      };

      if (search.trim()) {
        params.search = search.trim();
      }

      if (filterType) {
        params.resource_type = filterType;
      }

      const data: PaginatedResponse<Resource> = await listResources(params);

      setResources(data.items);
      setTotalPages(data.total_pages);
      setTotal(data.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao carregar recursos.';
      setError(message);
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, search, filterType]);

  // ── Efeito de Fetch Automático ───────────────────────────────────────
  /**
   * Dispara o fetch sempre que as dependências mudam.
   *
   * O useEffect com array de dependências implementa o padrão
   * "reactive data fetching" — a lista é atualizada automaticamente
   * quando o usuário muda de página, busca ou filtro.
   */
  useEffect(() => {
    fetchResources();
  }, [fetchResources]);

  // ── Reset de página ao mudar filtros ─────────────────────────────────
  /**
   * Quando o usuário muda o termo de busca ou filtro de tipo,
   * volta para a página 1 para evitar páginas vazias.
   */
  const handleSetSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleSetFilterType = useCallback((value: string) => {
    setFilterType(value);
    setPage(1);
  }, []);

  // ── Operações CRUD ───────────────────────────────────────────────────

  const handleCreate = useCallback(async (data: ResourceCreateData): Promise<Resource> => {
    const resource = await createResource(data);
    await fetchResources(); // Recarrega a lista após criação
    return resource;
  }, [fetchResources]);

  const handleUpdate = useCallback(async (id: number, data: ResourceUpdateData): Promise<Resource> => {
    const resource = await updateResource(id, data);
    await fetchResources(); // Recarrega a lista após atualização
    return resource;
  }, [fetchResources]);

  const handleDelete = useCallback(async (id: number): Promise<void> => {
    await deleteResource(id);
    await fetchResources(); // Recarrega a lista após exclusão
  }, [fetchResources]);

  return {
    resources,
    loading,
    error,
    page,
    totalPages,
    total,
    search,
    filterType,
    setPage,
    setSearch: handleSetSearch,
    setFilterType: handleSetFilterType,
    refresh: fetchResources,
    handleCreate,
    handleUpdate,
    handleDelete,
  };
}
