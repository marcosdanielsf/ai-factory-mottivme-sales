import { useEffect, useRef } from "react";
import { useCanvasStore } from "../store/canvasStore";
import { useUIStore } from "../store/uiStore";
import { saveMap } from "@/services/mindflow/mindflowService";

const DEBOUNCE_MS = 1500;

/**
 * Auto-save com debounce de 1.5s.
 * Salva elements no Supabase via mindflowService.saveMap().
 * Se mapId for null/undefined, salva apenas no localStorage.
 */
export function useAutoSave(mapId: string | null, disabled = false) {
  const elements = useCanvasStore((s) => s.elements);
  const layout = useCanvasStore((s) => s.layout);
  const setSaveStatus = useUIStore((s) => s.setSaveStatus);

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip first render — não salva ao montar
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Skip while loading from DB (evita sobrescrever dados reais)
    if (disabled) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setSaveStatus("saving");

    timerRef.current = setTimeout(async () => {
      try {
        // Sempre salva no localStorage como fallback
        const snapshot = JSON.stringify({
          elements,
          layout,
          savedAt: new Date().toISOString(),
        });
        localStorage.setItem(`mindflow-${mapId ?? "local"}`, snapshot);

        // Salva no Supabase se tiver mapId
        if (mapId) {
          await saveMap(mapId, { elements, layout });
        }

        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2000);
      } catch (e) {
        console.error("[useAutoSave]", e);
        setSaveStatus("error");
        setTimeout(() => setSaveStatus("idle"), 3000);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [elements, layout, mapId]);
}
