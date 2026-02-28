/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Configuração do Tailwind CSS
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Paleta de cores principal:
 *   - Ghost (#F7F7FF): Branco espectral com leve tom azulado, usado como
 *     cor de fundo principal. Transmite limpeza e modernidade.
 *   - Persian (#27187E): Azul-índigo profundo, usado como cor de destaque.
 *     Transmite confiança, intelectualidade e sofisticação.
 *
 * Design System:
 *   - Glassmorphism: Efeito de vidro fosco com backdrop-blur e transparência.
 *   - Liquid Glass: Variação do glassmorphism com bordas suaves e gradientes.
 *   - Inspiração Apple: Tipografia limpa, espaçamento generoso, cantos arredondados.
 */

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Paleta de Cores Customizada ──────────────────────────────────
      colors: {
        ghost: {
          DEFAULT: '#F7F7FF',
          50: '#FFFFFF',
          100: '#F7F7FF',
          200: '#EDEDFA',
          300: '#DCDCF5',
          400: '#C8C8EE',
          500: '#B0B0E5',
        },
        persian: {
          DEFAULT: '#27187E',
          50: '#E8E6F5',
          100: '#D1CDEB',
          200: '#A39BD7',
          300: '#7569C3',
          400: '#4E3FA6',
          500: '#27187E',
          600: '#201367',
          700: '#190F50',
          800: '#120A39',
          900: '#0B0622',
        },
      },
      // ── Tipografia (Inspiração Apple) ────────────────────────────────
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        display: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'sans-serif',
        ],
      },
      // ── Efeitos de Glassmorphism ─────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      // ── Box Shadows para Profundidade (Apple-like) ───────────────────
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(39, 24, 126, 0.08)',
        'glass-lg': '0 16px 48px 0 rgba(39, 24, 126, 0.12)',
        'glass-xl': '0 24px 64px 0 rgba(39, 24, 126, 0.16)',
        'inner-glass': 'inset 0 1px 0 0 rgba(255, 255, 255, 0.5)',
        'persian': '0 4px 24px 0 rgba(39, 24, 126, 0.25)',
      },
      // ── Animações Customizadas ───────────────────────────────────────
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'gradient': 'gradient 8s ease infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        gradient: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
      },
      // ── Border Radius (Apple-like) ───────────────────────────────────
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
    },
  },
  plugins: [],
}
