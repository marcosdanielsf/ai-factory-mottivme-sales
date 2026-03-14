import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  FileText,
  BarChart2,
  Edit2,
  Trash2,
  Globe,
  XCircle,
  Eye,
  CheckCircle,
  Clock,
  Archive,
  Loader2,
} from "lucide-react";
import { useFormFlow, FormWithStats } from "../../hooks/useFormFlow";
import { FormStatus } from "../../lib/formflow/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffH = Math.floor(diffMs / 3_600_000);
  const diffD = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "agora mesmo";
  if (diffMin < 60) return `há ${diffMin} min`;
  if (diffH < 24) return `há ${diffH}h`;
  if (diffD === 1) return "ontem";
  if (diffD < 30) return `há ${diffD} dias`;
  const diffM = Math.floor(diffD / 30);
  if (diffM < 12) return `há ${diffM} meses`;
  return `há ${Math.floor(diffM / 12)} anos`;
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

// ---------------------------------------------------------------------------
// Status badge
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  FormStatus,
  { label: string; className: string; Icon: typeof Globe }
> = {
  draft: {
    label: "Rascunho",
    className: "bg-gray-500/15 text-gray-400 border border-gray-500/30",
    Icon: FileText,
  },
  published: {
    label: "Publicado",
    className: "bg-green-500/15 text-green-400 border border-green-500/30",
    Icon: Globe,
  },
  closed: {
    label: "Fechado",
    className: "bg-red-500/15 text-red-400 border border-red-500/30",
    Icon: XCircle,
  },
  archived: {
    label: "Arquivado",
    className: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
    Icon: Archive,
  },
};

function StatusBadge({ status }: { status: FormStatus }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const { Icon } = cfg;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${cfg.className}`}
    >
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Form Card
// ---------------------------------------------------------------------------

interface FormCardProps {
  form: FormWithStats;
  onEdit: () => void;
  onAnalytics: () => void;
  onPublish: () => void;
  onClose: () => void;
  onDelete: () => void;
  actionLoading: boolean;
}

function FormCard({
  form,
  onEdit,
  onAnalytics,
  onPublish,
  onClose,
  onDelete,
  actionLoading,
}: FormCardProps) {
  const stats = form.stats;

  return (
    <div
      className="bg-surface-primary border border-border-primary rounded-xl p-5 flex flex-col gap-4 hover:border-brand-primary/40 transition-colors cursor-pointer group"
      onClick={onEdit}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-text-primary truncate group-hover:text-brand-primary transition-colors">
            {form.title}
          </h3>
          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
            <Clock size={11} />
            Criado {formatRelativeDate(form.created_at)}
          </p>
        </div>
        <StatusBadge status={form.status} />
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-surface-secondary rounded-lg px-3 py-2 text-center">
          <p className="text-base font-bold text-text-primary">
            {stats ? formatNumber(stats.total_submissions) : "—"}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Respostas</p>
        </div>
        <div className="bg-surface-secondary rounded-lg px-3 py-2 text-center">
          <p className="text-base font-bold text-text-primary">
            {stats ? `${Math.round(stats.completion_rate)}%` : "—"}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Conclusão</p>
        </div>
        <div className="bg-surface-secondary rounded-lg px-3 py-2 text-center">
          <p className="text-base font-bold text-text-primary">
            {stats ? formatNumber(stats.total_views) : "—"}
          </p>
          <p className="text-[11px] text-text-muted mt-0.5">Views</p>
        </div>
      </div>

      {/* Ações */}
      <div
        className="flex items-center gap-1 pt-1 border-t border-border-primary"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onEdit}
          title="Editar"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
        >
          <Edit2 size={13} />
          Editar
        </button>

        <button
          onClick={onAnalytics}
          title="Ver respostas"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-text-primary hover:bg-surface-secondary transition-colors"
        >
          <BarChart2 size={13} />
          Analytics
        </button>

        {form.status === "draft" || form.status === "closed" ? (
          <button
            onClick={onPublish}
            disabled={actionLoading}
            title="Publicar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors disabled:opacity-50"
          >
            <Globe size={13} />
            Publicar
          </button>
        ) : form.status === "published" ? (
          <button
            onClick={onClose}
            disabled={actionLoading}
            title="Fechar"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          >
            <XCircle size={13} />
            Fechar
          </button>
        ) : null}

        <button
          onClick={onDelete}
          disabled={actionLoading}
          title="Deletar"
          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-text-muted hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-2xl bg-surface-secondary border border-border-primary flex items-center justify-center mb-4">
        <FileText size={28} className="text-text-muted" />
      </div>
      <h3 className="text-base font-semibold text-text-primary mb-1">
        Nenhum formulário ainda
      </h3>
      <p className="text-sm text-text-muted max-w-xs mb-6">
        Crie seu primeiro formulário conversacional e comece a coletar
        respostas.
      </p>
      <button
        onClick={onNew}
        className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90 transition-colors"
      >
        <Plus size={16} />
        Criar primeiro formulário
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Dashboard principal
// ---------------------------------------------------------------------------

export function FormFlowDashboard() {
  const navigate = useNavigate();
  const {
    forms,
    loading,
    error,
    createForm,
    publishForm,
    closeForm,
    deleteForm,
  } = useFormFlow();
  const [creating, setCreating] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  async function handleNew() {
    setCreating(true);
    try {
      const form = await createForm("Formulário sem título");
      if (form) {
        navigate(`/formflow/${form.id}/builder`);
      }
    } finally {
      setCreating(false);
    }
  }

  async function handlePublish(formId: string) {
    setActionLoadingId(formId);
    await publishForm(formId);
    setActionLoadingId(null);
  }

  async function handleClose(formId: string) {
    setActionLoadingId(formId);
    await closeForm(formId);
    setActionLoadingId(null);
  }

  async function handleDelete(formId: string) {
    if (confirmDeleteId !== formId) {
      setConfirmDeleteId(formId);
      setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    setActionLoadingId(formId);
    await deleteForm(formId);
    setActionLoadingId(null);
    setConfirmDeleteId(null);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">FormFlow</h1>
          <p className="text-sm text-text-muted">Formulários conversacionais</p>
        </div>
        <button
          onClick={handleNew}
          disabled={creating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-primary text-white rounded-lg text-sm font-medium hover:bg-brand-primary/90 transition-colors disabled:opacity-60"
        >
          {creating ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Plus size={16} />
          )}
          Novo Formulário
        </button>
      </div>

      {/* Summary bar — só aparece quando há forms */}
      {!loading && forms.length > 0 && (
        <div className="flex items-center gap-6 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <FileText size={14} />
            {forms.length} formulário{forms.length !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <CheckCircle size={14} className="text-green-400" />
            {forms.filter((f) => f.status === "published").length} publicado
            {forms.filter((f) => f.status === "published").length !== 1
              ? "s"
              : ""}
          </span>
          <span className="flex items-center gap-1.5">
            <Eye size={14} />
            {forms.reduce(
              (acc, f) => acc + (f.stats?.total_views ?? 0),
              0,
            )}{" "}
            views totais
          </span>
        </div>
      )}

      {/* Erro */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400">
          Erro ao carregar formulários: {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-surface-primary border border-border-primary rounded-xl p-5 animate-pulse"
            >
              <div className="h-4 bg-surface-secondary rounded w-3/4 mb-3" />
              <div className="h-3 bg-surface-secondary rounded w-1/3 mb-4" />
              <div className="grid grid-cols-3 gap-2 mb-4">
                {[1, 2, 3].map((j) => (
                  <div
                    key={j}
                    className="h-12 bg-surface-secondary rounded-lg"
                  />
                ))}
              </div>
              <div className="h-8 bg-surface-secondary rounded-lg" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && forms.length === 0 && (
        <EmptyState onNew={handleNew} />
      )}

      {/* Grid de cards */}
      {!loading && forms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {forms.map((form) => (
            <div key={form.id} className="relative">
              {/* Confirmação de delete */}
              {confirmDeleteId === form.id && (
                <div className="absolute inset-0 z-10 bg-surface-primary/95 border border-red-500/40 rounded-xl flex flex-col items-center justify-center gap-3 p-4">
                  <p className="text-sm font-medium text-text-primary text-center">
                    Deletar "{form.title}"?
                  </p>
                  <p className="text-xs text-text-muted text-center">
                    Todas as respostas serão perdidas. Esta ação não pode ser
                    desfeita.
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setConfirmDeleteId(null)}
                      className="px-4 py-1.5 text-sm text-text-muted hover:text-text-primary bg-surface-secondary rounded-lg transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleDelete(form.id)}
                      disabled={actionLoadingId === form.id}
                      className="px-4 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoadingId === form.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        "Deletar"
                      )}
                    </button>
                  </div>
                </div>
              )}

              <FormCard
                form={form}
                onEdit={() => navigate(`/formflow/${form.id}/builder`)}
                onAnalytics={() => navigate(`/formflow/${form.id}/analytics`)}
                onPublish={() => handlePublish(form.id)}
                onClose={() => handleClose(form.id)}
                onDelete={() => handleDelete(form.id)}
                actionLoading={actionLoadingId === form.id}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
