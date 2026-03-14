import { useParams } from "react-router-dom";

export function FormFlowPlayer() {
  const { formSlug } = useParams<{ formSlug: string }>();

  return (
    <div className="min-h-screen bg-surface-primary flex items-center justify-center">
      <div className="w-full max-w-xl px-6">
        <h1 className="text-3xl font-bold text-text-primary mb-4">
          Formulário
        </h1>
        <p className="text-text-muted">Slug: {formSlug}</p>
        <p className="text-sm text-text-muted mt-8">
          Player em construção — Fase 3
        </p>
      </div>
    </div>
  );
}
