/// <reference types="vite/client" />

/**
 * Declaração de módulo para anime.js (sem tipos nativos).
 * Permite importar o anime.js sem erros de TypeScript.
 */
declare module 'animejs/lib/anime.es.js' {
  import anime from 'animejs';
  export default anime;
}
