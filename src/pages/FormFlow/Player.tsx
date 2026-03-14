import { useEffect, useRef, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useFormPlayerStore } from "../../lib/formflow/store";
import type { Form, Field, FieldValue } from "../../lib/formflow/types";
import { ProgressBar } from "../../components/formflow/player/ProgressBar";
import { QuestionRenderer } from "../../components/formflow/player/QuestionRenderer";
import { NavigationButtons } from "../../components/formflow/player/NavigationButtons";
import { ThankYouScreen } from "../../components/formflow/player/ThankYouScreen";

// ---------------------------------------------------------------------------
// Tipos internos
// ---------------------------------------------------------------------------

type LoadState = "loading" | "error" | "ready";
type Direction = "forward" | "backward";

// ---------------------------------------------------------------------------
// Tela de erro
// ---------------------------------------------------------------------------

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="flex flex-col items-center gap-4 text-center px-6 max-w-md">
        <AlertCircle size={48} className="text-gray-400" />
        <h1 className="text-2xl font-bold text-gray-700">
          Formulário não encontrado
        </h1>
        <p className="text-gray-500 text-sm">{message}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Componente principal
// ---------------------------------------------------------------------------

export function FormFlowPlayer() {
  const { formSlug } = useParams<{ formSlug: string }>();

  // Store selectors — atômicos para evitar re-renders desnecessários
  const form = useFormPlayerStore((s) => s.form);
  const currentFieldIndex = useFormPlayerStore((s) => s.currentFieldIndex);
  const answers = useFormPlayerStore((s) => s.answers);
  const isSubmitting = useFormPlayerStore((s) => s.isSubmitting);
  const isComplete = useFormPlayerStore((s) => s.isComplete);

  const initPlayer = useFormPlayerStore((s) => s.initPlayer);
  const goToNext = useFormPlayerStore((s) => s.goToNext);
  const goToPrevious = useFormPlayerStore((s) => s.goToPrevious);
  const setAnswer = useFormPlayerStore((s) => s.setAnswer);
  const submitForm = useFormPlayerStore((s) => s.submitForm);
  const reset = useFormPlayerStore((s) => s.reset);
  const getCurrentField = useFormPlayerStore((s) => s.getCurrentField);
  const getProgress = useFormPlayerStore((s) => s.getProgress);
  const getCanGoBack = useFormPlayerStore((s) => s.getCanGoBack);
  const getCanGoNext = useFormPlayerStore((s) => s.getCanGoNext);
  const getTotalFields = useFormPlayerStore((s) => s.getTotalFields);

  // Estado local
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [errorMessage, setErrorMessage] = useState("");
  const [direction, setDirection] = useState<Direction>("forward");
  const [animating, setAnimating] = useState(false);
  const [visibleIndex, setVisibleIndex] = useState(0);
  const analyticsFormId = useRef<string | null>(null);
  const startEventSent = useRef(false);

  // ---------------------------------------------------------------------------
  // Carrega form + fields
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!formSlug) {
      setErrorMessage("Slug do formulário não informado.");
      setLoadState("error");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoadState("loading");

      const { data: formData, error: formError } = await supabase
        .from("ff_forms")
        .select("*")
        .eq("slug", formSlug)
        .eq("status", "published")
        .single<Form>();

      if (cancelled) return;

      if (formError || !formData) {
        setErrorMessage(
          "Este formulário não está disponível ou não foi encontrado.",
        );
        setLoadState("error");
        return;
      }

      const { data: fieldsData, error: fieldsError } = await supabase
        .from("ff_fields")
        .select("*")
        .eq("form_id", formData.id)
        .order("position");

      if (cancelled) return;

      if (fieldsError || !fieldsData) {
        setErrorMessage("Erro ao carregar as perguntas do formulário.");
        setLoadState("error");
        return;
      }

      // Registra evento de view
      analyticsFormId.current = formData.id;
      await supabase.from("ff_analytics_events").insert({
        form_id: formData.id,
        submission_id: null,
        event_type: "view",
        field_id: null,
        metadata: {},
      });

      initPlayer(formData, fieldsData as Field[]);
      setLoadState("ready");
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [formSlug, initPlayer]);

  // ---------------------------------------------------------------------------
  // Evento "start" — disparado ao responder o primeiro campo
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (
      loadState !== "ready" ||
      startEventSent.current ||
      !analyticsFormId.current
    )
      return;

    const hasAnyAnswer = Object.keys(answers).length > 0;
    if (!hasAnyAnswer) return;

    startEventSent.current = true;
    supabase.from("ff_analytics_events").insert({
      form_id: analyticsFormId.current,
      submission_id: null,
      event_type: "start",
      field_id: null,
      metadata: {},
    });
  }, [answers, loadState]);

  // ---------------------------------------------------------------------------
  // Animação de transição entre campos
  // ---------------------------------------------------------------------------

  const handleGoToNext = useCallback(() => {
    if (animating) return;
    setDirection("forward");
    setAnimating(true);
    setTimeout(() => {
      goToNext();
      setAnimating(false);
    }, 280);
  }, [animating, goToNext]);

  const handleGoToPrevious = useCallback(() => {
    if (animating) return;
    setDirection("backward");
    setAnimating(true);
    setTimeout(() => {
      goToPrevious();
      setAnimating(false);
    }, 280);
  }, [animating, goToPrevious]);

  // Sincroniza visibleIndex com currentFieldIndex após animação
  useEffect(() => {
    setVisibleIndex(currentFieldIndex);
  }, [currentFieldIndex]);

  // ---------------------------------------------------------------------------
  // Submit
  // ---------------------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (animating) return;
    const canGoNext = getCanGoNext();
    const total = getTotalFields();
    const isLast = currentFieldIndex >= total - 1;

    if (!canGoNext) return;

    if (isLast) {
      await submitForm();
    } else {
      handleGoToNext();
    }
  }, [
    animating,
    getCanGoNext,
    getTotalFields,
    currentFieldIndex,
    submitForm,
    handleGoToNext,
  ]);

  // ---------------------------------------------------------------------------
  // Keyboard support
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (loadState !== "ready") return;

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      const isTextInput =
        tag === "input" || tag === "textarea" || tag === "select";

      if (e.key === "Enter" && !e.shiftKey) {
        // Para inputs de texto deixa o próprio componente tratar
        if (!isTextInput) {
          e.preventDefault();
          handleSubmit();
        }
      }

      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        handleGoToPrevious();
      }

      // Teclas 1-9 para choices
      if (/^[1-9]$/.test(e.key)) {
        const field = getCurrentField();
        if (
          field?.type === "single_choice" ||
          field?.type === "multiple_choice"
        ) {
          const choices = field.properties.choices ?? [];
          const idx = parseInt(e.key) - 1;
          if (idx < choices.length) {
            setAnswer(field.id, choices[idx].value);
          }
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [loadState, handleSubmit, handleGoToPrevious, getCurrentField, setAnswer]);

  // ---------------------------------------------------------------------------
  // Render states
  // ---------------------------------------------------------------------------

  if (loadState === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-400">Carregando formulário...</p>
        </div>
      </div>
    );
  }

  if (loadState === "error") {
    return <ErrorScreen message={errorMessage} />;
  }

  if (!form) return null;

  const settings = form.settings ?? {};
  const theme = settings.theme;
  const primaryColor = theme?.primary_color ?? "#4F46E5";
  const backgroundColor = theme?.background_color ?? "#ffffff";
  const textColor = theme?.text_color ?? "#111827";
  const showProgress = settings.show_progress_bar !== false;

  const currentField = getCurrentField();
  const progress = getProgress();
  const canGoBack = getCanGoBack();
  const canGoNext = getCanGoNext();
  const total = getTotalFields();
  const isLast = currentFieldIndex >= total - 1;
  const currentAnswer: FieldValue = currentField
    ? (answers[currentField.id] ?? null)
    : null;

  // Classes de animação
  const slideOutUp = "opacity-0 -translate-y-8";
  const slideOutDown = "opacity-0 translate-y-8";
  const slideIn = "opacity-100 translate-y-0";

  const animationClass = animating
    ? direction === "forward"
      ? slideOutUp
      : slideOutDown
    : slideIn;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ backgroundColor, color: textColor }}
    >
      {/* Header com progress bar */}
      {showProgress && !isComplete && (
        <header className="w-full px-6 py-4 flex items-center gap-4">
          {settings.brand_logo_url && (
            <img
              src={settings.brand_logo_url}
              alt="Logo"
              className="h-7 object-contain flex-shrink-0"
            />
          )}
          <ProgressBar
            progress={progress}
            current={currentFieldIndex + 1}
            total={total}
            primaryColor={primaryColor}
          />
        </header>
      )}

      {/* Conteúdo principal */}
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-2xl">
          {isComplete ? (
            <ThankYouScreen
              message={settings.close_message}
              redirectUrl={settings.redirect_url}
              primaryColor={primaryColor}
              onReset={reset}
            />
          ) : currentField ? (
            <div
              key={`${visibleIndex}-${direction}`}
              className={`flex flex-col gap-8 transition-all duration-300 ease-out ${animationClass}`}
            >
              {/* Pergunta */}
              <div className="flex flex-col gap-2">
                <div className="flex items-start gap-3">
                  <span
                    className="mt-1 text-sm font-bold opacity-50 flex-shrink-0"
                    style={{ color: primaryColor }}
                  >
                    {currentFieldIndex + 1} →
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-bold leading-snug">
                    {currentField.title}
                    {currentField.required && (
                      <span
                        className="ml-1 text-base"
                        style={{ color: primaryColor }}
                      >
                        *
                      </span>
                    )}
                  </h2>
                </div>
                {currentField.description && (
                  <p className="text-base opacity-60 pl-8">
                    {currentField.description}
                  </p>
                )}
              </div>

              {/* Input */}
              <div className="pl-8">
                <QuestionRenderer
                  field={currentField}
                  value={currentAnswer}
                  onChange={(value) => setAnswer(currentField.id, value)}
                  onSubmit={handleSubmit}
                  autoFocus={!animating}
                  primaryColor={primaryColor}
                />
              </div>

              {/* Navegação — oculta para statement (tem botão próprio) */}
              {currentField.type !== "statement" && (
                <div className="pl-8">
                  <NavigationButtons
                    canGoBack={canGoBack}
                    canGoNext={canGoNext}
                    isLastField={isLast}
                    isSubmitting={isSubmitting}
                    onBack={handleGoToPrevious}
                    onNext={handleSubmit}
                    primaryColor={primaryColor}
                  />
                </div>
              )}
            </div>
          ) : (
            <p className="text-center opacity-40">
              Nenhuma pergunta encontrada neste formulário.
            </p>
          )}
        </div>
      </main>

      {/* Footer */}
      {!isComplete && (
        <footer className="w-full py-4 text-center">
          <p className="text-xs opacity-30">Powered by FormFlow</p>
        </footer>
      )}
    </div>
  );
}
