import { useState, useEffect, useCallback, useRef } from "react";
import {
  Users,
  Search,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  BookOpen,
  Building2,
  Tag,
  Lightbulb,
  Wrench,
  MapPin,
  HelpCircle,
  RefreshCw,
  ArrowLeft,
  Database,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabase";

// ============================================
// TIPOS
// ============================================

interface KnowledgeEntity {
  id: string;
  canonical_name: string;
  entity_type: string;
  aliases: string[] | null;
  description: string | null;
  mention_count: number;
  dossier_text: string | null;
  created_at: string;
  source_count?: number;
}

type EntityType =
  | "all"
  | "person"
  | "company"
  | "topic"
  | "book"
  | "framework"
  | "tool"
  | "place";

// ============================================
// HELPERS
// ============================================

const TYPE_CONFIG: Record<
  string,
  { label: string; icon: React.ElementType; color: string; bg: string }
> = {
  person: {
    label: "Pessoa",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/30",
  },
  company: {
    label: "Empresa",
    icon: Building2,
    color: "text-purple-400",
    bg: "bg-purple-500/10 border-purple-500/30",
  },
  topic: {
    label: "Tópico",
    icon: Lightbulb,
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
  },
  book: {
    label: "Livro",
    icon: BookOpen,
    color: "text-green-400",
    bg: "bg-green-500/10 border-green-500/30",
  },
  framework: {
    label: "Framework",
    icon: Tag,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10 border-cyan-500/30",
  },
  tool: {
    label: "Ferramenta",
    icon: Wrench,
    color: "text-pink-400",
    bg: "bg-pink-500/10 border-pink-500/30",
  },
  place: {
    label: "Lugar",
    icon: MapPin,
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
  },
  other: {
    label: "Outro",
    icon: HelpCircle,
    color: "text-gray-400",
    bg: "bg-gray-500/10 border-gray-500/30",
  },
};

const FILTER_TABS: { value: EntityType; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "person", label: "Pessoas" },
  { value: "company", label: "Empresas" },
  { value: "topic", label: "Tópicos" },
  { value: "book", label: "Livros" },
  { value: "framework", label: "Frameworks" },
  { value: "tool", label: "Ferramentas" },
  { value: "place", label: "Lugares" },
];

function getTypeConfig(type: string) {
  return TYPE_CONFIG[type] ?? TYPE_CONFIG["other"];
}

// ============================================
// COMPONENTES COMPARTILHADOS
// ============================================

function EntityTypeBadge({ type }: { type: string }) {
  const config = getTypeConfig(type);
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.color}`}
    >
      <Icon size={11} />
      {config.label}
    </span>
  );
}

// ============================================
// GRAFO DE RELAÇÕES (PLACEHOLDER)
// ============================================

function RelationshipGraphPlaceholder({ entityName }: { entityName: string }) {
  const nodes = [
    { x: 200, y: 160, label: entityName, main: true },
    { x: 80, y: 80, label: "Conceito A", main: false },
    { x: 320, y: 80, label: "Conceito B", main: false },
    { x: 60, y: 240, label: "Autor", main: false },
    { x: 340, y: 240, label: "Framework", main: false },
    { x: 200, y: 290, label: "Livro", main: false },
  ];

  const edges = [
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [0, 5],
    [1, 3],
    [2, 4],
  ];

  return (
    <div className="relative w-full h-80 bg-bg-tertiary/30 border border-border-default rounded-xl overflow-hidden flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 400 320"
        className="w-full h-full opacity-60"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Arestas */}
        {edges.map(([from, to], i) => (
          <line
            key={i}
            x1={nodes[from].x}
            y1={nodes[from].y}
            x2={nodes[to].x}
            y2={nodes[to].y}
            stroke="rgba(99,102,241,0.3)"
            strokeWidth="1.5"
            strokeDasharray="4 2"
          />
        ))}

        {/* Nós */}
        {nodes.map((node, i) => (
          <g key={i}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.main ? 28 : 18}
              fill={
                node.main ? "rgba(99,102,241,0.2)" : "rgba(99,102,241,0.08)"
              }
              stroke={
                node.main ? "rgba(99,102,241,0.7)" : "rgba(99,102,241,0.3)"
              }
              strokeWidth={node.main ? 2 : 1}
            />
            <text
              x={node.x}
              y={node.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize={node.main ? 8 : 7}
              fill={
                node.main ? "rgba(99,102,241,0.9)" : "rgba(148,163,184,0.8)"
              }
              fontWeight={node.main ? "600" : "400"}
            >
              {node.label.length > 10
                ? node.label.slice(0, 10) + "…"
                : node.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center">
        <span className="text-xs text-text-muted bg-bg-secondary/80 px-3 py-1 rounded-full border border-border-default">
          Grafo de relações — em desenvolvimento
        </span>
      </div>
    </div>
  );
}

// ============================================
// MODAL DE DOSSIÊ
// ============================================

function EntityModal({
  entity,
  onClose,
}: {
  entity: KnowledgeEntity;
  onClose: () => void;
}) {
  const config = getTypeConfig(entity.entity_type);
  const Icon = config.icon;
  const navigate = useNavigate();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[80vh] flex flex-col bg-bg-secondary border border-border-default rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border-default">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${config.bg}`}>
              <Icon size={20} className={config.color} />
            </div>
            <div>
              <h2 className="font-bold text-text-primary text-lg">
                {entity.canonical_name}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <EntityTypeBadge type={entity.entity_type} />
                <span className="text-xs text-text-muted">
                  {entity.mention_count} menções
                </span>
                {entity.source_count !== undefined &&
                  entity.source_count > 0 && (
                    <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                      <Database size={10} />
                      {entity.source_count} fonte
                      {entity.source_count !== 1 ? "s" : ""}
                    </span>
                  )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                onClose();
                navigate(`/brain/entities/${entity.id}`);
              }}
              className="px-2.5 py-1.5 text-xs bg-bg-tertiary hover:bg-bg-hover border border-border-default rounded-lg text-text-secondary hover:text-text-primary transition-colors"
            >
              Ver detalhe
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Aliases */}
        {entity.aliases && entity.aliases.length > 0 && (
          <div className="px-5 pt-4">
            <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-medium">
              Também conhecido como
            </p>
            <div className="flex flex-wrap gap-1.5">
              {entity.aliases.map((alias) => (
                <span
                  key={alias}
                  className="px-2 py-0.5 bg-bg-tertiary border border-border-default rounded-full text-xs text-text-secondary"
                >
                  {alias}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Dossier */}
        <div className="flex-1 overflow-y-auto p-5">
          {entity.dossier_text ? (
            <div>
              <p className="text-xs text-text-muted mb-3 uppercase tracking-wide font-medium">
                Dossiê
              </p>
              <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed [&>h1]:text-text-primary [&>h2]:text-text-primary [&>h3]:text-text-secondary [&>strong]:text-text-primary [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>p]:mb-2 [&>h2]:text-sm [&>h3]:text-xs [&>h2]:font-semibold [&>h3]:font-medium [&>h2]:mt-4 [&>h2]:mb-1">
                <ReactMarkdown>{entity.dossier_text}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted">
              <HelpCircle size={32} className="mb-3 opacity-20" />
              <p className="text-sm">Nenhum dossiê disponível ainda.</p>
              <p className="text-xs mt-1 opacity-60">
                Execute a extração de DNA para gerar o dossiê.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================
// CARD DE ENTIDADE
// ============================================

function EntityCard({
  entity,
  onClick,
}: {
  entity: KnowledgeEntity;
  onClick: () => void;
}) {
  const config = getTypeConfig(entity.entity_type);
  const Icon = config.icon;

  return (
    <button
      onClick={onClick}
      className="text-left w-full p-4 bg-bg-secondary border border-border-default rounded-xl hover:border-accent-primary/30 hover:bg-bg-tertiary/50 transition-all group"
    >
      <div className="flex items-start gap-3 mb-3">
        <div className={`p-2 rounded-lg ${config.bg} flex-shrink-0`}>
          <Icon size={16} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-text-primary truncate group-hover:text-accent-primary transition-colors">
            {entity.canonical_name}
          </p>
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
            <EntityTypeBadge type={entity.entity_type} />
            <span className="text-xs text-text-muted">
              {entity.mention_count} menções
            </span>
            {entity.source_count !== undefined && entity.source_count > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-text-muted">
                <Database size={10} />
                {entity.source_count}
              </span>
            )}
          </div>
        </div>
      </div>

      {entity.aliases && entity.aliases.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {entity.aliases.slice(0, 3).map((alias) => (
            <span
              key={alias}
              className="px-1.5 py-0.5 bg-bg-tertiary rounded text-xs text-text-muted"
            >
              {alias}
            </span>
          ))}
          {entity.aliases.length > 3 && (
            <span className="px-1.5 py-0.5 text-xs text-text-muted">
              +{entity.aliases.length - 3}
            </span>
          )}
        </div>
      )}

      {entity.dossier_text && (
        <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
          {entity.dossier_text}
        </p>
      )}
    </button>
  );
}

// ============================================
// PÁGINA DE DETALHE — /brain/entities/:id
// ============================================

export function BrainEntityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [entity, setEntity] = useState<KnowledgeEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    supabase
      .from("knowledge_entities")
      .select("*")
      .eq("id", id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setEntity(data as KnowledgeEntity);
        }
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-muted">
        <Loader2 size={24} className="animate-spin mr-3" />
        Carregando entidade...
      </div>
    );
  }

  if (notFound || !entity) {
    return (
      <div className="p-6 max-w-3xl">
        <button
          onClick={() => navigate("/brain/entities")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          Voltar para Entidades
        </button>
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <HelpCircle size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">Entidade não encontrada</p>
        </div>
      </div>
    );
  }

  const config = getTypeConfig(entity.entity_type);
  const Icon = config.icon;

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Back */}
      <button
        onClick={() => navigate("/brain/entities")}
        className="flex items-center gap-2 text-sm text-text-muted hover:text-text-primary transition-colors"
      >
        <ArrowLeft size={14} />
        Voltar para Entidades
      </button>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${config.bg} flex-shrink-0`}>
          <Icon size={28} className={config.color} />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-text-primary">
            {entity.canonical_name}
          </h1>
          <div className="flex items-center flex-wrap gap-2 mt-2">
            <EntityTypeBadge type={entity.entity_type} />
            <span className="text-sm text-text-muted">
              {entity.mention_count} menções
            </span>
            {entity.source_count !== undefined && entity.source_count > 0 && (
              <span className="inline-flex items-center gap-1 text-sm text-text-muted">
                <Database size={12} />
                {entity.source_count} fonte
                {entity.source_count !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {entity.description && (
            <p className="text-sm text-text-secondary mt-2 leading-relaxed">
              {entity.description}
            </p>
          )}
        </div>
      </div>

      {/* Aliases */}
      {entity.aliases && entity.aliases.length > 0 && (
        <div className="bg-bg-secondary border border-border-default rounded-xl p-4">
          <p className="text-xs text-text-muted mb-2 uppercase tracking-wide font-medium">
            Também conhecido como
          </p>
          <div className="flex flex-wrap gap-1.5">
            {entity.aliases.map((alias) => (
              <span
                key={alias}
                className="px-2 py-0.5 bg-bg-tertiary border border-border-default rounded-full text-xs text-text-secondary"
              >
                {alias}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Grafo de relações */}
      <div>
        <p className="text-xs text-text-muted mb-3 uppercase tracking-wide font-medium">
          Grafo de Relações
        </p>
        <RelationshipGraphPlaceholder entityName={entity.canonical_name} />
      </div>

      {/* Dossiê */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-5">
        <p className="text-xs text-text-muted mb-3 uppercase tracking-wide font-medium">
          Dossiê
        </p>
        {entity.dossier_text ? (
          <div className="prose prose-sm max-w-none text-text-secondary leading-relaxed [&>h1]:text-text-primary [&>h2]:text-text-primary [&>h3]:text-text-secondary [&>strong]:text-text-primary [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>p]:mb-2 [&>h2]:text-sm [&>h3]:text-xs [&>h2]:font-semibold [&>h3]:font-medium [&>h2]:mt-4 [&>h2]:mb-1">
            <ReactMarkdown>{entity.dossier_text}</ReactMarkdown>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-10 text-text-muted">
            <HelpCircle size={32} className="mb-3 opacity-20" />
            <p className="text-sm">Nenhum dossiê disponível ainda.</p>
            <p className="text-xs mt-1 opacity-60">
              Execute a extração de DNA para gerar o dossiê.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// PÁGINA PRINCIPAL — /brain/entities
// ============================================

export function BrainEntities() {
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<EntityType>("all");
  const [search, setSearch] = useState("");
  const [fuzzyResults, setFuzzyResults] = useState<KnowledgeEntity[] | null>(
    null,
  );
  const [fuzzyLoading, setFuzzyLoading] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<KnowledgeEntity | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchEntities = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("knowledge_entities")
      .select("*")
      .order("mention_count", { ascending: false });
    setEntities((data as KnowledgeEntity[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchEntities();
  }, [fetchEntities]);

  // Busca fuzzy com debounce 350ms
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!search.trim() || search.length < 2) {
      setFuzzyResults(null);
      setFuzzyLoading(false);
      return;
    }

    setFuzzyLoading(true);

    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase.rpc("find_entity_fuzzy", {
        search_term: search.trim(),
        match_count: 30,
      });

      if (error || !data) {
        // Fallback: filtro local simples
        const lower = search.toLowerCase();
        const local = entities.filter(
          (e) =>
            e.canonical_name.toLowerCase().includes(lower) ||
            e.aliases?.some((a) => a.toLowerCase().includes(lower)),
        );
        setFuzzyResults(local);
      } else {
        setFuzzyResults(data as KnowledgeEntity[]);
      }

      setFuzzyLoading(false);
    }, 350);
  }, [search, entities]);

  const baseList = fuzzyResults !== null ? fuzzyResults : entities;

  const filtered = baseList.filter((e) => {
    return activeType === "all" || e.entity_type === activeType;
  });

  const countByType = entities.reduce(
    (acc, e) => {
      acc[e.entity_type] = (acc[e.entity_type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const isSearching = search.length >= 2 && fuzzyLoading;

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <Users size={24} className="text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">
              Mega Brain — Entidades
            </h1>
            <p className="text-sm text-text-muted">
              {entities.length} entidades extraídas do conhecimento ingerido
            </p>
          </div>
        </div>
        <button
          onClick={fetchEntities}
          className="p-2 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
          title="Recarregar"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {/* Busca + filtros toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          {isSearching ? (
            <Loader2
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted animate-spin"
            />
          ) : (
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
          )}
          <input
            type="text"
            placeholder="Busca fuzzy por nome ou alias..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-9 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-1.5 px-3 py-2.5 bg-bg-secondary border border-border-default rounded-lg text-sm text-text-secondary hover:text-text-primary hover:bg-bg-hover transition-colors"
        >
          Filtrar
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
      </div>

      {/* Filtros por tipo */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map((tab) => {
            const count =
              tab.value === "all"
                ? entities.length
                : (countByType[tab.value] ?? 0);
            return (
              <button
                key={tab.value}
                onClick={() => setActiveType(tab.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  activeType === tab.value
                    ? "bg-accent-primary text-white"
                    : "bg-bg-secondary border border-border-default text-text-secondary hover:bg-bg-hover"
                }`}
              >
                {tab.label}
                {count > 0 && (
                  <span
                    className={`ml-1.5 text-xs ${activeType === tab.value ? "opacity-80" : "text-text-muted"}`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Grid de entidades */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-muted">
          <Loader2 size={24} className="animate-spin mr-3" />
          Carregando entidades...
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-text-muted">
          <Users size={48} className="mb-4 opacity-20" />
          <p className="text-sm font-medium">Nenhuma entidade encontrada</p>
          <p className="text-xs mt-1 opacity-60">
            {search
              ? `Sem resultados para "${search}"`
              : "Ingira conteúdo para extrair entidades automaticamente"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-text-muted">
            {filtered.length} entidade{filtered.length !== 1 ? "s" : ""}
            {search && fuzzyResults !== null ? " (busca fuzzy)" : ""}
            {activeType !== "all"
              ? ` — ${getTypeConfig(activeType).label}`
              : ""}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((entity) => (
              <EntityCard
                key={entity.id}
                entity={entity}
                onClick={() => setSelectedEntity(entity)}
              />
            ))}
          </div>
        </>
      )}

      {/* Modal de dossiê */}
      {selectedEntity && (
        <EntityModal
          entity={selectedEntity}
          onClose={() => setSelectedEntity(null)}
        />
      )}
    </div>
  );
}
