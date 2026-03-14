import { useEffect, useRef, useState } from "react";
import { Star, Upload } from "lucide-react";
import type {
  Field,
  FieldValue,
  FieldChoice,
} from "../../../lib/formflow/types";

interface QuestionRendererProps {
  field: Field;
  value: FieldValue;
  onChange: (value: FieldValue) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
  primaryColor?: string;
}

// ---------------------------------------------------------------------------
// Sub-renderers
// ---------------------------------------------------------------------------

function ShortTextInput({
  field,
  value,
  onChange,
  onSubmit,
  autoFocus,
}: Omit<QuestionRendererProps, "primaryColor">) {
  return (
    <input
      type="text"
      className="w-full bg-transparent border-b-2 border-current/30 focus:border-current/80 outline-none text-xl py-3 placeholder:opacity-30 transition-colors"
      placeholder={field.properties.placeholder ?? "Digite sua resposta..."}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit();
        }
      }}
      autoFocus={autoFocus}
      maxLength={field.validations.max_length}
    />
  );
}

function LongTextInput({
  field,
  value,
  onChange,
  onSubmit,
  autoFocus,
}: Omit<QuestionRendererProps, "primaryColor">) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = `${ref.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      rows={3}
      className="w-full bg-transparent border-b-2 border-current/30 focus:border-current/80 outline-none text-xl py-3 placeholder:opacity-30 transition-colors resize-none overflow-hidden"
      placeholder={field.properties.placeholder ?? "Digite sua resposta..."}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          onSubmit();
        }
      }}
      autoFocus={autoFocus}
      maxLength={field.validations.max_length}
    />
  );
}

function EmailInput({
  field,
  value,
  onChange,
  onSubmit,
  autoFocus,
}: Omit<QuestionRendererProps, "primaryColor">) {
  const [touched, setTouched] = useState(false);
  const isValid =
    !touched ||
    typeof value !== "string" ||
    value === "" ||
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  return (
    <div className="w-full">
      <input
        type="email"
        className="w-full bg-transparent border-b-2 border-current/30 focus:border-current/80 outline-none text-xl py-3 placeholder:opacity-30 transition-colors"
        placeholder={field.properties.placeholder ?? "seu@email.com"}
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            setTouched(true);
            onSubmit();
          }
        }}
        autoFocus={autoFocus}
      />
      {!isValid && (
        <p className="mt-2 text-sm opacity-60 text-red-400">
          Por favor, informe um e-mail válido.
        </p>
      )}
    </div>
  );
}

function PhoneInput({
  field,
  value,
  onChange,
  onSubmit,
  autoFocus,
}: Omit<QuestionRendererProps, "primaryColor">) {
  return (
    <input
      type="tel"
      className="w-full bg-transparent border-b-2 border-current/30 focus:border-current/80 outline-none text-xl py-3 placeholder:opacity-30 transition-colors"
      placeholder={field.properties.placeholder ?? "(00) 00000-0000"}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit();
        }
      }}
      autoFocus={autoFocus}
    />
  );
}

function DateInput({
  field,
  value,
  onChange,
  onSubmit,
  autoFocus,
}: Omit<QuestionRendererProps, "primaryColor">) {
  return (
    <input
      type="date"
      className="bg-transparent border-b-2 border-current/30 focus:border-current/80 outline-none text-xl py-3 transition-colors"
      placeholder={field.properties.placeholder}
      value={typeof value === "string" ? value : ""}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          onSubmit();
        }
      }}
      autoFocus={autoFocus}
    />
  );
}

function SingleChoiceInput({
  field,
  value,
  onChange,
  onSubmit,
  primaryColor = "#4F46E5",
}: QuestionRendererProps) {
  const choices: FieldChoice[] = field.properties.choices ?? [];

  return (
    <div className="flex flex-col gap-2 w-full">
      {choices.map((choice, idx) => {
        const selected = value === choice.value;
        return (
          <button
            key={choice.id}
            onClick={() => {
              onChange(choice.value);
              // Auto-avança após seleção com pequeno delay
              setTimeout(() => onSubmit(), 300);
            }}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              borderColor: selected ? primaryColor : "rgba(0,0,0,0.12)",
              backgroundColor: selected
                ? `${primaryColor}15`
                : "rgba(0,0,0,0.03)",
            }}
          >
            <span
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-colors"
              style={{
                borderColor: selected ? primaryColor : "rgba(0,0,0,0.2)",
                backgroundColor: selected ? primaryColor : "transparent",
                color: selected ? "white" : "inherit",
              }}
            >
              {String.fromCharCode(65 + idx)}
            </span>
            <span className="text-base font-medium">{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function MultipleChoiceInput({
  field,
  value,
  onChange,
  primaryColor = "#4F46E5",
}: QuestionRendererProps) {
  const choices: FieldChoice[] = field.properties.choices ?? [];
  const selected: string[] = Array.isArray(value) ? (value as string[]) : [];

  const toggle = (choiceValue: string) => {
    if (selected.includes(choiceValue)) {
      onChange(selected.filter((v) => v !== choiceValue));
    } else {
      onChange([...selected, choiceValue]);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      <p className="text-sm opacity-50 mb-1">Selecione todas que se aplicam</p>
      {choices.map((choice, idx) => {
        const isSelected = selected.includes(choice.value);
        return (
          <button
            key={choice.id}
            onClick={() => toggle(choice.value)}
            className="flex items-center gap-3 w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            style={{
              borderColor: isSelected ? primaryColor : "rgba(0,0,0,0.12)",
              backgroundColor: isSelected
                ? `${primaryColor}15`
                : "rgba(0,0,0,0.03)",
            }}
          >
            <span
              className="flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold border-2 transition-colors"
              style={{
                borderColor: isSelected ? primaryColor : "rgba(0,0,0,0.2)",
                backgroundColor: isSelected ? primaryColor : "transparent",
                color: isSelected ? "white" : "inherit",
              }}
            >
              {isSelected ? "✓" : String.fromCharCode(65 + idx)}
            </span>
            <span className="text-base font-medium">{choice.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function YesNoInput({
  value,
  onChange,
  onSubmit,
  primaryColor = "#4F46E5",
}: QuestionRendererProps) {
  const select = (v: string) => {
    onChange(v);
    setTimeout(() => onSubmit(), 300);
  };

  return (
    <div className="flex gap-4">
      {(["Sim", "Não"] as const).map((label) => {
        const val = label === "Sim" ? "yes" : "no";
        const isSelected = value === val;
        return (
          <button
            key={val}
            onClick={() => select(val)}
            className="flex-1 py-4 rounded-2xl border-2 text-lg font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{
              borderColor: isSelected ? primaryColor : "rgba(0,0,0,0.12)",
              backgroundColor: isSelected ? primaryColor : "rgba(0,0,0,0.03)",
              color: isSelected ? "white" : "inherit",
            }}
          >
            {label === "Sim" ? "👍 Sim" : "👎 Não"}
          </button>
        );
      })}
    </div>
  );
}

function RatingInput({
  field,
  value,
  onChange,
  primaryColor = "#4F46E5",
}: QuestionRendererProps) {
  const max = field.properties.max ?? 5;
  const current = typeof value === "number" ? value : 0;
  const [hovered, setHovered] = useState(0);

  return (
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => {
        const filled = star <= (hovered || current);
        return (
          <button
            key={star}
            onClick={() => onChange(star)}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            className="transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              size={36}
              className="transition-colors duration-150"
              style={{
                fill: filled ? primaryColor : "transparent",
                stroke: filled ? primaryColor : "rgba(0,0,0,0.25)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}

function ScaleInput({
  field,
  value,
  onChange,
  primaryColor = "#4F46E5",
}: QuestionRendererProps) {
  const min = field.properties.min ?? 0;
  const max = field.properties.max ?? 10;
  const current = typeof value === "number" ? value : min;

  return (
    <div className="w-full">
      <input
        type="range"
        min={min}
        max={max}
        step={field.properties.step ?? 1}
        value={current}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 rounded-full appearance-none cursor-pointer"
        style={{ accentColor: primaryColor }}
      />
      <div className="flex justify-between mt-2 text-sm opacity-50">
        <span>{field.properties.min_label ?? min}</span>
        <span className="font-semibold text-base opacity-90">{current}</span>
        <span>{field.properties.max_label ?? max}</span>
      </div>
    </div>
  );
}

function FileUploadInput({ primaryColor = "#4F46E5" }: QuestionRendererProps) {
  return (
    <div
      className="w-full border-2 border-dashed rounded-2xl p-10 flex flex-col items-center gap-3 opacity-60 cursor-not-allowed"
      style={{ borderColor: primaryColor }}
    >
      <Upload size={32} style={{ color: primaryColor }} />
      <p className="text-sm font-medium">Upload de arquivo</p>
      <p className="text-xs opacity-60">Disponível em breve</p>
    </div>
  );
}

function StatementRenderer({
  field,
  onSubmit,
  primaryColor = "#4F46E5",
}: QuestionRendererProps) {
  return (
    <button
      onClick={onSubmit}
      className="px-8 py-3 rounded-xl text-white font-semibold text-base transition-all hover:opacity-90 active:scale-95"
      style={{ backgroundColor: primaryColor }}
    >
      {field.properties.button_text ?? "Continuar"}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

export function QuestionRenderer(props: QuestionRendererProps) {
  const { field } = props;

  switch (field.type) {
    case "short_text":
      return <ShortTextInput {...props} />;
    case "long_text":
      return <LongTextInput {...props} />;
    case "email":
      return <EmailInput {...props} />;
    case "phone":
      return <PhoneInput {...props} />;
    case "date":
      return <DateInput {...props} />;
    case "single_choice":
      return <SingleChoiceInput {...props} />;
    case "multiple_choice":
      return <MultipleChoiceInput {...props} />;
    case "yes_no":
      return <YesNoInput {...props} />;
    case "rating":
      return <RatingInput {...props} />;
    case "scale":
      return <ScaleInput {...props} />;
    case "file_upload":
      return <FileUploadInput {...props} />;
    case "statement":
      return <StatementRenderer {...props} />;
    default:
      return (
        <p className="opacity-40 text-sm">
          Tipo de campo não suportado: {field.type}
        </p>
      );
  }
}
