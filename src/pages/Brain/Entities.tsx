import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  X,
  Loader2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookOpen,
  Building2,
  Tag,
  Lightbulb,
  Wrench,
  MapPin,
  HelpCircle,
} from "lucide-react";
import { supabase } from "../../lib/supabase";

// ============================================
// TIPOS
// ============================================

interface KnowledgeEntity {
  id: string;
  canonical_name: string;
  entity_type: string;
  aliases: string[] | null;
  mention_count: number;
  dossier_text: string | null;
  created_at: string;
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
// COMPONENTES
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

function EntityModal({
  entity,
  onClose,
}: {
  entity: KnowledgeEntity;
  onClose: () => void;
}) {
  const config = getTypeConfig(entity.entity_type);
  const Icon = config.icon;

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
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-bg-hover rounded-lg text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
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
              <pre className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap font-sans">
                {entity.dossier_text}
              </pre>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-text-muted">
              <ExternalLink size={32} className="mb-3 opacity-20" />
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
          <div className="flex items-center gap-2 mt-0.5">
            <EntityTypeBadge type={entity.entity_type} />
            <span className="text-xs text-text-muted">
              {entity.mention_count} menções
            </span>
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
// PÁGINA PRINCIPAL
// ============================================

export function BrainEntities() {
  const [entities, setEntities] = useState<KnowledgeEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState<EntityType>("all");
  const [search, setSearch] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<KnowledgeEntity | null>(
    null,
  );
  const [showFilters, setShowFilters] = useState(false);

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

  const filtered = entities.filter((e) => {
    const matchesType = activeType === "all" || e.entity_type === activeType;
    const matchesSearch =
      !search ||
      e.canonical_name.toLowerCase().includes(search.toLowerCase()) ||
      e.aliases?.some((a) => a.toLowerCase().includes(search.toLowerCase()));
    return matchesType && matchesSearch;
  });

  const countByType = entities.reduce(
    (acc, e) => {
      acc[e.entity_type] = (acc[e.entity_type] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return (
    <div className="p-6 max-w-7xl space-y-6">
      {/* Header */}
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

      {/* Busca + filtros toggle */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar entidade por nome ou alias..."
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
            {search || activeType !== "all" ? " filtrada" : ""}
            {filtered.length !== 1 ? "s" : ""}
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
