/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Componente: ResourceForm
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Formulário modal para criação e edição de recursos educacionais.
 * Integra o botão "Gerar Descrição com IA" (Smart Assist) com:
 *
 *   - Loading state animado e sofisticado durante processamento da IA
 *   - Preenchimento automático dos campos com a resposta
 *   - Tratamento elegante de erros e latência
 *   - Animação de entrada/saída do modal (scale + fade)
 *   - Dropdown customizado estilizado para seleção de tipo de recurso
 *
 * Física da Animação do Modal:
 *   O modal utiliza uma combinação de scale e opacity para criar
 *   a ilusão de que emerge do centro da tela. A escala inicial de
 *   0.95 (5% menor) combinada com opacity 0 cria um efeito de
 *   "materialização" suave, inspirado nas transições do macOS.
 *
 *   O backdrop (overlay escuro) usa uma transição de opacity separada
 *   com duração menor, criando uma sequência visual onde o fundo
 *   escurece primeiro e depois o modal aparece.
 */

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, AlertCircle, Plus, ChevronDown, Video, FileText, Link2 } from 'lucide-react';
import { Resource, ResourceCreateData, ResourceUpdateData, ResourceType, generateWithAI } from '../services/api';
import toast from 'react-hot-toast';

interface ResourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ResourceCreateData | ResourceUpdateData) => Promise<void>;
  editingResource?: Resource | null;
}

/** Estado inicial do formulário */
const initialFormState = {
  title: '',
  description: '',
  resource_type: 'video' as ResourceType,
  url: '',
  tags: [] as string[],
};

/** Configuração dos tipos de recurso para o dropdown customizado */
const resourceTypeOptions = [
  {
    value: 'video' as ResourceType,
    label: 'Vídeo',
    icon: Video,
    color: 'text-red-500',
    bg: 'bg-red-50',
    borderColor: 'border-red-200',
    description: 'Vídeo educacional',
  },
  {
    value: 'pdf' as ResourceType,
    label: 'PDF',
    icon: FileText,
    color: 'text-orange-500',
    bg: 'bg-orange-50',
    borderColor: 'border-orange-200',
    description: 'Documento PDF',
  },
  {
    value: 'link' as ResourceType,
    label: 'Link',
    icon: Link2,
    color: 'text-blue-500',
    bg: 'bg-blue-50',
    borderColor: 'border-blue-200',
    description: 'Link/Recurso Web',
  },
];

export default function ResourceForm({ isOpen, onClose, onSubmit, editingResource }: ResourceFormProps) {
  // ── Estado do Formulário ─────────────────────────────────────────────
  const [formData, setFormData] = useState(initialFormState);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isEditing = !!editingResource;

  // ── Preenche o formulário ao editar ──────────────────────────────────
  useEffect(() => {
    if (editingResource) {
      setFormData({
        title: editingResource.title,
        description: editingResource.description,
        resource_type: editingResource.resource_type as ResourceType,
        url: editingResource.url,
        tags: [...editingResource.tags],
      });
    } else {
      setFormData(initialFormState);
    }
    setTagInput('');
    setAiError(null);
    setIsDropdownOpen(false);
  }, [editingResource, isOpen]);

  // ── Foco automático no título ao abrir ───────────────────────────────
  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // ── Fecha o dropdown ao clicar fora ──────────────────────────────────
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

  // ── Handlers de Input ────────────────────────────────────────────────
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  /** Seleciona o tipo de recurso via dropdown customizado */
  const handleSelectType = (type: ResourceType) => {
    setFormData(prev => ({ ...prev, resource_type: type }));
    setIsDropdownOpen(false);
  };

  /** Adiciona uma tag ao pressionar Enter ou vírgula */
  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!formData.tags.includes(newTag) && formData.tags.length < 10) {
        setFormData(prev => ({ ...prev, tags: [...prev.tags, newTag] }));
      }
      setTagInput('');
    }
  };

  /** Remove uma tag pelo índice */
  const handleRemoveTag = (index: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  // ── Smart Assist (Geração com IA) ────────────────────────────────────
  /**
   * Chama o endpoint /api/v1/ai/generate para gerar descrição e tags.
   *
   * O fluxo UX segue estas etapas:
   *   1. Valida que o título foi preenchido (mínimo 3 caracteres).
   *   2. Ativa o loading state animado (isGeneratingAI = true).
   *   3. Envia título e tipo ao backend via API.
   *   4. Preenche automaticamente descrição e tags com a resposta.
   *   5. Exibe toast de sucesso ou erro.
   *   6. Desativa o loading state.
   */
  const handleGenerateAI = async () => {
    if (formData.title.trim().length < 3) {
      toast.error('Digite um título com pelo menos 3 caracteres para gerar com IA.');
      return;
    }

    setIsGeneratingAI(true);
    setAiError(null);

    try {
      const result = await generateWithAI({
        title: formData.title.trim(),
        resource_type: formData.resource_type,
      });

      // Preenche automaticamente os campos com a resposta da IA
      setFormData(prev => ({
        ...prev,
        description: result.description,
        tags: result.tags,
      }));

      toast.success('Descrição e tags geradas com sucesso pela IA!', {
        icon: '✨',
        duration: 4000,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao gerar com IA.';
      setAiError(message);
      toast.error(message, { duration: 5000 });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  // ── Submit do Formulário ─────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      toast.success(isEditing ? 'Recurso atualizado com sucesso!' : 'Recurso criado com sucesso!', {
        icon: isEditing ? '✏️' : '🎉',
      });
      onClose();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao salvar recurso.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Obtém a opção selecionada atual ──────────────────────────────────
  const selectedOption = resourceTypeOptions.find(opt => opt.value === formData.resource_type) || resourceTypeOptions[0];
  const SelectedIcon = selectedOption.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ── Backdrop (Overlay Escuro) ───────────────────────────── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-persian-900/30 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* ── Modal ───────────────────────────────────────────────── */}
          <motion.div
            /**
             * Animação do modal:
             * - Escala de 0.95 → 1.0 cria efeito de "zoom in" sutil.
             * - Opacity 0 → 1 com fade in suave.
             * - Spring com damping=25 evita bounce excessivo.
             *
             * A combinação simula o comportamento de sheets do iOS/macOS,
             * onde o conteúdo parece "emergir" do centro da tela.
             */
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div className="liquid-glass rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto pointer-events-auto scrollbar-thin">
              {/* ── Header do Modal ─────────────────────────────────── */}
              <div className="flex items-center justify-between p-6 pb-4 border-b border-white/20">
                <div>
                  <h2 className="text-xl font-bold text-persian">
                    {isEditing ? 'Editar Recurso' : 'Novo Recurso'}
                  </h2>
                  <p className="text-sm text-persian-400 mt-1">
                    {isEditing
                      ? 'Atualize as informações do recurso educacional.'
                      : 'Cadastre um novo material didático no hub.'}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="p-2 rounded-xl hover:bg-persian-50 text-persian-400 hover:text-persian-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              {/* ── Formulário ──────────────────────────────────────── */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Título */}
                <div>
                  <label className="block text-sm font-semibold text-persian-700 mb-2">
                    Título do Recurso
                  </label>
                  <input
                    ref={titleInputRef}
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Ex: Introdução à Álgebra Linear"
                    className="input-glass"
                    required
                    minLength={3}
                    maxLength={255}
                  />
                </div>

                {/* ── Tipo do Recurso (Dropdown Customizado) ─────────── */}
                <div>
                  <label className="block text-sm font-semibold text-persian-700 mb-2">
                    Tipo do Recurso
                  </label>
                  <div ref={dropdownRef} className="relative">
                    {/* Botão do Dropdown */}
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className={`
                        w-full px-4 py-3 rounded-2xl
                        bg-white/60 backdrop-blur-sm
                        border transition-all duration-300 ease-out
                        text-persian-800
                        flex items-center justify-between gap-3
                        hover:border-persian-200
                        focus:outline-none focus:ring-2 focus:ring-persian-300/50 focus:border-persian-300 focus:bg-white/80
                        ${isDropdownOpen ? 'border-persian-300 bg-white/80 ring-2 ring-persian-300/50' : 'border-persian-100/50'}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl ${selectedOption.bg} ${selectedOption.borderColor} border flex items-center justify-center`}>
                          <SelectedIcon className={`w-4 h-4 ${selectedOption.color}`} />
                        </div>
                        <div className="text-left">
                          <span className="font-medium text-sm">{selectedOption.label}</span>
                          <span className="text-xs text-persian-400 ml-2 hidden sm:inline">{selectedOption.description}</span>
                        </div>
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
                          {resourceTypeOptions.map((option) => {
                            const OptionIcon = option.icon;
                            const isSelected = formData.resource_type === option.value;

                            return (
                              <button
                                key={option.value}
                                type="button"
                                onClick={() => handleSelectType(option.value)}
                                className={`
                                  w-full px-4 py-3 flex items-center gap-3
                                  transition-all duration-200 ease-out
                                  ${isSelected
                                    ? 'bg-persian-50/80 border-l-2 border-l-persian'
                                    : 'hover:bg-persian-50/40 border-l-2 border-l-transparent'
                                  }
                                `}
                              >
                                <div className={`w-8 h-8 rounded-xl ${option.bg} ${option.borderColor} border flex items-center justify-center`}>
                                  <OptionIcon className={`w-4 h-4 ${option.color}`} />
                                </div>
                                <div className="text-left flex-1">
                                  <span className={`font-medium text-sm ${isSelected ? 'text-persian' : 'text-persian-700'}`}>
                                    {option.label}
                                  </span>
                                  <span className="text-xs text-persian-400 ml-2">{option.description}</span>
                                </div>
                                {isSelected && (
                                  <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="w-2 h-2 rounded-full bg-persian"
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

                {/* ── Botão Smart Assist (IA) ──────────────────────── */}
                <div>
                  <motion.button
                    type="button"
                    onClick={handleGenerateAI}
                    disabled={isGeneratingAI || formData.title.trim().length < 3}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      w-full py-3.5 px-6 rounded-2xl font-semibold text-sm
                      flex items-center justify-center gap-3
                      transition-all duration-500 ease-out
                      ${isGeneratingAI
                        ? 'bg-gradient-to-r from-persian-400 via-purple-500 to-persian-400 bg-[length:200%_100%] animate-gradient text-white shadow-persian'
                        : 'bg-gradient-to-r from-persian to-persian-400 text-white hover:shadow-persian disabled:opacity-40 disabled:cursor-not-allowed'
                      }
                    `}
                  >
                    {isGeneratingAI ? (
                      <>
                        {/* ── Loading State Animado e Sofisticado ──── */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                        >
                          <Loader2 className="w-5 h-5" />
                        </motion.div>
                        <motion.span
                          animate={{ opacity: [1, 0.5, 1] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        >
                          Gerando com IA...
                        </motion.span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Gerar Descrição com IA</span>
                      </>
                    )}
                  </motion.button>

                  {/* Mensagem de erro da IA */}
                  <AnimatePresence>
                    {aiError && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: 'auto' }}
                        exit={{ opacity: 0, y: -10, height: 0 }}
                        className="mt-3 flex items-start gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm"
                      >
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                        <span>{aiError}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {formData.title.trim().length < 3 && formData.title.length > 0 && (
                    <p className="mt-2 text-xs text-persian-400">
                      Digite pelo menos 3 caracteres no título para habilitar a IA.
                    </p>
                  )}
                </div>

                {/* Descrição */}
                <div>
                  <label className="block text-sm font-semibold text-persian-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Descreva o conteúdo do recurso educacional..."
                    className="input-glass min-h-[120px] resize-y"
                    required
                    minLength={10}
                    maxLength={5000}
                  />
                </div>

                {/* URL */}
                <div>
                  <label className="block text-sm font-semibold text-persian-700 mb-2">
                    URL do Recurso
                  </label>
                  <input
                    type="url"
                    name="url"
                    value={formData.url}
                    onChange={handleChange}
                    placeholder="https://exemplo.com/recurso"
                    className="input-glass"
                    required
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-semibold text-persian-700 mb-2">
                    Tags
                    <span className="font-normal text-persian-400 ml-2">
                      ({formData.tags.length}/10)
                    </span>
                  </label>

                  {/* Tags existentes */}
                  <AnimatePresence>
                    {formData.tags.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="flex flex-wrap gap-2 mb-3"
                      >
                        {formData.tags.map((tag, index) => (
                          <motion.span
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="tag-badge group/tag cursor-pointer"
                            onClick={() => handleRemoveTag(index)}
                          >
                            #{tag}
                            <X className="w-3 h-3 ml-1 opacity-0 group-hover/tag:opacity-100 transition-opacity" />
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Input de nova tag */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleAddTag}
                      placeholder="Digite uma tag e pressione Enter"
                      className="input-glass flex-1"
                      maxLength={100}
                    />
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (tagInput.trim() && !formData.tags.includes(tagInput.trim().toLowerCase())) {
                          setFormData(prev => ({
                            ...prev,
                            tags: [...prev.tags, tagInput.trim().toLowerCase()],
                          }));
                          setTagInput('');
                        }
                      }}
                      disabled={!tagInput.trim() || formData.tags.length >= 10}
                      className="btn-ghost px-4 disabled:opacity-40"
                    >
                      <Plus className="w-5 h-5" />
                    </motion.button>
                  </div>
                </div>

                {/* ── Botões de Ação ────────────────────────────────── */}
                <div className="flex gap-3 pt-4 border-t border-white/20">
                  <motion.button
                    type="button"
                    onClick={onClose}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-ghost flex-1"
                  >
                    Cancelar
                  </motion.button>

                  <motion.button
                    type="submit"
                    disabled={isSubmitting}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="btn-persian flex-1 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <span>{isEditing ? 'Atualizar Recurso' : 'Criar Recurso'}</span>
                    )}
                  </motion.button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
