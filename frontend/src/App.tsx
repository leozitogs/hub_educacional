/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente Raiz (App)
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Componente raiz da aplicação React que configura:
 *   - React Router para navegação SPA (Single Page Application)
 *   - React Hot Toast para notificações globais
 *   - AnimatePresence para transições de rota cinematográficas
 *
 * Transição de Rotas:
 *   O AnimatePresence do Framer Motion detecta quando componentes
 *   são montados/desmontados e executa animações de saída antes
 *   da remoção do DOM. Isso permite transições suaves entre páginas
 *   sem a necessidade de bibliotecas adicionais de transição.
 */

import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';

/**
 * Wrapper de rotas com AnimatePresence para transições.
 *
 * O useLocation() fornece a key única para cada rota, permitindo
 * que o AnimatePresence detecte mudanças de página e execute
 * animações de entrada/saída.
 */
function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* ── Notificações Globais (Toast) ────────────────────────────── */}
      {/*
       * O Toaster é configurado com estilo Glassmorphism para manter
       * consistência visual. A posição top-right é a convenção mais
       * comum para notificações em aplicações web.
       */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            borderRadius: '16px',
            color: '#27187E',
            fontSize: '14px',
            fontWeight: '500',
            boxShadow: '0 8px 32px rgba(39, 24, 126, 0.1)',
            padding: '12px 16px',
          },
          success: {
            iconTheme: {
              primary: '#27187E',
              secondary: '#F7F7FF',
            },
          },
          error: {
            iconTheme: {
              primary: '#EF4444',
              secondary: '#FEF2F2',
            },
          },
        }}
      />

      {/* ── Rotas Animadas ──────────────────────────────────────────── */}
      <AnimatedRoutes />
    </BrowserRouter>
  );
}
