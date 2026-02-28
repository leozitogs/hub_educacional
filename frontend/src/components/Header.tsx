/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: Header
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Header fixo com efeito Glassmorphism que se torna mais opaco ao rolar.
 * Utiliza Framer Motion para animação de entrada (slide down + fade in).
 *
 * Física da Animação:
 *   A animação de entrada usa spring physics do Framer Motion, que simula
 *   um sistema massa-mola. Os parâmetros stiffness e damping controlam:
 *   - stiffness: "Rigidez" da mola (quanto maior, mais rápido o snap).
 *   - damping: "Amortecimento" (quanto maior, menos bounce).
 *   O resultado é um movimento natural que desacelera suavemente.
 */

import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <motion.header
      /**
       * Animação de entrada: O header desliza de cima (y: -20) para sua
       * posição final (y: 0) enquanto faz fade in (opacity: 0 → 1).
       *
       * O tipo "spring" usa a equação diferencial de um oscilador harmônico
       * amortecido: F = -kx - cv, onde k=stiffness e c=damping.
       * Isso produz um movimento mais orgânico que easing curves lineares.
       */
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="sticky top-0 z-50 liquid-glass border-b border-white/20"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* ── Logo e Título ──────────────────────────────────────── */}
          <motion.div
            className="flex items-center gap-3"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            {/* Ícone com gradiente e animação de flutuação */}
            <div className="relative">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-persian to-persian-400 flex items-center justify-center shadow-persian">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              {/* Indicador de IA ativo (pulsante) */}
              <motion.div
                className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 flex items-center justify-center"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-2.5 h-2.5 text-white" />
              </motion.div>
            </div>

            <div>
              <h1 className="text-lg sm:text-xl font-bold text-persian tracking-tight">
                Hub Educacional
              </h1>
              <p className="text-[10px] sm:text-xs text-persian-400 font-medium tracking-wide">
                Recursos Inteligentes com IA
              </p>
            </div>
          </motion.div>

          {/* ── Badge de Status ────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 backdrop-blur-sm border border-persian-100/30"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-persian-500">
              Gemini AI Ativo
            </span>
          </motion.div>
        </div>
      </div>
    </motion.header>
  );
}
