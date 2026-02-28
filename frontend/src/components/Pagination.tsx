/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: Pagination
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Componente de paginação com design Glassmorphism e microinterações.
 * Implementa navegação por páginas com indicador visual da página ativa
 * e botões de anterior/próximo.
 *
 * O algoritmo de geração de páginas visíveis usa uma janela deslizante
 * centrada na página atual, com elipses (...) para indicar páginas
 * omitidas. Isso mantém o componente compacto mesmo com centenas de páginas.
 */

import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  /**
   * Gera o array de páginas visíveis com elipses.
   *
   * Algoritmo:
   *   1. Sempre mostra a primeira e última página.
   *   2. Mostra uma janela de ±1 ao redor da página atual.
   *   3. Insere '...' onde há gaps entre páginas consecutivas.
   *
   * Exemplo para page=5, totalPages=10:
   *   [1, '...', 4, 5, 6, '...', 10]
   */
  const getVisiblePages = (): (number | string)[] => {
    const pages: (number | string)[] = [];
    const delta = 1; // Janela de páginas ao redor da atual

    const rangeStart = Math.max(2, page - delta);
    const rangeEnd = Math.min(totalPages - 1, page + delta);

    // Primeira página (sempre visível)
    pages.push(1);

    // Elipse antes da janela
    if (rangeStart > 2) {
      pages.push('...');
    }

    // Janela ao redor da página atual
    for (let i = rangeStart; i <= rangeEnd; i++) {
      pages.push(i);
    }

    // Elipse depois da janela
    if (rangeEnd < totalPages - 1) {
      pages.push('...');
    }

    // Última página (sempre visível, se > 1)
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5 }}
      className="flex items-center justify-center gap-2 mt-8"
      aria-label="Paginação"
    >
      {/* Botão Anterior */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="p-2.5 rounded-xl glass hover:bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
        aria-label="Página anterior"
      >
        <ChevronLeft className="w-4 h-4 text-persian-600" />
      </motion.button>

      {/* Números de Página */}
      <div className="flex items-center gap-1.5">
        {getVisiblePages().map((pageNum, index) => (
          pageNum === '...' ? (
            <span key={`ellipsis-${index}`} className="px-2 text-persian-400 text-sm">
              ...
            </span>
          ) : (
            <motion.button
              key={pageNum}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onPageChange(pageNum as number)}
              className={`
                w-10 h-10 rounded-xl text-sm font-semibold
                transition-all duration-300
                ${page === pageNum
                  ? 'bg-persian text-white shadow-persian'
                  : 'glass text-persian-600 hover:bg-white/80'
                }
              `}
              /**
               * Layout animation: Quando a página ativa muda, o Framer Motion
               * anima suavemente a transição do indicador (cor de fundo),
               * criando um efeito de "sliding indicator" similar ao iOS.
               */
              layout
            >
              {pageNum}
            </motion.button>
          )
        ))}
      </div>

      {/* Botão Próximo */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="p-2.5 rounded-xl glass hover:bg-white/80 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-300"
        aria-label="Próxima página"
      >
        <ChevronRight className="w-4 h-4 text-persian-600" />
      </motion.button>
    </motion.nav>
  );
}
