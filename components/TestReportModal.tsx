import React from 'react';
import { FileText, X } from 'lucide-react';

interface TestRun {
  id: string;
  version_id: string;
  passed_tests: number;
  failed_tests: number;
  total_tests: number;
  run_at: string;
  summary?: string;
}

interface TestReportModalProps {
  run: TestRun;
  onClose: () => void;
}

export const TestReportModal = ({ run, onClose }: TestReportModalProps) => {
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-bg-secondary border border-border-default rounded-lg w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl">
        <div className="p-4 border-b border-border-default flex items-center justify-between bg-bg-tertiary">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FileText size={18} className="text-accent-primary" />
              <h3 className="font-semibold text-text-primary">Relatório de Testes: {run.version_id}</h3>
            </div>
            <div className="flex items-center gap-3 px-3 py-1 bg-bg-primary rounded-full border border-border-default">
              <span className="text-xs font-medium text-accent-success">{run.passed_tests} Passou</span>
              <div className="w-px h-3 bg-border-default"></div>
              <span className="text-xs font-medium text-accent-error">{run.failed_tests} Falhou</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-bg-primary rounded-lg transition-colors text-text-muted hover:text-text-primary border border-transparent hover:border-border-default"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 bg-bg-primary overflow-auto p-8 font-mono text-sm text-text-secondary">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="p-4 rounded bg-bg-secondary border border-border-default">
                  <div className="text-[10px] uppercase text-text-muted mb-1">Judge Model</div>
                  <div className="text-text-primary">GPT-4o (Reasoning Mode)</div>
               </div>
               <div className="p-4 rounded bg-bg-secondary border border-border-default">
                  <div className="text-[10px] uppercase text-text-muted mb-1">Timestamp</div>
                  <div className="text-text-primary">{new Date(run.run_at).toLocaleString()}</div>
               </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-bg-tertiary rounded border border-border-default border-l-4 border-l-accent-success">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-accent-success font-bold text-xs uppercase tracking-wider">[SUCCESS] 01 - Início de Atendimento</p>
                  <span className="text-[10px] bg-accent-success/10 text-accent-success px-1.5 py-0.5 rounded">Score: 10/10</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase mb-1">Input (Lead)</p>
                    <p className="text-text-primary italic">"Olá, gostaria de saber mais sobre os planos"</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase mb-1">Output (Agent)</p>
                    <p className="text-text-primary italic">"Olá! Com certeza, temos 3 planos principais: Starter, Pro e Enterprise. Qual deles se adequa melhor ao seu momento?"</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border-default/50">
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    <span className="text-accent-primary font-bold">Judge Rationale:</span> O agente seguiu o script perfeitamente, identificou a intenção e fez uma pergunta de fechamento aberta para qualificação.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-bg-tertiary rounded border border-border-default border-l-4 border-l-accent-error">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-accent-error font-bold text-xs uppercase tracking-wider">[FAILED] 02 - Objeção de Preço</p>
                  <span className="text-[10px] bg-accent-error/10 text-accent-error px-1.5 py-0.5 rounded">Score: 4/10</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase mb-1">Input (Lead)</p>
                    <p className="text-text-primary italic">"Achei muito caro, não tem desconto?"</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase mb-1">Output (Agent)</p>
                    <p className="text-text-primary italic">"Infelizmente não posso dar desconto agora."</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border-default/50">
                  <p className="text-[11px] text-accent-error leading-relaxed">
                    <span className="font-bold">Judge Rationale:</span> O agente falhou em aplicar a técnica de ancoragem de valor descrita na linha 45 do prompt. Ele foi muito direto e não tentou contornar a objeção mostrando os benefícios.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-bg-tertiary rounded border border-border-default border-l-4 border-l-accent-warning">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-accent-warning font-bold text-xs uppercase tracking-wider">[WARNING] 03 - Agendamento Direto</p>
                  <span className="text-[10px] bg-accent-warning/10 text-accent-warning px-1.5 py-0.5 rounded">Score: 7/10</span>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-[10px] text-text-muted uppercase mb-1">Input (Lead)</p>
                    <p className="text-text-primary italic">"Pode agendar para amanhã?"</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-text-muted uppercase mb-1">Output (Agent)</p>
                    <p className="text-text-primary italic">"Claro, qual horário fica melhor para você?"</p>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-border-default/50">
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    <span className="text-accent-warning font-bold">Judge Rationale:</span> Agendamento realizado, porém o agente não confirmou o fuso horário (UTC-3), o que pode gerar confusão se o lead for de outra região.
                  </p>
                </div>
              </div>

              <div className="text-center py-12 opacity-30 select-none">
                [ FIM DO RELATÓRIO HTML SIMULADO ]
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
