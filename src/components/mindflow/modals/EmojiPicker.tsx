
import { useState, useCallback } from "react";

// ── Emoji categories ────────────────────────────────────────────────────────────
const EMOJI_CATEGORIES = [
  {
    name: "Frequentes",
    emojis: [
      "\u{1F4A1}",
      "\u{2705}",
      "\u{1F680}",
      "\u{2B50}",
      "\u{1F525}",
      "\u{1F3AF}",
      "\u{1F4DD}",
      "\u{1F4CA}",
      "\u{26A0}\u{FE0F}",
      "\u{1F512}",
      "\u{23F0}",
      "\u{1F4C5}",
      "\u{1F4CE}",
      "\u{1F4CC}",
      "\u{2764}\u{FE0F}",
      "\u{1F44D}",
    ],
  },
  {
    name: "Status",
    emojis: [
      "\u{1F7E2}",
      "\u{1F7E1}",
      "\u{1F534}",
      "\u{1F535}",
      "\u{26AB}",
      "\u{26AA}",
      "\u{1F7E3}",
      "\u{1F7E0}",
      "\u{2705}",
      "\u{274C}",
      "\u{23F8}\u{FE0F}",
      "\u{25B6}\u{FE0F}",
      "\u{1F504}",
      "\u{1F6A7}",
      "\u{1F3C1}",
      "\u{1F6D1}",
    ],
  },
  {
    name: "Objetos",
    emojis: [
      "\u{1F4BB}",
      "\u{1F4F1}",
      "\u{1F3A8}",
      "\u{1F9EA}",
      "\u{1F4DA}",
      "\u{2699}\u{FE0F}",
      "\u{1F50D}",
      "\u{1F527}",
      "\u{1F4E6}",
      "\u{1F4E7}",
      "\u{1F4B0}",
      "\u{1F6E0}\u{FE0F}",
      "\u{1F4CB}",
      "\u{1F4D0}",
      "\u{1F5C2}\u{FE0F}",
      "\u{1F4C1}",
    ],
  },
  {
    name: "Pessoas",
    emojis: [
      "\u{1F464}",
      "\u{1F465}",
      "\u{1F468}\u{200D}\u{1F4BB}",
      "\u{1F469}\u{200D}\u{1F4BB}",
      "\u{1F4AA}",
      "\u{1F91D}",
      "\u{1F44B}",
      "\u{1F44F}",
      "\u{1F64C}",
      "\u{1F914}",
      "\u{1F4AC}",
      "\u{1F917}",
    ],
  },
  {
    name: "Natureza",
    emojis: [
      "\u{2600}\u{FE0F}",
      "\u{1F319}",
      "\u{26C5}",
      "\u{1F308}",
      "\u{1F332}",
      "\u{1F33F}",
      "\u{1F33A}",
      "\u{1F341}",
      "\u{1F30E}",
      "\u{26A1}",
      "\u{1F4A7}",
      "\u{2744}\u{FE0F}",
    ],
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [activeCategory, setActiveCategory] = useState(0);

  const handleSelect = useCallback(
    (emoji: string) => {
      onSelect(emoji);
      onClose();
    },
    [onSelect, onClose],
  );

  return (
    <div
      className="bg-[#0d0d1c] border border-white/[0.08] rounded-xl shadow-[0_16px_48px_rgba(0,0,0,0.6)] w-[280px] overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Category tabs */}
      <div className="flex border-b border-white/[0.06] px-2 pt-2 gap-1">
        {EMOJI_CATEGORIES.map((cat, i) => (
          <button
            key={cat.name}
            onClick={() => setActiveCategory(i)}
            className={`text-[10px] px-2 py-1.5 rounded-t-md transition-colors cursor-pointer ${
              activeCategory === i
                ? "text-[#6EE7F7] bg-white/[0.06]"
                : "text-slate-500 hover:text-slate-300"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Emoji grid */}
      <div className="p-2 grid grid-cols-8 gap-0.5 max-h-[200px] overflow-y-auto">
        {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            onClick={() => handleSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/[0.08] transition-colors text-lg cursor-pointer"
            title={emoji}
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Remove emoji option */}
      <div className="border-t border-white/[0.06] px-3 py-2">
        <button
          onClick={() => handleSelect("")}
          className="text-[10px] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          Remover emoji
        </button>
      </div>
    </div>
  );
}
