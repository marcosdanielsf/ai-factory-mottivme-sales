import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

interface MindFlowMap {
  id: string;
  title: string;
  layout: string;
  updated_at: string;
}

// Placeholder data — will be replaced with Supabase query
const SAMPLE_MAPS: MindFlowMap[] = [
  {
    id: "demo",
    title: "Mapa de Demo",
    layout: "radial",
    updated_at: new Date().toISOString(),
  },
];

export function MindFlowList() {
  const navigate = useNavigate();
  const [maps] = useState<MindFlowMap[]>(SAMPLE_MAPS);

  const handleNewMap = useCallback(() => {
    // For now, navigate to demo editor
    navigate("/mindflow/demo");
  }, [navigate]);

  const handleOpenMap = useCallback(
    (id: string) => {
      navigate(`/mindflow/${id}`);
    },
    [navigate],
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">MindFlow</h1>
          <p className="text-sm text-text-muted mt-1">
            Mapas mentais interativos com IA
          </p>
        </div>
        <button
          onClick={handleNewMap}
          className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-all"
          style={{
            background:
              "linear-gradient(135deg, rgba(110,231,247,0.15), rgba(167,139,250,0.15))",
            border: "1px solid rgba(110,231,247,0.25)",
            color: "#6EE7F7",
          }}
        >
          + Novo Mapa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {maps.map((map) => (
          <div
            key={map.id}
            onClick={() => handleOpenMap(map.id)}
            className="p-5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#6EE7F7] to-[#A78BFA] flex items-center justify-center font-black text-lg text-[#07070f]">
                M
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm text-text-primary truncate group-hover:text-[#6EE7F7] transition-colors">
                  {map.title}
                </h3>
                <p className="text-[11px] text-text-muted capitalize">
                  {map.layout}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-text-muted">
              Atualizado:{" "}
              {new Date(map.updated_at).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "short",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>
        ))}
      </div>

      {maps.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6EE7F7]/20 to-[#A78BFA]/20 flex items-center justify-center mb-4">
            <span className="text-3xl">M</span>
          </div>
          <h3 className="font-semibold text-text-primary mb-1">
            Nenhum mapa ainda
          </h3>
          <p className="text-sm text-text-muted mb-4">
            Crie seu primeiro mapa mental com IA
          </p>
          <button
            onClick={handleNewMap}
            className="px-4 py-2 rounded-xl text-sm font-bold cursor-pointer"
            style={{
              background:
                "linear-gradient(135deg, rgba(110,231,247,0.15), rgba(167,139,250,0.15))",
              border: "1px solid rgba(110,231,247,0.25)",
              color: "#6EE7F7",
            }}
          >
            + Novo Mapa
          </button>
        </div>
      )}
    </div>
  );
}
