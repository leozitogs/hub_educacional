/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: SearchBar
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Barra de busca com filtro por tipo de recurso e debounce integrado.
 *
 * O debounce é implementado via useEffect com setTimeout, evitando
 * que cada keystroke dispare uma requisição ao backend. O delay de
 * 400ms é o sweet spot entre responsividade e economia de requisições.
 *
 * O filtro de tipo utiliza um dropdown customizado estilizado com
 * ícones coloridos e animações, substituindo o <select> nativo para
 * manter consistência visual com o design system Glassmorphism.
 *
 * Física da Animação de Foco:
 *   Quando o input recebe foco, a borda muda de cor com uma transição
 *   CSS de 300ms usando ease-out. O ring (outline) aparece com opacity
 *   gradual, criando um "glow" suave ao redor do campo.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ChevronDown, Filter, Video, FileText, Link2 } from 'lucide-react';

interface SearchBarProps {
  search: string;
  filterType: string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: string) => void;
  total: number;
}

/** Configuração dos tipos de recurso para o dropdown customizado */
const typeOptions = [
  {
    value: '',
    label: 'Todos os Tipos',
    icon: Filter,
    color: 'text-persian-400',
    bg: 'bg-persian-50',
    borderColor: 'border-persian-100',
  },
  {
    value: 'video',
    label: 'Vídeos',
    icon: Video,
    color: 'text-red-500',
    bg: 'bg-red-50',
    borderColor: 'border-red-200',
  },
  {
    value: 'pdf',
    label: 'PDFs',
    icon: FileText,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    borderColor: 'border-orange-200',
  },
  {
    value: 'link',
    label: 'Links',
    icon: Link2,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    borderColor: 'border-blue-200',
  },
];

export default function SearchBar({
  search,
  filterType,
  onSearchChange,
  onFilterChange,
  total,
}: SearchBarProps) {
  const [localSearch, setLocalSearch] = useState(search);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Debounce da busca:
   * Aguarda 400ms após a última digitação antes de propagar a mudança.
   * Isso evita requisições desnecessárias ao backend durante a digitação.
   *
   * O cleanup function (clearTimeout) cancela o timer anterior a cada
   * nova digitação, garantindo que apenas o último valor seja propagado.
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  // Sincroniza estado local quando o pai reseta a busca
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Obtém a opção selecionada atual
  const selectedOption = typeOptions.find(opt => opt.value === filterType) || typeOptions[0];
  const SelectedIcon = selectedOption.icon;

  /** Seleciona um tipo e fecha o dropdown */
  const handleSelectType = (value: string) => {
    onFilterChange(value);
    setIsDropdownOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1, duration: 0.5 }}
      className="glass-card !p-4"
    >
      <div className="flex flex-col sm:flex-row gap-3">
        {/* ── Campo de Busca ──────────────────────────────────────── */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-persian-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Buscar por título..."
            className="input-glass pl-11 pr-10"
          />
          {/* Botão de limpar busca */}
          {localSearch && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-persian-50 text-persian-400 hover:text-persian-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* ── Filtro por Tipo (Dropdown Customizado) ──────────────── */}
        <div ref={dropdownRef} className="relative">
          {/* Botão do Dropdown */}
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`
              w-full sm:min-w-[200px] px-4 py-3 rounded-2xl
              bg-white/60 backdrop-blur-sm
              border transition-all duration-300 ease-out
              text-persian-800
              flex items-center justify-between gap-3
              hover:border-persian-200
              focus:outline-none focus:ring-2 focus:ring-persian-300/50 focus:border-persian-300 focus:bg-white/80
              ${isDropdownOpen ? 'border-persian-300 bg-white/80 ring-2 ring-persian-300/50' : 'border-persian-100/50'}
            `}
          >
            <div className="flex items-center gap-2.5">
              <div className={`w-7 h-7 rounded-lg ${selectedOption.bg} ${selectedOption.borderColor} border flex items-center justify-center`}>
                <SelectedIcon className={`w-3.5 h-3.5 ${selectedOption.color}`} />
              </div>
              <span className="font-medium text-sm">{selectedOption.label}</span>
            </div>
            <motion.div
              animate={{ rotate: isDropdownOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-persian-400" />
            </motion.div>
          </button>

          {/* Lista de Opções */}
          <AnimatePresence>
            {isDropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-2xl overflow-hidden
                           bg-white/90 backdrop-blur-xl border border-persian-100/50
                           shadow-[0_8px_32px_rgba(39,24,126,0.12)]"
              >
                {typeOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const isSelected = filterType === option.value;

                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelectType(option.value)}
                      className={`
                        w-full px-4 py-2.5 flex items-center gap-2.5
                        transition-all duration-200 ease-out
                        ${isSelected
                          ? 'bg-persian-50/80 border-l-2 border-l-persian'
                          : 'hover:bg-persian-50/40 border-l-2 border-l-transparent'
                        }
                      `}
                    >
                      <div className={`w-7 h-7 rounded-lg ${option.bg} ${option.borderColor} border flex items-center justify-center`}>
                        <OptionIcon className={`w-3.5 h-3.5 ${option.color}`} />
                      </div>
                      <span className={`font-medium text-sm ${isSelected ? 'text-persian' : 'text-persian-700'}`}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="ml-auto w-2 h-2 rounded-full bg-persian"
                        />
                      )}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Contador de Resultados ────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="mt-3 text-xs text-persian-400 font-medium"
      >
        {total === 0 ? (
          'Nenhum recurso encontrado'
        ) : (
          <>
            <span className="text-persian-600 font-semibold">{total}</span>{' '}
            {total === 1 ? 'recurso encontrado' : 'recursos encontrados'}
            {(search || filterType) && (
              <span className="ml-1">com os filtros aplicados</span>
            )}
          </>
        )}
      </motion.div>
    </motion.div>
  );
}
