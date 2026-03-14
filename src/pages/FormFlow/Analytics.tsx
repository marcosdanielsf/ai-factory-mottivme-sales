import { useParams } from "react-router-dom";

export function FormFlowAnalytics() {
  const { formId } = useParams<{ formId: string }>();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary">Analytics</h1>
        <p className="text-sm text-text-muted">
          Respostas e métricas do formulário
        </p>
      </div>
      <div className="bg-surface-primary border border-border-primary rounded-lg p-8 text-center text-text-muted">
        Form ID: {formId} — Analytics em construção (Fase 5)
      </div>
    </div>
  );
}
