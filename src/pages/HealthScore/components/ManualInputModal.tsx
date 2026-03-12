import { useState } from "react";
import { X, Save, Loader2 } from "lucide-react";

interface ManualInputModalProps {
  locationId: string;
  dimension: "satisfaction" | "payment";
  currentScore: number;
  clientName: string;
  onSave: (
    locationId: string,
    dimension: "satisfaction" | "payment",
    score: number,
    notes?: string,
  ) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

const DIMENSION_LABELS = {
  satisfaction: {
    title: "Satisfacao do Cliente",
    description:
      "Avalie a satisfacao geral do cliente (NPS, feedback, comunicacao)",
    presets: [
      { label: "Promotor", value: 90, color: "#10b981" },
      { label: "Neutro", value: 60, color: "#f59e0b" },
      { label: "Detrator", value: 25, color: "#ef4444" },
    ],
  },
  payment: {
    title: "Regularidade de Pagamento",
    description:
      "Avalie a situacao financeira (em dia, atrasado, inadimplente)",
    presets: [
      { label: "Em dia", value: 100, color: "#10b981" },
      { label: "Atrasado", value: 50, color: "#f59e0b" },
      { label: "Inadimplente", value: 10, color: "#ef4444" },
    ],
  },
};

export function ManualInputModal({
  locationId,
  dimension,
  currentScore,
  clientName,
  onSave,
  onClose,
}: ManualInputModalProps) {
  const [score, setScore] = useState(currentScore);
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const config = DIMENSION_LABELS[dimension];

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    const result = await onSave(
      locationId,
      dimension,
      score,
      notes || undefined,
    );
    if (result.success) {
      onClose();
    } else {
      setError(result.error ?? "Erro desconhecido");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={saving ? undefined : onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-md rounded-2xl p-6 space-y-5"
        style={{
          background: "linear-gradient(145deg, #1a1a24 0%, #12121a 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)",
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-white/90">
              {config.title}
            </h3>
            <p className="text-xs text-white/35 mt-1">{clientName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/30 hover:text-white/60 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-white/40">{config.description}</p>

        {/* Presets */}
        <div className="flex gap-2">
          {config.presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => setScore(preset.value)}
              className="flex-1 py-2 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer"
              style={{
                background:
                  score === preset.value
                    ? `${preset.color}20`
                    : "rgba(255,255,255,0.03)",
                border: `1px solid ${score === preset.value ? `${preset.color}40` : "rgba(255,255,255,0.06)"}`,
                color:
                  score === preset.value
                    ? preset.color
                    : "rgba(255,255,255,0.5)",
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-white/30 uppercase tracking-wider">
              Score
            </span>
            <span className="font-mono text-lg font-bold text-white/80">
              {Math.round(score)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={score}
            onChange={(e) => setScore(Number(e.target.value))}
            className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #ef4444 0%, #f59e0b 40%, #10b981 70%, #06b6d4 100%)`,
            }}
          />
          <div className="flex justify-between text-[9px] text-white/20">
            <span>0 - Critico</span>
            <span>100 - Excelente</span>
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-[11px] text-white/30 uppercase tracking-wider block mb-1.5">
            Observacoes (opcional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            className="w-full rounded-xl p-3 text-sm text-white/80 placeholder-white/20 resize-none focus:outline-none focus:ring-1 focus:ring-cyan-500/30"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
            placeholder="Ex: Cliente reclamou do tempo de resposta..."
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-xs text-red-400 bg-red-400/10 px-3 py-2 rounded-lg">
            {error}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm text-white/40 hover:text-white/60 transition-colors cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            style={{
              background: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
              color: "white",
            }}
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
