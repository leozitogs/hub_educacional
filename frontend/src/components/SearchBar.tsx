/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: SearchBar
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Barra de busca com filtro por tipo de recurso e debounce integrado.
 *
 * O debounce é implementado via useEffect com setTimeout, evitando
 * que cada keystroke dispare uma requisição ao backend. O delay de
 * 400ms é o sweet spot entre responsividade e economia de requisições.
 *
 * Física da Animação de Foco:
 *   Quando o input recebe foco, a borda muda de cor com uma transição
 *   CSS de 300ms usando ease-out. O ring (outline) aparece com opacity
 *   gradual, criando um "glow" suave ao redor do campo.
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Filter, X } from 'lucide-react';

interface SearchBarProps {
  search: string;
  filterType: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  total: number;
}

export default function SearchBar({
  search,
  filterType,
  onSearchChange,
  onFilterChange,
  total,
}: SearchBarProps) {
  const [localSearch, setLocalSearch] = useState(search);

  /**
   * Debounce da busca:
   * Aguarda 400ms após a última digitação antes de propagar a mudança.
   * Isso evita requisições desnecessárias ao backend durante a digitação.
   *
   * O cleanup function (clearTimeout) cancela o timer anterior a cada
   * nova digitação, garantindo que apenas o último valor seja propagado.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sincroniza estado local quando o pai reseta a busca
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  const typeOptions = [
    { value: '', label: 'Todos os Tipos' },
    { value: 'video', label: '🎬 Vídeos' },
    { value: 'pdf', label: '📄 PDFs' },
    { value: 'link', label: '🔗 Links' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="glass-card !p-4"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* ── Campo de Busca ──────────────────────────────────────── */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-persian-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por título..."
            className="input-glass pl-11 pr-10"
          />
          {/* Botão de limpar busca */}
          {localSearch && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-persian-50 text-persian-400 hover:text-persian-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* ── Filtro por Tipo ─────────────────────────────────────── */}
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-persian-400 pointer-events-none" />
          <select
            value={filterType}
            onChange={(e) => onFilterChange(e.target.value)}
            className="input-glass pl-11 pr-8 cursor-pointer min-w-[180px] appearance-none"
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Contador de Resultados ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-xs text-persian-400 font-medium"
      >
        {total === 0 ? (
          'Nenhum recurso encontrado'
        ) : (
          <>
            <span className="text-persian-600 font-semibold">{total}</span>{' '}
            {total === 1 ? 'recurso encontrado' : 'recursos encontrados'}
            {(search || filterType) && (
              <span className="ml-1">com os filtros aplicados</span>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
