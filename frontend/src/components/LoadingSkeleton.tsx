/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: LoadingSkeleton
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Skeleton loader com efeito shimmer para feedback visual durante
 * carregamento de dados. O shimmer simula um reflexo de luz passando
 * pela superfície, indicando atividade sem usar spinners tradicionais.
 *
 * Física do Shimmer:
 *   O efeito é criado com um gradiente linear animado via CSS.
 *   O gradiente tem três stops (escuro → claro → escuro) e se move
 *   horizontalmente de -200% a 200%, criando a ilusão de uma faixa
 *   de luz passando pela superfície do placeholder.
 *
 *   A animação usa timing linear (sem easing) para manter velocidade
 *   constante, simulando um reflexo de luz natural.
 */

import { motion } from 'framer-motion';

export default function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.1 }}
          className="glass-card"
        >
          {/* Header skeleton */}
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl shimmer" />
            <div className="flex-1">
              <div className="h-5 w-3/4 rounded-lg shimmer mb-2" />
              <div className="h-3 w-1/3 rounded-lg shimmer" />
            </div>
          </div>

          {/* Description skeleton */}
          <div className="space-y-2 mb-4">
            <div className="h-3 w-full rounded-lg shimmer" />
            <div className="h-3 w-5/6 rounded-lg shimmer" />
            <div className="h-3 w-4/6 rounded-lg shimmer" />
          </div>

          {/* Tags skeleton */}
          <div className="flex gap-2 mb-4">
            <div className="h-6 w-16 rounded-full shimmer" />
            <div className="h-6 w-20 rounded-full shimmer" />
            <div className="h-6 w-14 rounded-full shimmer" />
          </div>

          {/* Link skeleton */}
          <div className="h-4 w-32 rounded-lg shimmer" />
        </motion.div>
      ))}
    </div>
  );
}
