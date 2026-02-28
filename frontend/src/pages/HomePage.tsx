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
 *   - SearchBar com debounce e filtros
 *   - Grid de ResourceCards com animações em cascata
 *   - Pagination com navegação intuitiva
 *   - ResourceForm (modal) para CRUD
 *   - DeleteConfirmModal para exclusão segura
 *   - EmptyState e LoadingSkeleton para feedback visual
 *
 * Integração com anime.js:
 *   O anime.js é utilizado para animações mais complexas que o Framer
 *   Motion não cobre nativamente, como animações de partículas no
 *   background e efeitos de morphing em SVGs. Nesta página, é usado
 *   para animar os orbs decorativos do fundo com trajetórias orgânicas.
 *
 * Arquitetura de Estado:
 *   O estado é gerenciado pelo custom hook useResources, que encapsula
 *   toda a lógica de fetch, paginação e CRUD. A página atua apenas
 *   como "orquestradora" de componentes, delegando lógica ao hook.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import anime from 'animejs/lib/anime.es.js';
import { Plus } from 'lucide-react';
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
   *
   * anime.js opera diretamente no DOM (imperativo), diferente do Framer
   * Motion (declarativo via React). É ideal para animações de background
   * que não dependem do estado do React.
   *
   * A animação usa:
   *   - translateX/translateY: Movimento aleatório em 2D.
   *   - scale: Pulsação suave para efeito de "respiração".
   *   - easing: 'easeInOutSine' para movimento orgânico (senoidal).
   *   - loop: true para animação infinita.
   *   - direction: 'alternate' para ida e volta suave.
   *
   * A física senoidal (easeInOutSine) simula movimento pendular,
   * onde a velocidade é máxima no centro e zero nas extremidades,
   * criando um efeito de flutuação natural.
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

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* ── Orbs Decorativos (Background) ───────────────────────────── */}
      {/*
       * Os orbs são elementos decorativos posicionados absolutamente no
       * fundo da página. Cada orb é um div com gradiente radial e blur,
       * criando manchas de cor suaves que reforçam o tema Glassmorphism.
       *
       * A animação via anime.js faz os orbs flutuarem lentamente,
       * criando um fundo "vivo" sem distrair o conteúdo principal.
       */}
      <div ref={orbsRef} className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="orb absolute top-[10%] left-[15%] w-72 h-72 rounded-full bg-gradient-to-br from-persian-200/30 to-purple-200/20 blur-3xl" />
        <div className="orb absolute top-[60%] right-[10%] w-96 h-96 rounded-full bg-gradient-to-br from-persian-100/20 to-blue-200/15 blur-3xl" />
        <div className="orb absolute bottom-[10%] left-[40%] w-64 h-64 rounded-full bg-gradient-to-br from-purple-200/20 to-persian-100/15 blur-3xl" />
        <div className="orb absolute top-[30%] right-[30%] w-48 h-48 rounded-full bg-gradient-to-br from-persian-200/15 to-pink-200/10 blur-3xl" />
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Header />

      {/* ── Conteúdo Principal ──────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Hero Section ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="text-center mb-10"
        >
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-persian tracking-tight mb-4">
            Seus Recursos
            <span className="bg-gradient-to-r from-persian via-purple-600 to-persian-400 bg-clip-text text-transparent">
              {' '}Educacionais
            </span>
          </h2>
          <p className="text-persian-400 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Gerencie seus materiais didáticos de forma inteligente.
            Use a IA para gerar descrições e categorizar automaticamente.
          </p>
        </motion.div>

        {/* ── Barra de Ações ──────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
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
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleOpenCreate}
            className="btn-persian flex items-center justify-center gap-2 sm:self-start sm:mt-0 whitespace-nowrap"
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
