
import { useCallback } from "react";
import { useSelectionStore } from "../store/selectionStore";
import type { ToolType } from "../types/canvas";

// ── Tool definitions ────────────────────────────────────────────────────────────
interface ToolDef {
  id: ToolType;
  label: string;
  icon: string;
  shortcut?: string;
  group: number;
}

const TOOLS: ToolDef[] = [
  // Group 0: Navigation
  { id: "select", label: "Selecionar", icon: "V", shortcut: "V", group: 0 },
  // Group 1: Creation
  { id: "node", label: "Mind Node", icon: "+", shortcut: "N", group: 1 },
  { id: "sticky", label: "Sticky Note", icon: "S", shortcut: "S", group: 1 },
  { id: "text", label: "Texto", icon: "T", shortcut: "T", group: 1 },
  // Group 2: Shapes
  { id: "rect", label: "Retangulo", icon: "\u25AD", group: 2 },
  { id: "circle", label: "Circulo", icon: "\u25CB", group: 2 },
  { id: "diamond", label: "Losango", icon: "\u25C7", group: 2 },
  // Group 3: Containers
  { id: "frame", label: "Frame", icon: "\u25A1", shortcut: "F", group: 3 },
];

// ── Toolbar component ───────────────────────────────────────────────────────────
export function Toolbar() {
  const activeTool = useSelectionStore((s) => s.activeTool);
  const setTool = useSelectionStore((s) => s.setTool);

  const handleToolClick = useCallback(
    (toolId: ToolType) => {
      setTool(toolId);
    },
    [setTool],
  );

  // Group tools by group number
  const groups = TOOLS.reduce<ToolDef[][]>((acc, tool) => {
    if (!acc[tool.group]) acc[tool.group] = [];
    acc[tool.group].push(tool);
    return acc;
  }, []);

  return (
    <div className="absolute left-3 top-1/2 -translate-y-1/2 z-[100] flex flex-col gap-1 bg-[#0d0d1a]/90 backdrop-blur-md border border-white/[0.06] rounded-xl p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
      {groups.map((group, gi) => (
        <div key={gi}>
          {gi > 0 && <div className="h-px bg-white/[0.06] mx-1 my-1" />}
          {group.map((tool) => {
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id)}
                title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ""}`}
                className={`
                  w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium
                  transition-all duration-150 cursor-pointer
                  ${
                    isActive
                      ? "bg-[#6EE7F7]/15 text-[#6EE7F7] shadow-[0_0_8px_rgba(110,231,247,0.2)]"
                      : "text-slate-500 hover:text-slate-300 hover:bg-white/[0.06]"
                  }
                `}
              >
                {tool.icon}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
