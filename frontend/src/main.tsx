/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Entry Point (React)
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Ponto de entrada da aplicação React. Monta o componente App no
 * elemento #root do index.html utilizando createRoot (React 18+).
 *
 * O StrictMode ativa verificações adicionais em desenvolvimento:
 *   - Detecta efeitos colaterais impuros em componentes.
 *   - Alerta sobre APIs deprecadas.
 *   - Executa efeitos duas vezes para detectar bugs de cleanup.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles/globals.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
