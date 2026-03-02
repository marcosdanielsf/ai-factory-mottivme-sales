import { useState, useCallback, useRef, useEffect } from "react";
import {
  AgentEvolutionChart,
  type DataSource,
} from "../components/charts/AgentEvolutionChart";
import {
  TrendingUp,
  Brain,
  Zap,
  Users,
  Sparkles,
  ChevronDown,
  Bot,
  Search,
} from "lucide-react";
import { useAgents } from "../hooks/useAgents";

const INFO_CARDS = {
  improver: [
    {
      icon: Brain,
      bgClass: "bg-blue-500/10",
      iconClass: "text-blue-500",
      title: "Score PNL",
      description:
        "Mede a capacidade do agente de aplicar tecnicas de Programacao Neurolinguistica: Yes Set, Pressuposicoes, VAC e Rapport natural.",
    },
    {
      icon: Zap,
      bgClass: "bg-emerald-500/10",
      iconClass: "text-emerald-500",
      title: "Score Neurovendas",
      description:
        "Avalia o uso de gatilhos mentais e tecnicas de persuasao: 3 Cerebros, Escassez, Autoridade e Prova Social.",
    },
    {
      icon: Users,
      bgClass: "bg-orange-500/10",
      iconClass: "text-orange-500",
      title: "Score Pessoas",
      description:
        "Analisa habilidades interpessoais do agente: Empatia, Fluidez, Uso do nome e Fechamento efetivo.",
    },
  ],
  reflection: [
    {
      icon: Brain,
      bgClass: "bg-blue-500/10",
      iconClass: "text-blue-500",
      title: "Score Completude",
      description:
        "Avalia se o agente cobre todos os pontos necessarios da conversa: qualificacao, objecoes e proximo passo.",
    },
    {
      icon: Zap,
      bgClass: "bg-emerald-500/10",
      iconClass: "text-emerald-500",
      title: "Score Profundidade",
      description:
        "Mede a profundidade da analise: perguntas abertas, exploracao de dor e entendimento do contexto.",
    },
    {
      icon: Users,
      bgClass: "bg-orange-500/10",
      iconClass: "text-orange-500",
      title: "Score Tom",
      description:
        "Analisa tom e linguagem do agente: naturalidade, adaptacao ao perfil do lead e cordialidade.",
    },
  ],
};

export function Evolution() {
  const [dataSource, setDataSource] = useState<DataSource>("improver");
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false);
  const [agentSearchTerm, setAgentSearchTerm] = useState("");
  const agentMenuRef = useRef<HTMLDivElement>(null);

  const { agents, loading: agentsLoading } = useAgents();
  const selectedAgent = agents.find((a) => a.id === selectedAgentId) ?? null;
  const filteredAgents = agents.filter((a) =>
    a.name.toLowerCase().includes(agentSearchTerm.toLowerCase()),
  );

  useEffect(() => {
    if (!isAgentMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (
        agentMenuRef.current &&
        !agentMenuRef.current.contains(e.target as Node)
      ) {
        setIsAgentMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isAgentMenuOpen]);

  const handleDataSourceChange = useCallback((source: DataSource) => {
    setDataSource(source);
  }, []);

  const cards = INFO_CARDS[dataSource];

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-accent-primary/10 rounded-xl">
              <Sparkles className="w-6 h-6 text-accent-primary" />
            </div>
            <h1 className="text-2xl font-bold text-text-primary">
              Evolucao do Agente
            </h1>
          </div>

          {/* Agent Selector */}
          <div className="relative shrink-0" ref={agentMenuRef}>
            <button
              onClick={() => setIsAgentMenuOpen((v) => !v)}
              className="flex items-center gap-2 px-3 py-2 bg-bg-secondary border border-border-default hover:border-border-hover rounded-xl transition-colors text-sm"
            >
              <Bot size={14} className="text-text-muted" />
              <span
                className={
                  selectedAgent ? "text-text-primary" : "text-text-muted"
                }
              >
                {selectedAgent ? selectedAgent.name : "Todos os agentes"}
              </span>
              <ChevronDown size={12} className="text-text-muted" />
            </button>

            {isAgentMenuOpen && (
              <div className="absolute top-full right-0 mt-1 w-72 bg-bg-secondary border border-border-default rounded-xl shadow-xl z-50">
                <div className="p-2 border-b border-border-default">
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-bg-tertiary rounded-lg">
                    <Search size={12} className="text-text-muted shrink-0" />
                    <input
                      type="text"
                      placeholder="Buscar agente..."
                      value={agentSearchTerm}
                      onChange={(e) => setAgentSearchTerm(e.target.value)}
                      className="bg-transparent text-sm text-text-primary placeholder-text-muted outline-none w-full"
                      autoFocus
                    />
                  </div>
                </div>
                <div className="max-h-64 overflow-y-auto p-1">
                  <button
                    onClick={() => {
                      setSelectedAgentId(null);
                      setIsAgentMenuOpen(false);
                      setAgentSearchTerm("");
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      !selectedAgentId
                        ? "bg-accent-primary/10 text-accent-primary"
                        : "text-text-secondary hover:bg-bg-hover"
                    }`}
                  >
                    Todos os agentes
                  </button>
                  {agentsLoading ? (
                    <div className="px-3 py-4 text-center text-text-muted text-sm">
                      Carregando...
                    </div>
                  ) : (
                    filteredAgents.map((agent) => (
                      <button
                        key={agent.id}
                        onClick={() => {
                          setSelectedAgentId(agent.id);
                          setIsAgentMenuOpen(false);
                          setAgentSearchTerm("");
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedAgentId === agent.id
                            ? "bg-accent-primary/10 text-accent-primary"
                            : "text-text-secondary hover:bg-bg-hover"
                        }`}
                      >
                        {agent.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-text-muted mt-2 max-w-xl">
          {dataSource === "reflection"
            ? "Evolucao baseada no Reflection Loop. Scores derivados da analise automatica de conversas."
            : "Acompanhe a evolucao dos scores do agente SDR ao longo do tempo. O Improver analisa conversas semanalmente e sugere melhorias."}
        </p>
      </div>

      {/* Evolution Chart */}
      <div className="mb-8">
        <AgentEvolutionChart
          limit={50}
          onDataSourceChange={handleDataSourceChange}
          locationId={selectedAgent?.locationId}
          agentName={selectedAgent?.agentName}
        />
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className="bg-bg-secondary border border-border-default rounded-xl p-6 hover:border-border-hover transition-colors"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2 ${card.bgClass} rounded-lg`}>
                  <Icon className={`w-5 h-5 ${card.iconClass}`} />
                </div>
                <h3 className="text-text-primary font-semibold">
                  {card.title}
                </h3>
              </div>
              <p className="text-text-muted text-sm">{card.description}</p>
            </div>
          );
        })}
      </div>

      {/* How it works */}
      <div className="bg-bg-secondary border border-border-default rounded-xl p-6">
        <h3 className="text-text-primary font-semibold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-accent-primary" />
          Como funciona o Improver
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              1
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">Simular</p>
              <p className="text-text-muted">3 perfis de lead sao simulados</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              2
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">
                Avaliar ANTES
              </p>
              <p className="text-text-muted">Especialistas dao nota 0-100</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              3
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">
                Gerar Patches
              </p>
              <p className="text-text-muted">Melhorias cirurgicas no prompt</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              4
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">
                Avaliar DEPOIS
              </p>
              <p className="text-text-muted">Re-simular e comparar scores</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-accent-primary/10 rounded-lg flex items-center justify-center text-accent-primary font-bold shrink-0">
              5
            </div>
            <div>
              <p className="text-text-primary font-medium mb-1">Aprovar</p>
              <p className="text-text-muted">Voce aprova via WhatsApp</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Evolution;
