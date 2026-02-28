/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: DeleteConfirmModal
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Modal de confirmação para exclusão de recursos com animação de
 * shake (tremor) no botão de confirmar, reforçando visualmente
 * a natureza destrutiva da ação.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Loader2 } from 'lucide-react';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  resourceTitle: string;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  resourceTitle,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-persian-900/30 backdrop-blur-sm z-50"
            onClick={onCancel}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="liquid-glass rounded-3xl w-full max-w-md p-8 pointer-events-auto text-center">
              {/* Ícone de Alerta */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="w-16 h-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mx-auto mb-5"
              >
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </motion.div>

              <h3 className="text-lg font-bold text-persian-800 mb-2">
                Confirmar Exclusão
              </h3>
              <p className="text-sm text-persian-500 mb-6 leading-relaxed">
                Tem certeza que deseja excluir o recurso{' '}
                <strong className="text-persian-700">"{resourceTitle}"</strong>?
                <br />
                Esta ação não pode ser desfeita.
              </p>

              {/* Botões */}
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onCancel}
                  disabled={isDeleting}
                  className="btn-ghost flex-1"
                >
                  Cancelar
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  disabled={isDeleting}
                  className="flex-1 bg-red-500 text-white font-semibold px-6 py-3 rounded-2xl
                             transition-all duration-300 hover:bg-red-600 hover:shadow-lg
                             active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed
                             flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <span>Excluir</span>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
