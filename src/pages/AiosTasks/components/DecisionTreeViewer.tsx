import { useState } from 'react';
import { ChevronDown, ChevronRight, Lightbulb, TrendingUp } from 'lucide-react';
import { TaskSuggestion } from '../../../hooks/aios/useAiosTasksExpanded';

// Nos da arvore de decisao (estatico, representa a logica de roteamento)
interface TreeNode {
  id: string;
  question: string;
  yes?: string;
  no?: string;
  result?: { type: 'agent' | 'worker' | 'clone' | 'human'; label: string; color: string; desc: string };
  children?: { label: string; node: TreeNode }[];
}

const DECISION_TREE: TreeNode = {
  id: 'root',
  question: 'A task requer raciocinio contextual ou criatividade?',
  children: [
    {
      label: 'Sim',
      node: {
        id: 'ctx-yes',
        question: 'Envolve conhecimento de dominio especializado?',
        children: [
          {
            label: 'Sim',
            node: {
              id: 'specialist',
              question: 'Existe um Clone treinado para esse dominio?',
              children: [
                {
                  label: 'Sim',
                  node: {
                    id: 'use-clone',
                    question: '',
                    result: {
                      type: 'clone',
                      label: 'Clone Especialista',
                      color: 'text-amber-400 bg-amber-400/10 border-amber-400/30',
                      desc: 'Usa conhecimento especializado com menor custo que Opus/GPT-4',
                    },
                  },
                },
                {
                  label: 'Nao',
                  node: {
                    id: 'use-agent-specialist',
                    question: '',
                    result: {
                      type: 'agent',
                      label: 'Agent (Modelo Forte)',
                      color: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
                      desc: 'Requer LLM de alta capacidade (GPT-4o, Claude Opus)',
                    },
                  },
                },
              ],
            },
          },
          {
            label: 'Nao',
            node: {
              id: 'general-agent',
              question: 'O output precisa de validacao humana?',
              children: [
                {
                  label: 'Sim',
                  node: {
                    id: 'human-review',
                    question: '',
                    result: {
                      type: 'human',
                      label: 'Human-in-the-Loop',
                      color: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
                      desc: 'Agent gera, humano valida e aprova antes de prosseguir',
                    },
                  },
                },
                {
                  label: 'Nao',
                  node: {
                    id: 'agent-standard',
                    question: '',
                    result: {
                      type: 'agent',
                      label: 'Agent (Modelo Padrao)',
                      color: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
                      desc: 'Task LLM padrao — GPT-4o-mini ou Claude Haiku suficiente',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
    {
      label: 'Nao',
      node: {
        id: 'deterministic',
        question: 'A task e deterministica (mesma entrada = mesma saida)?',
        children: [
          {
            label: 'Sim',
            node: {
              id: 'use-worker',
              question: '',
              result: {
                type: 'worker',
                label: 'Worker Deterministico',
                color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
                desc: 'Zero custo LLM. Logica hardcoded, rapido, confiavel, barato.',
              },
            },
          },
          {
            label: 'Nao',
            node: {
              id: 'pattern-check',
              question: 'Segue um padrao estruturado (ex: transformar dado, validar campo)?',
              children: [
                {
                  label: 'Sim',
                  node: {
                    id: 'worker-pattern',
                    question: '',
                    result: {
                      type: 'worker',
                      label: 'Worker com Logica',
                      color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30',
                      desc: 'Logica condicional simples. Evite LLM para tarefas estruturadas.',
                    },
                  },
                },
                {
                  label: 'Nao',
                  node: {
                    id: 'light-agent',
                    question: '',
                    result: {
                      type: 'agent',
                      label: 'Agent (Modelo Leve)',
                      color: 'text-violet-400 bg-violet-400/10 border-violet-400/30',
                      desc: 'Algum raciocinio necessario, mas sem criatividade. Haiku/Flash suficiente.',
                    },
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ],
};

// Componente recursivo para renderizar nos
function TreeNodeComponent({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);

  if (node.result) {
    return (
      <div className={`mt-2 ml-4 p-3 rounded-lg border text-sm ${node.result.color}`}>
        <div className="font-semibold mb-0.5">{node.result.label}</div>
        <div className="text-xs opacity-75">{node.result.desc}</div>
      </div>
    );
  }

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-start gap-2 text-left w-full group"
      >
        <span className="mt-0.5 text-text-muted shrink-0">
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        </span>
        <span className="text-text-secondary text-sm group-hover:text-text-primary transition-colors">
          {node.question}
        </span>
      </button>

      {expanded && node.children && (
        <div className="ml-4 border-l border-border-default/50 pl-4 mt-1 space-y-1">
          {node.children.map((child) => (
            <div key={child.node.id}>
              <span className="inline-block text-xs font-medium text-text-muted px-1.5 py-0.5 bg-bg-tertiary rounded mb-1">
                {child.label}
              </span>
              <TreeNodeComponent node={child.node} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Tabela de sugestoes de conversao
function ConversionSuggestions({ suggestions }: { suggestions: TaskSuggestion[] }) {
  if (suggestions.length === 0) {
    return (
      <div className="text-center py-8 text-text-muted text-sm">
        Nenhuma sugestao ainda. Precisa de 3+ execucoes da mesma task por agente.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border-default">
            <th className="text-left text-text-muted text-xs font-medium px-3 py-2">Task</th>
            <th className="text-left text-text-muted text-xs font-medium px-3 py-2">Agente</th>
            <th className="text-right text-text-muted text-xs font-medium px-3 py-2">Execucoes</th>
            <th className="text-right text-text-muted text-xs font-medium px-3 py-2">Custo Medio</th>
            <th className="text-right text-text-muted text-xs font-medium px-3 py-2">Custo Total</th>
            <th className="text-left text-text-muted text-xs font-medium px-3 py-2">Sugestao</th>
          </tr>
        </thead>
        <tbody>
          {suggestions.map((s, i) => (
            <tr key={i} className="border-b border-border-default/50 hover:bg-bg-hover transition-colors">
              <td className="px-3 py-2">
                <span className="text-text-primary text-sm font-medium line-clamp-1 max-w-[200px]" title={s.task_title}>
                  {s.task_title}
                </span>
              </td>
              <td className="px-3 py-2">
                <span className="text-text-secondary text-xs">{s.agent_name}</span>
              </td>
              <td className="px-3 py-2 text-right">
                <span className="text-text-primary text-sm font-semibold">{s.count}x</span>
              </td>
              <td className="px-3 py-2 text-right">
                <span className="text-text-muted text-xs font-mono">${s.avg_cost.toFixed(5)}</span>
              </td>
              <td className="px-3 py-2 text-right">
                <span className="text-amber-400 text-xs font-mono">${s.total_cost.toFixed(4)}</span>
              </td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <Lightbulb size={12} className="text-amber-400 shrink-0" />
                  <span className="text-text-muted text-xs line-clamp-1">
                    Converter para Worker pode reduzir custo
                  </span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface DecisionTreeViewerProps {
  suggestions: TaskSuggestion[];
}

export function DecisionTreeViewer({ suggestions }: DecisionTreeViewerProps) {
  const [activeTab, setActiveTab] = useState<'tree' | 'suggestions'>('tree');

  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg">
      {/* Tabs */}
      <div className="flex items-center gap-1 p-4 border-b border-border-default">
        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'tree'
              ? 'bg-indigo-600 text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <ChevronRight size={14} />
          Arvore de Decisao
        </button>
        <button
          onClick={() => setActiveTab('suggestions')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'suggestions'
              ? 'bg-indigo-600 text-white'
              : 'text-text-muted hover:text-text-primary hover:bg-bg-hover'
          }`}
        >
          <TrendingUp size={14} />
          Sugestoes de Conversao
          {suggestions.length > 0 && (
            <span className="ml-1 bg-amber-500 text-white text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
              {suggestions.length}
            </span>
          )}
        </button>
      </div>

      <div className="p-4">
        {activeTab === 'tree' ? (
          <div>
            <p className="text-text-muted text-xs mb-4">
              Clique nas perguntas para expandir/recolher. Use esta arvore para decidir o executor
              ideal ao criar novas tasks ou refatorar automacoes existentes.
            </p>
            <TreeNodeComponent node={DECISION_TREE} />
          </div>
        ) : (
          <div>
            <p className="text-text-muted text-xs mb-4">
              Tasks executadas repetidamente por agentes LLM que poderiam ser convertidas para
              Workers deterministicos, reduzindo custo e aumentando confiabilidade.
            </p>
            <ConversionSuggestions suggestions={suggestions} />
          </div>
        )}
      </div>
    </div>
  );
}
