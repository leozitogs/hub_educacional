/**
 * ============================================================================
 * Hub Inteligente de Recursos Educacionais - Página: HomePage
 * ============================================================================
 * Autor: Leonardo Gonçalves Sobral - 19 anos
 *        Ciência da Computação - 3° Período
 * ============================================================================
 *
 * Página principal da aplicação que orquestra todos os componentes:
 *   - Header com Glassmorphism
 *   - Hero Section com chamada visual atrativa
 *   - SearchBar com debounce e filtros
 *   - Grid de ResourceCards com animações em cascata
 *   - Pagination com navegação intuitiva
 *   - ResourceForm (modal) para CRUD
 *   - DeleteConfirmModal para exclusão segura
 *   - EmptyState e LoadingSkeleton para feedback visual
 *
 * Arquitetura de Estado:
 *   O estado é gerenciado pelo custom hook useResources, que encapsula
 *   toda a lógica de fetch, paginação e CRUD. A página atua apenas
 *   como "orquestradora" de componentes, delegando lógica ao hook.
 *
 * Otimização de Performance:
 *   - Animações de orbs simplificadas com CSS puro (sem anime.js no loop)
 *   - will-change aplicado em elementos animados para GPU acceleration
 *   - Redução de re-renders com useCallback e useMemo
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import anime from 'animejs/lib/anime.es.js';
import { Plus, Sparkles, BookOpen, Zap, Brain } from 'lucide-react';
import toast from 'react-hot-toast';

import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import ResourceCard from '../components/ResourceCard';
import ResourceForm from '../components/ResourceForm';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useResources } from '../hooks/useResources';
import { Resource, ResourceCreateData, ResourceUpdateData } from '../services/api';

export default function HomePage() {
  // ── Estado do Hook de Recursos ───────────────────────────────────────
  const {
    resources,
    loading,
    error,
    page,
    totalPages,
    total,
    search,
    filterType,
    setPage,
    setSearch,
    setFilterType,
    handleCreate,
    handleUpdate,
    handleDelete,
  } = useResources(9); // 9 itens por página (grid 3x3)

  // ── Estado do Modal ──────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  // ── Ref para animação anime.js dos orbs de fundo ─────────────────────
  const orbsRef = useRef<HTMLDivElement>(null);

  // ── Animação anime.js dos Orbs Decorativos ───────────────────────────
  /**
   * Utiliza anime.js para criar animações de orbs flutuantes no fundo.
   * Animação executada apenas uma vez no mount para evitar re-renders.
   */
  useEffect(() => {
    if (orbsRef.current) {
      const orbs = orbsRef.current.querySelectorAll('.orb');

      anime({
        targets: orbs,
        translateX: () => anime.random(-30, 30),
        translateY: () => anime.random(-30, 30),
        scale: () => [1, anime.random(10, 12) / 10],
        opacity: () => [0.3, anime.random(4, 7) / 10],
        easing: 'easeInOutSine',
        duration: () => anime.random(4000, 8000),
        loop: true,
        direction: 'alternate',
        delay: (_el: Element, i: number) => i * 500,
      });
    }
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────

  const handleOpenCreate = useCallback(() => {
    setEditingResource(null);
    setIsFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback((resource: Resource) => {
    setEditingResource(resource);
    setIsFormOpen(true);
  }, []);

  const handleFormSubmit = useCallback(async (data: ResourceCreateData | ResourceUpdateData) => {
    if (editingResource) {
      await handleUpdate(editingResource.id, data as ResourceUpdateData);
    } else {
      await handleCreate(data as ResourceCreateData);
    }
  }, [editingResource, handleUpdate, handleCreate]);

  const handleConfirmDelete = useCallback(async () => {
    if (deleteTarget) {
      await handleDelete(deleteTarget.id);
      toast.success('Recurso excluído com sucesso!', { icon: '🗑️' });
      setDeleteTarget(null);
    }
  }, [deleteTarget, handleDelete]);

  // ── Features para o Hero Section ─────────────────────────────────────
  const heroFeatures = useMemo(() => [
    {
      icon: Brain,
      title: 'IA Integrada',
      description: 'Gere descrições pedagógicas automaticamente com Google Gemini',
    },
    {
      icon: Zap,
      title: 'Organização Inteligente',
      description: 'Categorize e encontre recursos com tags e filtros avançados',
    },
    {
      icon: BookOpen,
      title: 'Curadoria Simplificada',
      description: 'Cadastre vídeos, PDFs e links em um hub centralizado',
    },
  ], []);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* ── Orbs Decorativos (Background) ───────────────────────────── */}
      <div ref={orbsRef} className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="orb absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-gradient-to-br from-persian-200/30 to-purple-200/20 blur-3xl will-change-transform" />
        <div className="orb absolute top-[60%] right-[10%] w-96 h-96 rounded-full bg-gradient-to-br from-persian-100/20 to-blue-200/15 blur-3xl will-change-transform" />
        <div className="orb absolute bottom-[10%] left-[40%] w-64 h-64 rounded-full bg-gradient-to-br from-purple-200/20 to-persian-100/15 blur-3xl will-change-transform" />
        <div className="orb absolute top-[30%] right-[30%] w-48 h-48 rounded-full bg-gradient-to-br from-persian-200/15 to-pink-200/10 blur-3xl will-change-transform" />
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Header />

      {/* ── Hero Section ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradiente decorativo do Hero */}
        <div className="absolute inset-0 bg-gradient-to-b from-persian/[0.03] via-transparent to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 lg:pt-16 pb-8 sm:pb-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="text-center mb-8 sm:mb-10 lg:mb-12"
          >
            {/* Badge de destaque */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-persian-50/80 border border-persian-100/50 backdrop-blur-sm mb-6"
            >
              <Sparkles className="w-4 h-4 text-persian" />
              <span className="text-xs sm:text-sm font-medium text-persian-600">
                Potencializado por Inteligência Artificial
              </span>
            </motion.div>

            {/* Título Principal */}
            <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-persian tracking-tight mb-4 sm:mb-6">
              Seus Recursos
              <span className="bg-gradient-to-r from-persian via-purple-600 to-persian-400 bg-clip-text text-transparent">
                {' '}Educacionais
              </span>
            </h2>

            {/* Subtítulo */}
            <p className="text-persian-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Gerencie seus materiais didáticos de forma inteligente.
              Use a IA para gerar descrições e categorizar automaticamente.
            </p>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {heroFeatures.map((feature, index) => {
                const FeatureIcon = feature.icon;
                return (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 transition-all duration-300"
                  >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-persian/10 to-purple-500/10 border border-persian-100/30 flex items-center justify-center">
                      <FeatureIcon className="w-5 h-5 text-persian" />
                    </div>
                    <h3 className="text-sm font-semibold text-persian-700">{feature.title}</h3>
                    <p className="text-xs text-persian-400 leading-relaxed">{feature.description}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Conteúdo Principal ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {/* ── Barra de Ações ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6 items-stretch sm:items-start">
          <div className="flex-1">
            <SearchBar
              search={search}
              filterType={filterType}
              onSearchChange={setSearch}
              onFilterChange={setFilterType}
              total={total}
            />
          </div>

          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleOpenCreate}
            className="btn-persian flex items-center justify-center gap-2 whitespace-nowrap sm:self-start sm:px-6 sm:py-3.5"
          >
            <Plus className="w-5 h-5" />
            <span>Novo Recurso</span>
          </motion.button>
        </div>

        {/* ── Mensagem de Erro ────────────────────────────────────── */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-sm"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Grid de Recursos ────────────────────────────────────── */}
        {loading ? (
          <LoadingSkeleton />
        ) : resources.length === 0 ? (
          <EmptyState isSearch={!!(search || filterType)} searchTerm={search} />
        ) : (
          <>
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {resources.map((resource, index) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    index={index}
                    onEdit={handleOpenEdit}
                    onDelete={(id) => setDeleteTarget({ id, title: resource.title })}
                  />
                ))}
              </AnimatePresence>
            </motion.div>

            {/* ── Paginação ─────────────────────────────────────────── */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-center py-8 text-xs text-persian-400"
      >
        <p>
          Desenvolvido por{' '}
          <strong className="text-persian-600">Leonardo Gonçalves Sobral</strong>
          {' '}— Ciência da Computação, 3° Período
        </p>
        <p className="mt-1 text-persian-300">
          Hub Inteligente de Recursos Educacionais &copy; {new Date().getFullYear()}
        </p>
      </motion.footer>

      {/* ── Modais ──────────────────────────────────────────────────── */}
      <ResourceForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingResource(null);
        }}
        onSubmit={handleFormSubmit}
        editingResource={editingResource}
      />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        resourceTitle={deleteTarget?.title || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
