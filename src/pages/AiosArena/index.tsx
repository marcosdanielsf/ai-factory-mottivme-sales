import { useState, useRef } from 'react';
import { Send, Swords, X, ChevronDown, Sparkles } from 'lucide-react';
import { useAiosExperts } from '../../hooks/aios/useAiosExperts';
import { AiosExpert, ArenaDebateFramework, ArenaDebateMessage } from '../../types/aios';

// =====================================================
// TYPES & CONSTANTS
// =====================================================

const DEBATE_FRAMEWORKS: { value: ArenaDebateFramework; label: string; description: string }[] = [
  { value: 'socrático', label: 'Socrático', description: 'Questionar premissas até chegar à verdade' },
  { value: 'steelman', label: 'Steelman', description: 'Defender a versão mais forte do argumento oposto' },
  { value: 'devil_advocate', label: 'Advocatus Diaboli', description: 'Contra-argumentar qualquer posição' },
  { value: 'six_hats', label: '6 Chapéus', description: 'Analisar sob 6 perspectivas distintas' },
  { value: 'pro_con', label: 'Prós & Contras', description: 'Análise estruturada de vantagens e desvantagens' },
];

// =====================================================
// EXPERT SELECTOR
// =====================================================

function ExpertSelector({
  experts,
  selected,
  onToggle,
  max,
}: {
  experts: AiosExpert[];
  selected: string[];
  onToggle: (id: string) => void;
  max: number;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {experts.map((expert) => {
        const isSelected = selected.includes(expert.id);
        const isDisabled = !isSelected && selected.length >= max;

        return (
          <button
            key={expert.id}
            onClick={() => !isDisabled && onToggle(expert.id)}
            disabled={isDisabled}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              isSelected
                ? 'border-accent-primary bg-accent-primary/10'
                : isDisabled
                ? 'border-border-default bg-bg-secondary opacity-40 cursor-not-allowed'
                : 'border-border-default bg-bg-secondary hover:bg-bg-hover cursor-pointer'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-xs font-bold text-accent-primary flex-shrink-0">
              {expert.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{expert.name}</p>
              <p className="text-xs text-text-muted truncate">{expert.expertise}</p>
            </div>
            {isSelected && (
              <div className="ml-auto flex-shrink-0 w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">
                  {selected.indexOf(expert.id) + 1}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// =====================================================
// FRAMEWORK SELECTOR
// =====================================================

function FrameworkSelect({
  value,
  onChange,
}: {
  value: ArenaDebateFramework;
  onChange: (v: ArenaDebateFramework) => void;
}) {
  const current = DEBATE_FRAMEWORKS.find((f) => f.value === value);

  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ArenaDebateFramework)}
        className="w-full appearance-none pl-3 pr-8 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary focus:outline-none focus:border-accent-primary transition-colors"
      >
        {DEBATE_FRAMEWORKS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label} — {f.description}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
    </div>
  );
}

// =====================================================
// CHAT AREA
// =====================================================

function ChatMessage({
  message,
  expert,
}: {
  message: ArenaDebateMessage;
  expert: AiosExpert | undefined;
}) {
  const typeLabel = {
    argument: 'Argumento',
    counter: 'Contra-ponto',
    summary: 'Síntese',
  }[message.type];

  const typeColor = {
    argument: 'text-blue-400',
    counter: 'text-orange-400',
    summary: 'text-purple-400',
  }[message.type];

  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-accent-primary/20 flex items-center justify-center text-xs font-bold text-accent-primary flex-shrink-0 mt-0.5">
        {message.expert_name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-text-primary">{message.expert_name}</span>
          <span className={`text-[10px] ${typeColor}`}>{typeLabel}</span>
          <span className="text-[10px] text-text-muted ml-auto">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-2">
          <p className="text-sm text-text-secondary leading-relaxed">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

const MOCK_MESSAGES: ArenaDebateMessage[] = [
  {
    id: 'msg-001',
    expert_id: 'expert-001',
    expert_name: 'Copywriter Persuasivo',
    content: 'O framework AIDA é mais eficaz para conversão porque guia o leitor por um caminho emocional claro, do awareness até a ação. Em testes A/B com emails de vendas, versões AIDA superam formatos informativos em 34% nas conversões.',
    timestamp: new Date(Date.now() - 5 * 60000).toISOString(),
    type: 'argument',
  },
  {
    id: 'msg-002',
    expert_id: 'expert-003',
    expert_name: 'Estrategista de Conteúdo',
    content: 'Discordo parcialmente. AIDA funciona bem para produtos de impulso, mas para vendas B2B complexas, o Content Pillar System gera mais confiança a longo prazo. A autoridade construída por conteúdo de valor converte leads de ticket alto com muito mais consistência.',
    timestamp: new Date(Date.now() - 4 * 60000).toISOString(),
    type: 'counter',
  },
  {
    id: 'msg-003',
    expert_id: 'expert-002',
    expert_name: 'SDR Master',
    content: 'Ambos têm razão em contextos diferentes. A síntese ideal é usar Content Pillar para aquecer o lead e qualificação BANT para entender onde ele está no funil — então aplicar AIDA somente na sequência de fechamento.',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
    type: 'summary',
  },
];

export function AiosArena() {
  const { data: experts, loading: loadingExperts } = useAiosExperts();

  const [selectedExperts, setSelectedExperts] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [framework, setFramework] = useState<ArenaDebateFramework>('steelman');
  const [messages, setMessages] = useState<ArenaDebateMessage[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  function toggleExpert(id: string) {
    setSelectedExperts((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  function startDebate() {
    if (selectedExperts.length < 2 || !topic.trim()) return;
    setMessages(MOCK_MESSAGES);
    setSessionStarted(true);
  }

  function resetDebate() {
    setSessionStarted(false);
    setMessages([]);
    setSelectedExperts([]);
    setTopic('');
    setUserMessage('');
  }

  function sendMessage() {
    if (!userMessage.trim()) return;

    const firstExpertId = selectedExperts[0];
    const firstExpert = experts.find((e) => e.id === firstExpertId);

    const newMsg: ArenaDebateMessage = {
      id: `msg-${Date.now()}`,
      expert_id: firstExpertId,
      expert_name: firstExpert?.name ?? 'Expert',
      content: userMessage,
      timestamp: new Date().toISOString(),
      type: 'argument',
    };

    setMessages((prev) => [...prev, newMsg]);
    setUserMessage('');

    // Simular resposta após 1s
    setTimeout(() => {
      const secondExpertId = selectedExperts[1];
      const secondExpert = experts.find((e) => e.id === secondExpertId);

      const response: ArenaDebateMessage = {
        id: `msg-${Date.now()}-r`,
        expert_id: secondExpertId,
        expert_name: secondExpert?.name ?? 'Expert',
        content: `[Resposta simulada — integração com LLM necessária para respostas reais baseadas nos frameworks de cada expert.]`,
        timestamp: new Date().toISOString(),
        type: 'counter',
      };

      setMessages((prev) => [...prev, response]);
    }, 1000);
  }

  const selectedExpertObjects = experts.filter((e) => selectedExperts.includes(e.id));
  const canStart = selectedExperts.length >= 2 && topic.trim().length > 0;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-text-primary flex items-center gap-2">
            <Swords className="w-5 h-5 text-orange-400" />
            Arena de Debates
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            Confronte experts para obter múltiplas perspectivas sobre um tema
          </p>
        </div>
        {sessionStarted && (
          <button
            onClick={resetDebate}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary border border-border-default rounded-lg hover:bg-bg-hover transition-colors"
          >
            <X className="w-4 h-4" />
            Nova sessão
          </button>
        )}
      </div>

      {!sessionStarted ? (
        /* SETUP */
        <div className="space-y-6">
          {/* Expert selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-text-primary">
                Selecionar Experts ({selectedExperts.length}/3)
              </h2>
              <p className="text-xs text-text-muted">Mínimo 2, máximo 3</p>
            </div>
            {loadingExperts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 bg-bg-secondary border border-border-default rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              <ExpertSelector
                experts={experts}
                selected={selectedExperts}
                onToggle={toggleExpert}
                max={3}
              />
            )}
          </div>

          {/* Topic */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Tema do Debate
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Qual framework converte mais em B2B? AIDA vs BANT vs Content Pillar"
              className="w-full px-3 py-2 text-sm bg-bg-secondary border border-border-default rounded-lg text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-primary transition-colors"
            />
          </div>

          {/* Framework */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Framework de Debate
            </label>
            <FrameworkSelect value={framework} onChange={setFramework} />
          </div>

          {/* Start button */}
          <button
            onClick={startDebate}
            disabled={!canStart}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-all ${
              canStart
                ? 'bg-accent-primary text-white hover:opacity-90'
                : 'bg-bg-secondary border border-border-default text-text-muted cursor-not-allowed'
            }`}
          >
            <Swords className="w-4 h-4" />
            Iniciar Debate
          </button>

          {!canStart && (
            <p className="text-xs text-text-muted text-center">
              Selecione pelo menos 2 experts e defina um tema
            </p>
          )}
        </div>
      ) : (
        /* DEBATE SESSION */
        <div className="space-y-4">
          {/* Session info */}
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-xs text-text-muted mb-1">Tema</p>
                <p className="text-sm font-semibold text-text-primary">{topic}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-text-muted mb-1">Framework</p>
                <p className="text-sm font-medium text-accent-primary">
                  {DEBATE_FRAMEWORKS.find((f) => f.value === framework)?.label}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-default">
              <p className="text-xs text-text-muted">Experts:</p>
              {selectedExpertObjects.map((e) => (
                <span key={e.id} className="text-xs px-2 py-0.5 bg-accent-primary/10 text-accent-primary rounded-full">
                  {e.name}
                </span>
              ))}
            </div>
          </div>

          {/* Chat */}
          <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  expert={experts.find((e) => e.id === msg.expert_id)}
                />
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-border-default p-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-text-muted flex-shrink-0" />
              <input
                type="text"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Fazer uma pergunta ou pedir uma perspectiva específica..."
                className="flex-1 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!userMessage.trim()}
                className="p-1.5 text-accent-primary hover:bg-accent-primary/10 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* LLM integration notice */}
          <div className="flex items-start gap-2 p-3 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
            <Sparkles className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-400">
              Modo demonstração — respostas simuladas. Integrar com OpenAI/Gemini para debates reais baseados nos frameworks de cada expert.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
