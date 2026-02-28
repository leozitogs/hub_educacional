/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: EmptyState
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Componente exibido quando não há recursos cadastrados ou quando
 * uma busca não retorna resultados. Utiliza animação de flutuação
 * (float) para tornar o estado vazio mais amigável e menos "frio".
 */

import { motion } from 'framer-motion';
import { BookOpen, Search } from 'lucide-react';

interface EmptyStateProps {
  isSearch?: boolean;
  searchTerm?: string;
}

export default function EmptyState({ isSearch = false, searchTerm }: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="flex flex-col items-center justify-center py-20 px-4"
    >
      {/* Ícone animado com flutuação */}
      <motion.div
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-3xl bg-gradient-to-br from-persian-50 to-persian-100 border border-persian-100 flex items-center justify-center mb-6"
      >
        {isSearch ? (
          <Search className="w-10 h-10 text-persian-300" />
        ) : (
          <BookOpen className="w-10 h-10 text-persian-300" />
        )}
      </motion.div>

      <h3 className="text-xl font-bold text-persian-700 mb-2">
        {isSearch ? 'Nenhum resultado encontrado' : 'Nenhum recurso cadastrado'}
      </h3>

      <p className="text-sm text-persian-400 text-center max-w-md leading-relaxed">
        {isSearch ? (
          <>
            Não encontramos recursos para "<strong className="text-persian-600">{searchTerm}</strong>".
            Tente ajustar os filtros ou termos de busca.
          </>
        ) : (
          <>
            Comece cadastrando seu primeiro recurso educacional.
            Use o botão <strong className="text-persian-600">"Novo Recurso"</strong> acima
            e aproveite a IA para gerar descrições automaticamente!
          </>
        )}
      </p>
    </motion.div>
  );
}
