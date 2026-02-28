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
 *   - Hero Section premium com partículas, typing effect e animações 3D
 *   - SearchBar com debounce e filtros
 *   - Grid de ResourceCards com animações em cascata
 *   - Pagination com navegação intuitiva
 *   - ResourceForm (modal) para CRUD
 *   - DeleteConfirmModal para exclusão segura
 *   - EmptyState e LoadingSkeleton para feedback visual
 *
 * Diferenciais de Animação:
 *   - Partículas flutuantes com física de movimento browniano
 *   - Efeito de digitação (typewriter) no título principal
 *   - Cards de features com hover 3D (perspective + rotateX/Y)
 *   - Scroll-triggered animations via Intersection Observer
 *   - Orbs com gradiente animado e parallax sutil
 *   - Contadores numéricos animados nas stats
 *   - Micro-interações em todos os elementos interativos
 */

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform, useInView } from 'framer-motion';
import anime from 'animejs/lib/anime.es.js';
import {
  Plus, Sparkles, BookOpen, Zap, Brain, ArrowRight,
  GraduationCap, Layers, Search as SearchIcon, Star,
  TrendingUp, Shield
} from 'lucide-react';
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

// ── Componente: Partículas Flutuantes ──────────────────────────────────
/**
 * Gera partículas decorativas que flutuam pelo Hero Section.
 * Cada partícula tem posição, tamanho, opacidade e velocidade aleatórios,
 * criando um efeito de "poeira estelar" que adiciona profundidade visual.
 */
function FloatingParticles() {
  const particles = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 15 + 10,
      delay: Math.random() * 5,
      opacity: Math.random() * 0.4 + 0.1,
    })),
  []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-persian/20"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [p.opacity, p.opacity * 2, p.opacity],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// ── Componente: Typewriter Effect ──────────────────────────────────────
/**
 * Efeito de digitação (typewriter) que revela o texto caractere por caractere.
 * Utiliza um intervalo de tempo para adicionar cada caractere, simulando
 * uma máquina de escrever digital.
 */
function TypewriterText({ text, className, delay = 0 }: { text: string; className?: string; delay?: number }) {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!started) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index <= text.length) {
        setDisplayText(text.slice(0, index));
        index++;
      } else {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [text, started]);

  return (
    <span className={className}>
      {displayText}
      {started && displayText.length < text.length && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          className="inline-block w-[3px] h-[1em] bg-persian ml-0.5 align-middle"
        />
      )}
    </span>
  );
}

// ── Componente: Feature Card 3D ────────────────────────────────────────
/**
 * Card de feature com efeito de hover 3D usando perspective e rotação.
 * O mouse tracking calcula a posição relativa do cursor sobre o card
 * e aplica rotação proporcional nos eixos X e Y, criando um efeito
 * de inclinação tridimensional realista.
 */
function FeatureCard3D({
  icon: Icon,
  title,
  description,
  gradient,
  index,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(cardRef, { once: true, margin: '-50px' });
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.15 + index * 0.12, duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{ perspective: 800 }}
    >
      <motion.div
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className="relative group cursor-default"
      >
        {/* Glow effect on hover */}
        <div className={`absolute -inset-0.5 rounded-3xl ${gradient} opacity-0 group-hover:opacity-100 blur-lg transition-opacity duration-500`} />

        <div className="relative flex flex-col items-center gap-4 p-6 sm:p-8 rounded-3xl bg-white/50 backdrop-blur-sm border border-white/40 hover:bg-white/70 transition-all duration-500 overflow-hidden">
          {/* Decorative corner accent */}
          <div className={`absolute top-0 right-0 w-24 h-24 ${gradient} opacity-[0.07] rounded-bl-[60px]`} />

          {/* Icon container with animated ring */}
          <div className="relative">
            <motion.div
              className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}
              whileHover={{ rotate: [0, -5, 5, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-7 h-7 text-white" />
            </motion.div>
            {/* Animated ring */}
            <motion.div
              className={`absolute -inset-2 rounded-2xl border-2 border-dashed opacity-0 group-hover:opacity-30 ${gradient.includes('persian') ? 'border-persian' : gradient.includes('purple') ? 'border-purple-500' : 'border-blue-500'}`}
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          <h3 className="text-base font-bold text-persian-700 tracking-tight">{title}</h3>
          <p className="text-sm text-persian-400 leading-relaxed text-center">{description}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Componente: Animated Counter ───────────────────────────────────────
/**
 * Contador numérico animado que incrementa de 0 ao valor final.
 * Utiliza requestAnimationFrame para animação suave a 60fps.
 */
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const duration = 1500;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Easing: easeOutExpo
      const eased = 1 - Math.pow(2, -10 * progress);
      start = Math.floor(eased * value);
      setCount(start);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [isInView, value]);

  return <span ref={ref}>{count}{suffix}</span>;
}

// ── Componente: Scroll Section ─────────────────────────────────────────
/**
 * Wrapper que aplica animação de entrada quando o elemento entra no viewport.
 * Usa Intersection Observer via useInView do Framer Motion.
 */
function ScrollReveal({ children, className = '', delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}


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
  } = useResources(9);

  // ── Estado do Modal ──────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null);

  // ── Ref para animação anime.js dos orbs de fundo ─────────────────────
  const orbsRef = useRef<HTMLDivElement>(null);

  // ── Animação anime.js dos Orbs Decorativos ───────────────────────────
  useEffect(() => {
    if (orbsRef.current) {
      const orbs = orbsRef.current.querySelectorAll('.orb');

      anime({
        targets: orbs,
        translateX: () => anime.random(-40, 40),
        translateY: () => anime.random(-40, 40),
        scale: () => [1, anime.random(10, 13) / 10],
        opacity: () => [0.2, anime.random(3, 6) / 10],
        easing: 'easeInOutSine',
        duration: () => anime.random(5000, 10000),
        loop: true,
        direction: 'alternate',
        delay: (_el: Element, i: number) => i * 600,
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
      gradient: 'from-persian/30 to-purple-500/30',
    },
    {
      icon: Zap,
      title: 'Organização Inteligente',
      description: 'Categorize e encontre recursos com tags e filtros avançados',
      gradient: 'from-purple-500/30 to-blue-500/30',
    },
    {
      icon: BookOpen,
      title: 'Curadoria Simplificada',
      description: 'Cadastre vídeos, PDFs e links em um hub centralizado',
      gradient: 'from-blue-500/30 to-persian/30',
    },
  ], []);

  // ── Stats para o Hero ─────────────────────────────────────────────────
  const stats = useMemo(() => [
    { icon: Layers, value: 3, suffix: '', label: 'Tipos de Recurso' },
    { icon: Star, value: 100, suffix: '%', label: 'Gratuito' },
    { icon: TrendingUp, value: 10, suffix: 'x', label: 'Mais Produtivo' },
    { icon: Shield, value: 99, suffix: '%', label: 'Disponibilidade' },
  ], []);

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* ── Orbs Decorativos (Background) ───────────────────────────── */}
      <div ref={orbsRef} className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="orb absolute top-[5%] left-[10%] w-80 h-80 rounded-full bg-gradient-to-br from-persian-200/25 to-purple-300/15 blur-3xl will-change-transform" />
        <div className="orb absolute top-[50%] right-[5%] w-[28rem] h-[28rem] rounded-full bg-gradient-to-br from-persian-100/15 to-blue-300/10 blur-3xl will-change-transform" />
        <div className="orb absolute bottom-[5%] left-[35%] w-72 h-72 rounded-full bg-gradient-to-br from-purple-200/15 to-persian-100/10 blur-3xl will-change-transform" />
        <div className="orb absolute top-[25%] right-[25%] w-56 h-56 rounded-full bg-gradient-to-br from-persian-200/10 to-pink-200/10 blur-3xl will-change-transform" />
        <div className="orb absolute top-[70%] left-[5%] w-48 h-48 rounded-full bg-gradient-to-br from-blue-200/10 to-persian-100/10 blur-3xl will-change-transform" />
      </div>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <Header />

      {/* ── Hero Section Premium ────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Gradient mesh background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-persian/[0.04] via-transparent to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-radial from-persian/[0.06] to-transparent rounded-full blur-3xl" />
        </div>

        {/* Floating particles */}
        <FloatingParticles />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-16 lg:pt-20 pb-6 sm:pb-8 relative">
          <div className="text-center mb-10 sm:mb-14 lg:mb-16">
            {/* Badge de destaque com animação de entrada */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-gradient-to-r from-persian-50/90 to-purple-50/90 border border-persian-100/40 backdrop-blur-sm mb-8 shadow-sm"
            >
              <motion.div
                animate={{ rotate: [0, 15, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <Sparkles className="w-4 h-4 text-persian" />
              </motion.div>
              <span className="text-xs sm:text-sm font-semibold bg-gradient-to-r from-persian to-purple-600 bg-clip-text text-transparent">
                Potencializado por Inteligência Artificial
              </span>
              <motion.div
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-2 h-2 rounded-full bg-green-400"
              />
            </motion.div>

            {/* Título Principal com Typewriter */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.7, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-2 sm:mb-4">
                <span className="text-persian">Seus Recursos</span>
              </h2>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-extrabold tracking-tight mb-6 sm:mb-8">
                <span className="hero-gradient-text">
                  <TypewriterText text="Educacionais" delay={800} />
                </span>
              </h2>
            </motion.div>

            {/* Subtítulo com animação */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-persian-400 text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mb-6 sm:mb-8"
            >
              Gerencie seus materiais didáticos de forma inteligente.
              Use a IA para gerar descrições e categorizar automaticamente.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-12 sm:mb-16"
            >
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: '0 8px 30px rgba(39, 24, 126, 0.35)' }}
                whileTap={{ scale: 0.97 }}
                onClick={handleOpenCreate}
                className="group btn-persian flex items-center gap-2.5 px-7 py-3.5 text-base"
              >
                <Plus className="w-5 h-5" />
                <span>Começar Agora</span>
                <motion.div
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-4 h-4" />
                </motion.div>
              </motion.button>

              <motion.a
                href="#recursos"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="btn-ghost flex items-center gap-2 px-7 py-3.5 text-base"
              >
                <SearchIcon className="w-4 h-4" />
                <span>Explorar Recursos</span>
              </motion.a>
            </motion.div>

            {/* Stats Row */}
            <ScrollReveal>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto mb-12 sm:mb-16">
                {stats.map((stat, index) => {
                  const StatIcon = stat.icon;
                  return (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      className="flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl bg-white/30 backdrop-blur-sm border border-white/30"
                    >
                      <StatIcon className="w-4 h-4 text-persian-300 mb-1" />
                      <span className="text-2xl sm:text-3xl font-extrabold text-persian">
                        <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                      </span>
                      <span className="text-[10px] sm:text-xs text-persian-400 font-medium">{stat.label}</span>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollReveal>

            {/* Features Grid com 3D Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 max-w-4xl mx-auto">
              {heroFeatures.map((feature, index) => (
                <FeatureCard3D
                  key={feature.title}
                  icon={feature.icon}
                  title={feature.title}
                  description={feature.description}
                  gradient={feature.gradient}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* Divider decorativo */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 1.2, duration: 0.8, ease: 'easeOut' }}
            className="h-px bg-gradient-to-r from-transparent via-persian-200/50 to-transparent mb-8"
          />
        </div>
      </section>

      {/* ── Conteúdo Principal ──────────────────────────────────────── */}
      <main id="recursos" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 scroll-mt-24">
        {/* ── Barra de Ações ──────────────────────────────────────── */}
        <ScrollReveal>
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
              whileHover={{ scale: 1.03, boxShadow: '0 6px 24px rgba(39, 24, 126, 0.3)' }}
              whileTap={{ scale: 0.97 }}
              onClick={handleOpenCreate}
              className="btn-persian flex items-center justify-center gap-2 whitespace-nowrap sm:self-start sm:px-6 sm:py-3.5"
            >
              <Plus className="w-5 h-5" />
              <span>Novo Recurso</span>
            </motion.button>
          </div>
        </ScrollReveal>

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
      <ScrollReveal>
        <footer className="relative text-center py-10 sm:py-12">
          {/* Divider superior */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-xl h-px bg-gradient-to-r from-transparent via-persian-200/40 to-transparent" />

          <motion.div
            className="flex items-center justify-center gap-2 mb-3"
            whileHover={{ scale: 1.02 }}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-persian to-persian-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-sm font-bold text-persian">Hub Educacional</span>
          </motion.div>

          <p className="text-xs text-persian-400">
            Desenvolvido por{' '}
            <strong className="text-persian-600 font-semibold">Leonardo Gonçalves Sobral</strong>
            {' '}— Ciência da Computação, 3° Período
          </p>
          <p className="mt-1.5 text-[11px] text-persian-300">
            Hub Inteligente de Recursos Educacionais &copy; {new Date().getFullYear()}
          </p>
        </footer>
      </ScrollReveal>

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
