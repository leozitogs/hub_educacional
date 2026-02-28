/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: ResourceCard
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Card individual de recurso educacional com:
 *   - Glassmorphism e Liquid Glass
 *   - Animação de entrada em cascata (stagger)
 *   - Microinterações no hover (scale, shadow, translateY)
 *   - Ícones dinâmicos por tipo de recurso
 *   - Badges de tags com estilo pill
 *
 * Física das Animações em Cascata (Stagger):
 *   O efeito cascata é criado pelo delay incremental: cada card recebe
 *   um delay = index * 0.08s. Isso cria uma "onda" visual onde os cards
 *   aparecem sequencialmente de cima para baixo.
 *
 *   A curva de easing "easeOut" (cubic-bezier(0, 0, 0.58, 1)) faz com
 *   que o movimento comece rápido e desacelere, simulando a física de
 *   um objeto que encontra resistência do ar.
 */

import { motion } from 'framer-motion';
import { Video, FileText, Link2, ExternalLink, Pencil, Trash2, Calendar } from 'lucide-react';
import { Resource } from '../services/api';

interface ResourceCardProps {
  resource: Resource;
  index: number;
  onEdit: (resource: Resource) => void;
  onDelete: (id: number) => void;
}

/**
 * Mapeamento de tipos de recurso para ícones e cores.
 *
 * Cada tipo possui um ícone Lucide, uma cor de fundo para o badge
 * e uma cor de texto, criando diferenciação visual instantânea.
 */
const typeConfig: Record<string, { icon: typeof Video; color: string; bg: string; label: string }> = {
  video: {
    icon: Video,
    color: 'text-red-600',
    bg: 'bg-red-50 border-red-100',
    label: 'Vídeo',
  },
  pdf: {
    icon: FileText,
    color: 'text-orange-600',
    bg: 'bg-orange-50 border-orange-100',
    label: 'PDF',
  },
  link: {
    icon: Link2,
    color: 'text-blue-600',
    bg: 'bg-blue-50 border-blue-100',
    label: 'Link',
  },
};

export default function ResourceCard({ resource, index, onEdit, onDelete }: ResourceCardProps) {
  const config = typeConfig[resource.resource_type] || typeConfig.link;
  const TypeIcon = config.icon;

  /**
   * Formata a data de criação para exibição amigável.
   * Utiliza Intl.DateTimeFormat para localização automática (pt-BR).
   */
  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
  <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20, transition: { duration: 0.3 } }}
        // Unificamos as transições aqui
        transition={{
          duration: 0.5,
          delay: index * 0.08,
          ease: [0, 0, 0.58, 1],
          // Adicionamos as configurações de spring como default para gestos (hover/tap)
          type: 'spring', 
          stiffness: 400, 
          damping: 25 
        }}
        whileHover={{ y: -4 }}
        className="glass-card group"
        layout
        layoutId={`resource-${resource.id}`}
      >
      {/* ── Header do Card ──────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Badge de tipo com ícone */}
          <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${config.bg} border flex items-center justify-center`}>
            <TypeIcon className={`w-5 h-5 ${config.color}`} />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-persian-800 text-base leading-tight truncate group-hover:text-persian transition-colors duration-300">
              {resource.title}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.bg} ${config.color} border`}>
                {config.label}
              </span>
              <span className="text-xs text-persian-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(resource.created_at)}
              </span>
            </div>
          </div>
        </div>

        {/* ── Botões de Ação ──────────────────────────────────────── */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onEdit(resource)}
            className="p-2 rounded-xl hover:bg-persian-50 text-persian-400 hover:text-persian-600 transition-colors"
            title="Editar recurso"
          >
            <Pencil className="w-4 h-4" />
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onDelete(resource.id)}
            className="p-2 rounded-xl hover:bg-red-50 text-persian-400 hover:text-red-500 transition-colors"
            title="Excluir recurso"
          >
            <Trash2 className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* ── Descrição ───────────────────────────────────────────────── */}
      <p className="text-sm text-persian-600 leading-relaxed mb-4 line-clamp-3">
        {resource.description}
      </p>

      {/* ── Tags ────────────────────────────────────────────────────── */}
      {resource.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {resource.tags.map((tag, i) => (
            <motion.span
              key={tag}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.08 + i * 0.05 }}
              className="tag-badge"
            >
              #{tag}
            </motion.span>
          ))}
        </div>
      )}

      {/* ── Link de Acesso ──────────────────────────────────────────── */}
      <motion.a
        href={resource.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 text-sm font-medium text-persian hover:text-persian-400 transition-colors duration-300 group/link"
        whileHover={{ x: 4 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <ExternalLink className="w-4 h-4" />
        <span>Acessar recurso</span>
        <motion.span
          className="opacity-0 group-hover/link:opacity-100 transition-opacity"
          initial={{ x: -4 }}
          whileHover={{ x: 0 }}
        >
          →
        </motion.span>
      </motion.a>
    </motion.div>
  );
}
