"use client";

import { useCallback, useState } from "react";
import { useCanvasStore } from "../store/canvasStore";

type ExportFormat = "json" | "png" | "pdf";

interface ExportPanelProps {
  open: boolean;
  onClose: () => void;
}

export function ExportPanel({ open, onClose }: ExportPanelProps) {
  const elements = useCanvasStore((s) => s.elements);
  const layout = useCanvasStore((s) => s.layout);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);

  const handleExportJSON = useCallback(() => {
    setExporting("json");
    try {
      const snapshot = JSON.stringify(
        {
          version: "5.3",
          elements,
          layout,
          exportedAt: new Date().toISOString(),
          elementCount: elements.length,
        },
        null,
        2,
      );
      const blob = new Blob([snapshot], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mindflow-${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(null);
    }
  }, [elements, layout]);

  const handleExportPNG = useCallback(async () => {
    setExporting("png");
    try {
      // Dynamic import — html-to-image is optional
      let toPng: (
        node: HTMLElement,
        options?: Record<string, unknown>,
      ) => Promise<string>;
      try {
        const mod = await import("html-to-image" as string);
        toPng = mod.toPng;
      } catch {
        alert("Instale html-to-image: npm i html-to-image");
        return;
      }
      const canvas = document.querySelector(
        ".react-flow__viewport",
      ) as HTMLElement;
      if (!canvas) {
        alert("Canvas nao encontrado.");
        return;
      }
      const dataUrl = await toPng(canvas, {
        backgroundColor: "#07070f",
        pixelRatio: 2,
        filter: (node: HTMLElement) => {
          const cls = node.className?.toString() ?? "";
          if (cls.includes("react-flow__minimap")) return false;
          if (cls.includes("react-flow__controls")) return false;
          return true;
        },
      });
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `mindflow-${Date.now()}.png`;
      a.click();
    } catch {
      alert("Erro ao exportar PNG.");
    } finally {
      setExporting(null);
    }
  }, []);

  const handleExportPDF = useCallback(async () => {
    setExporting("pdf");
    try {
      let toPng: (
        node: HTMLElement,
        options?: Record<string, unknown>,
      ) => Promise<string>;
      let JsPDF: new (opts?: Record<string, unknown>) => {
        internal: { pageSize: { getWidth(): number; getHeight(): number } };
        setFillColor(r: number, g: number, b: number): void;
        rect(x: number, y: number, w: number, h: number, style: string): void;
        addImage(
          data: string,
          format: string,
          x: number,
          y: number,
          w: number,
          h: number,
        ): void;
        save(filename: string): void;
      };
      try {
        const mod = await import("html-to-image" as string);
        toPng = mod.toPng;
        const pdfMod = await import("jspdf" as string);
        JsPDF = pdfMod.default;
      } catch {
        alert("Instale as dependencias: npm i html-to-image jspdf");
        return;
      }
      const canvas = document.querySelector(
        ".react-flow__viewport",
      ) as HTMLElement;
      if (!canvas) {
        alert("Canvas nao encontrado.");
        return;
      }
      const dataUrl = await toPng(canvas, {
        backgroundColor: "#07070f",
        pixelRatio: 2,
        filter: (node: HTMLElement) => {
          const cls = node.className?.toString() ?? "";
          if (cls.includes("react-flow__minimap")) return false;
          if (cls.includes("react-flow__controls")) return false;
          return true;
        },
      });
      // Create PDF in landscape
      const pdf = new JsPDF({ orientation: "landscape", unit: "px" });
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      pdf.setFillColor(7, 7, 15);
      pdf.rect(0, 0, pdfWidth, pdfHeight, "F");
      // Fit image maintaining aspect ratio
      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
      });
      const imgRatio = img.width / img.height;
      const pdfRatio = pdfWidth / pdfHeight;
      let drawW: number, drawH: number, drawX: number, drawY: number;
      if (imgRatio > pdfRatio) {
        drawW = pdfWidth;
        drawH = pdfWidth / imgRatio;
        drawX = 0;
        drawY = (pdfHeight - drawH) / 2;
      } else {
        drawH = pdfHeight;
        drawW = pdfHeight * imgRatio;
        drawX = (pdfWidth - drawW) / 2;
        drawY = 0;
      }
      pdf.addImage(dataUrl, "PNG", drawX, drawY, drawW, drawH);
      pdf.save(`mindflow-${Date.now()}.pdf`);
    } catch {
      alert(
        "Erro ao exportar PDF. Verifique se as dependencias html-to-image e jspdf estao instaladas.",
      );
    } finally {
      setExporting(null);
    }
  }, []);

  if (!open) return null;

  const formats: {
    id: ExportFormat;
    label: string;
    desc: string;
    icon: React.ReactNode;
    handler: () => void;
  }[] = [
    {
      id: "json",
      label: "JSON",
      desc: "Dados completos do mapa. Permite reimportar depois.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M8 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-3" />
          <path d="M17 3h4v4" />
          <path d="M14 10l7-7" />
        </svg>
      ),
      handler: handleExportJSON,
    },
    {
      id: "png",
      label: "PNG",
      desc: "Imagem de alta resolucao (2x) do canvas.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      ),
      handler: handleExportPNG,
    },
    {
      id: "pdf",
      label: "PDF",
      desc: "Documento PDF com o mapa em alta qualidade.",
      icon: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
          <path d="M14 2v6h6" />
          <path d="M10 13h4" />
          <path d="M10 17h4" />
        </svg>
      ),
      handler: handleExportPDF,
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[500]"
      onClick={onClose}
    >
      <div
        className="bg-[#0d0d1c] border border-white/[0.08] rounded-2xl p-6 w-[440px] max-w-[90vw] shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2
            className="text-lg font-extrabold"
            style={{
              background: "linear-gradient(90deg,#6EE7F7,#A78BFA)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Exportar Mapa
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path
                d="M1 1L11 11M1 11L11 1"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          {formats.map((fmt) => (
            <button
              key={fmt.id}
              onClick={fmt.handler}
              disabled={exporting !== null}
              className="flex items-center gap-4 w-full p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] hover:border-[rgba(110,231,247,0.15)] transition-all text-left cursor-pointer disabled:opacity-40 disabled:cursor-wait group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/[0.04] flex items-center justify-center text-slate-500 group-hover:text-[#6EE7F7] transition-colors shrink-0">
                {fmt.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold text-slate-300 group-hover:text-slate-100 transition-colors">
                  {exporting === fmt.id ? "Exportando..." : fmt.label}
                </div>
                <div className="text-xs text-slate-600 mt-0.5">{fmt.desc}</div>
              </div>
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-slate-600 group-hover:text-[#6EE7F7] transition-colors shrink-0"
              >
                <path
                  d="M8 2v8m0 0l-3-3m3 3l3-3M3 13h10"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          ))}
        </div>

        <p className="text-[10px] text-slate-700 mt-4 text-center">
          {elements.length} elementos no mapa
        </p>
      </div>
    </div>
  );
}
