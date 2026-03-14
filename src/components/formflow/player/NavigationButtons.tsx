import { ChevronLeft, ChevronRight, Send } from "lucide-react";

interface NavigationButtonsProps {
  canGoBack: boolean;
  canGoNext: boolean;
  isLastField: boolean;
  isSubmitting: boolean;
  onBack: () => void;
  onNext: () => void;
  primaryColor?: string;
}

export function NavigationButtons({
  canGoBack,
  canGoNext,
  isLastField,
  isSubmitting,
  onBack,
  onNext,
  primaryColor = "#4F46E5",
}: NavigationButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      {canGoBack && (
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-current/20 text-sm font-medium opacity-60 hover:opacity-100 transition-opacity"
        >
          <ChevronLeft size={16} />
          Voltar
        </button>
      )}

      <button
        onClick={onNext}
        disabled={!canGoNext || isSubmitting}
        className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-95"
        style={{ backgroundColor: canGoNext ? primaryColor : undefined }}
      >
        {isSubmitting ? (
          <>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Enviando...
          </>
        ) : isLastField ? (
          <>
            Enviar
            <Send size={15} />
          </>
        ) : (
          <>
            Continuar
            <ChevronRight size={16} />
          </>
        )}
      </button>

      {!isLastField && (
        <span className="text-xs opacity-40 hidden sm:block">
          pressione Enter ↵
        </span>
      )}
    </div>
  );
}
