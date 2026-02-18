import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Swords, X, ChevronDown, Sparkles, Loader2, AlertCircle, RotateCcw } from 'lucide-react';
import { useAiosExperts } from '../../hooks/aios/useAiosExperts';
import { AiosExpert, ArenaDebateFramework, ArenaDebateMessage } from '../../types/aios';
import { callOpenRouter, getOpenRouterApiKey, OpenRouterMessage } from '../../lib/openrouter';

// =====================================================
// CONSTANTS
// =====================================================

const DEBATE_FRAMEWORKS: { value: ArenaDebateFramework; label: string; description: string }[] = [
  { value: 'socrático', label: 'Socrático', description: 'Questionar premissas até chegar à verdade' },
  { value: 'steelman', label: 'Steelman', description: 'Defender a versão mais forte do argumento oposto' },
  { value: 'devil_advocate', label: 'Advocatus Diaboli', description: 'Contra-argumentar qualquer posição' },
  { value: 'six_hats', label: '6 Chapéus', description: 'Analisar sob 6 perspectivas distintas' },
  { value: 'pro_con', label: 'Prós & Contras', description: 'Análise estruturada de vantagens e desvantagens' },
];

const EXPERT_COLORS = [
  { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
  { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
];

// =====================================================
// HELPERS
// =====================================================

function buildExpertSystemPrompt(expert: AiosExpert, framework: string): string {
  const frameworkNames = expert.frameworks.map((f) => f.name).join(', ');
  return `Você é ${expert.name}, especialista em ${expert.expertise}.
${expert.bio ? `Sua bio: ${expert.bio}` : ''}
${frameworkNames ? `Seus frameworks principais: ${frameworkNames}` : ''}

Regras do debate:
- Framework de debate: ${framework}
- Seja completamente fiel ao seu estilo e metodologia
- Argumente com exemplos concretos e práticos
- Máximo 200 palavras por resposta
- Escreva em português brasileiro
- Não se apresente no início da resposta — vá direto ao ponto
- Use linguagem direta e assertiva`;
}

function buildDebateMessages(
  expert: AiosExpert,
  framework: string,
  topic: string,
  history: ArenaDebateMessage[],
  allExperts: AiosExpert[],
  messageType: 'argument' | 'counter' | 'summary'
): OpenRouterMessage[] {
  const systemPrompt = buildExpertSystemPrompt(expert, framework);

  const conversationHistory: OpenRouterMessage[] = history.map((msg) => {
    const isCurrentExpert = msg.expert_id === expert.id;
    const content = isCurrentExpert
      ? msg.content
      : `[${msg.expert_name}]: ${msg.content}`;
    return {
      role: isCurrentExpert ? 'assistant' : 'user',
      content,
    };
  });

  let userPrompt: string;
  if (messageType === 'summary') {
    userPrompt = `Com base em todo o debate sobre "${topic}", forneça uma síntese integrando os melhores pontos de cada perspectiva. Identifique pontos de convergência e divergência. Máximo 250 palavras.`;
  } else if (history.length === 0) {
    userPrompt = `Apresente sua perspectiva inicial sobre o tema: "${topic}"`;
  } else {
    const lastMsg = history[history.length - 1];
    const lastExpert = allExperts.find((e) => e.id === lastMsg.expert_id);
    userPrompt = `[${lastExpert?.name ?? lastMsg.expert_name}] disse: "${lastMsg.content}"\n\nResponda com seu contra-argumento ou perspectiva complementar.`;
  }

  return [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: userPrompt },
  ];
}

// =====================================================
// SUB-COMPONENTS
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
      {experts.map((expert, idx) => {
        const isSelected = selected.includes(expert.id);
        const isDisabled = !isSelected && selected.length >= max;
        const colorIdx = selected.indexOf(expert.id);
        const color = colorIdx >= 0 ? EXPERT_COLORS[colorIdx] : null;

        return (
          <button
            key={expert.id}
            onClick={() => !isDisabled && onToggle(expert.id)}
            disabled={isDisabled}
            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
              isSelected && color
                ? `${color.border} ${color.bg}`
                : isDisabled
                ? 'border-border-default bg-bg-secondary opacity-40 cursor-not-allowed'
                : 'border-border-default bg-bg-secondary hover:bg-bg-hover cursor-pointer'
            }`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                isSelected && color ? `${color.bg} ${color.text}` : 'bg-accent-primary/20 text-accent-primary'
              }`}
            >
              {expert.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">{expert.name}</p>
              <p className="text-xs text-text-muted truncate">{expert.expertise}</p>
            </div>
            {isSelected && color && (
              <div className={`ml-auto flex-shrink-0 w-5 h-5 rounded-full ${color.bg} flex items-center justify-center`}>
                <span className={`text-[10px] font-bold ${color.text}`}>
                  {colorIdx + 1}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

function FrameworkSelect({
  value,
  onChange,
}: {
  value: ArenaDebateFramework;
  onChange: (v: ArenaDebateFramework) => void;
}) {
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

function ChatMessage({
  message,
  expertIndex,
}: {
  message: ArenaDebateMessage;
  expertIndex: number;
}) {
  const typeLabel = {
    argument: 'Argumento',
    counter: 'Contra-ponto',
    summary: 'Síntese Final',
  }[message.type];

  const color = EXPERT_COLORS[expertIndex] ?? EXPERT_COLORS[0];

  const isSummary = message.type === 'summary';

  return (
    <div className={`flex items-start gap-3 ${isSummary ? 'mt-2' : ''}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${color.bg} ${color.text}`}
      >
        {isSummary ? '∑' : message.expert_name.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-text-primary">{message.expert_name}</span>
          <span className={`text-[10px] ${color.text}`}>{typeLabel}</span>
          <span className="text-[10px] text-text-muted ml-auto">
            {new Date(message.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
        <div
          className={`border rounded-lg px-3 py-2 ${
            isSummary ? `${color.bg} ${color.border}` : 'bg-bg-tertiary border-border-default'
          }`}
        >
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    </div>
  );
}

function LoadingBubble({ expertName, color }: { expertName: string; color: typeof EXPERT_COLORS[0] }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${color.bg} ${color.text}`}>
        {expertName.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-text-primary">{expertName}</span>
          <Loader2 className="w-3 h-3 text-text-muted animate-spin" />
        </div>
        <div className="bg-bg-tertiary border border-border-default rounded-lg px-3 py-2">
          <div className="flex gap-1 items-center h-4">
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:0ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-text-muted animate-bounce [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export function AiosArena() {
  const { data: experts, loading: loadingExperts } = useAiosExperts();

  const [selectedExperts, setSelectedExperts] = useState<string[]>([]);
  const [topic, setTopic] = useState('');
  const [framework, setFramework] = useState<ArenaDebateFramework>('steelman');
  const [roundCount, setRoundCount] = useState(3);
  const [messages, setMessages] = useState<ArenaDebateMessage[]>([]);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingExpert, setLoadingExpert] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [debateFinished, setDebateFinished] = useState(false);
  const [autoMode, setAutoMode] = useState(true);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const hasApiKey = !!getOpenRouterApiKey();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const getExpertIndex = useCallback(
    (expertId: string) => selectedExperts.indexOf(expertId),
    [selectedExperts]
  );

  function toggleExpert(id: string) {
    setSelectedExperts((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  }

  async function generateExpertMessage(
    expert: AiosExpert,
    history: ArenaDebateMessage[],
    type: 'argument' | 'counter' | 'summary'
  ): Promise<string> {
    const frameworkLabel = DEBATE_FRAMEWORKS.find((f) => f.value === framework)?.label ?? framework;
    const messages = buildDebateMessages(expert, frameworkLabel, topic, history, experts, type);
    return callOpenRouter(messages, abortRef.current?.signal);
  }

  async function runDebateRound(currentMessages: ArenaDebateMessage[], round: number) {
    const expertObjects = selectedExperts.map((id) => experts.find((e) => e.id === id)).filter(Boolean) as AiosExpert[];
    const updatedMessages = [...currentMessages];

    for (let i = 0; i < expertObjects.length; i++) {
      const expert = expertObjects[i];
      const isFirst = round === 0 && i === 0;
      const type: 'argument' | 'counter' = isFirst ? 'argument' : 'counter';

      setLoadingExpert(expert.name);

      try {
        const content = await generateExpertMessage(expert, updatedMessages, type);
        const newMsg: ArenaDebateMessage = {
          id: `msg-${Date.now()}-${i}`,
          expert_id: expert.id,
          expert_name: expert.name,
          content,
          timestamp: new Date().toISOString(),
          type,
        };
        updatedMessages.push(newMsg);
        setMessages([...updatedMessages]);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        throw err;
      }
    }

    return updatedMessages;
  }

  async function startDebate() {
    if (selectedExperts.length < 2 || !topic.trim() || !hasApiKey) return;

    abortRef.current = new AbortController();
    setIsLoading(true);
    setError(null);
    setSessionStarted(true);
    setMessages([]);
    setCurrentRound(0);
    setDebateFinished(false);

    try {
      let history: ArenaDebateMessage[] = [];

      for (let round = 0; round < roundCount; round++) {
        setCurrentRound(round + 1);
        history = (await runDebateRound(history, round)) ?? history;
      }

      // Gerar resumo final com o primeiro expert
      const firstExpert = experts.find((e) => e.id === selectedExperts[0]);
      if (firstExpert) {
        setLoadingExpert(`Síntese — ${firstExpert.name}`);
        const summaryContent = await generateExpertMessage(firstExpert, history, 'summary');
        const summaryMsg: ArenaDebateMessage = {
          id: `msg-summary-${Date.now()}`,
          expert_id: firstExpert.id,
          expert_name: `Síntese do Debate`,
          content: summaryContent,
          timestamp: new Date().toISOString(),
          type: 'summary',
        };
        setMessages((prev) => [...prev, summaryMsg]);
      }

      setDebateFinished(true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
      }
    } finally {
      setIsLoading(false);
      setLoadingExpert(null);
    }
  }

  async function sendUserMessage() {
    if (!userMessage.trim() || isLoading) return;

    const userMsg: ArenaDebateMessage = {
      id: `msg-user-${Date.now()}`,
      expert_id: 'user',
      expert_name: 'Você',
      content: userMessage,
      timestamp: new Date().toISOString(),
      type: 'argument',
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setUserMessage('');
    setIsLoading(true);
    setError(null);

    abortRef.current = new AbortController();

    try {
      // Responder com todos os experts selecionados em sequência
      const expertObjects = selectedExperts
        .map((id) => experts.find((e) => e.id === id))
        .filter(Boolean) as AiosExpert[];

      let history = [...newMessages];

      for (const expert of expertObjects) {
        setLoadingExpert(expert.name);
        const content = await generateExpertMessage(expert, history, 'counter');
        const response: ArenaDebateMessage = {
          id: `msg-${Date.now()}-resp`,
          expert_id: expert.id,
          expert_name: expert.name,
          content,
          timestamp: new Date().toISOString(),
          type: 'counter',
        };
        history = [...history, response];
        setMessages([...history]);
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
      }
    } finally {
      setIsLoading(false);
      setLoadingExpert(null);
    }
  }

  async function generateSummary() {
    if (isLoading || messages.length === 0) return;

    const firstExpert = experts.find((e) => e.id === selectedExperts[0]);
    if (!firstExpert) return;

    setIsLoading(true);
    setLoadingExpert('Síntese Final');
    setError(null);
    abortRef.current = new AbortController();

    try {
      const content = await generateExpertMessage(firstExpert, messages, 'summary');
      const summaryMsg: ArenaDebateMessage = {
        id: `msg-summary-${Date.now()}`,
        expert_id: firstExpert.id,
        expert_name: 'Síntese do Debate',
        content,
        timestamp: new Date().toISOString(),
        type: 'summary',
      };
      setMessages((prev) => [...prev, summaryMsg]);
      setDebateFinished(true);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        setError((err as Error).message);
      }
    } finally {
      setIsLoading(false);
      setLoadingExpert(null);
    }
  }

  function stopDebate() {
    abortRef.current?.abort();
    setIsLoading(false);
    setLoadingExpert(null);
  }

  function resetDebate() {
    abortRef.current?.abort();
    setSessionStarted(false);
    setMessages([]);
    setSelectedExperts([]);
    setTopic('');
    setUserMessage('');
    setError(null);
    setCurrentRound(0);
    setDebateFinished(false);
    setIsLoading(false);
    setLoadingExpert(null);
  }

  const selectedExpertObjects = experts.filter((e) => selectedExperts.includes(e.id));
  const canStart = selectedExperts.length >= 2 && topic.trim().length > 0 && hasApiKey;

  // Expert color lookup by position in selectedExperts
  const expertColorMap = Object.fromEntries(
    selectedExperts.map((id, idx) => [id, EXPERT_COLORS[idx] ?? EXPERT_COLORS[0]])
  );
  // For summary messages
  const summaryColor = EXPERT_COLORS[2] ?? EXPERT_COLORS[0];

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
          <div className="flex items-center gap-2">
            {isLoading && (
              <button
                onClick={stopDebate}
                className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-400 border border-red-400/30 rounded-lg hover:bg-red-400/10 transition-colors"
              >
                <X className="w-4 h-4" />
                Parar
              </button>
            )}
            <button
              onClick={resetDebate}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-text-secondary border border-border-default rounded-lg hover:bg-bg-hover transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Nova sessão
            </button>
          </div>
        )}
      </div>

      {/* API Key warning */}
      {!hasApiKey && (
        <div className="flex items-start gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">
            Configure <code className="font-mono bg-red-400/10 px-1 rounded">VITE_OPENROUTER_API_KEY</code> no arquivo{' '}
            <code className="font-mono bg-red-400/10 px-1 rounded">.env</code> para habilitar debates reais com LLM.
          </p>
        </div>
      )}

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

          {/* Rounds */}
          <div>
            <label className="block text-sm font-semibold text-text-primary mb-2">
              Número de Rodadas ({roundCount})
            </label>
            <input
              type="range"
              min={2}
              max={5}
              value={roundCount}
              onChange={(e) => setRoundCount(Number(e.target.value))}
              className="w-full accent-accent-primary"
            />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>2 rodadas</span>
              <span>5 rodadas</span>
            </div>
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

          {!canStart && hasApiKey && (
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
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border-default flex-wrap">
              <p className="text-xs text-text-muted">Experts:</p>
              {selectedExpertObjects.map((e, idx) => {
                const color = EXPERT_COLORS[idx] ?? EXPERT_COLORS[0];
                return (
                  <span key={e.id} className={`text-xs px-2 py-0.5 ${color.bg} ${color.text} rounded-full`}>
                    {e.name}
                  </span>
                );
              })}
              {isLoading && (
                <span className="ml-auto text-xs text-text-muted flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Rodada {currentRound}/{roundCount} — {loadingExpert}
                </span>
              )}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-400/10 border border-red-400/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-400">{error}</p>
            </div>
          )}

          {/* Chat */}
          <div className="bg-bg-secondary border border-border-default rounded-lg overflow-hidden">
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {messages.map((msg) => {
                const isSummary = msg.type === 'summary';
                const color = isSummary
                  ? summaryColor
                  : (expertColorMap[msg.expert_id] ?? EXPERT_COLORS[0]);
                const expertIdx = isSummary ? 2 : selectedExperts.indexOf(msg.expert_id);
                return (
                  <ChatMessage
                    key={msg.id}
                    message={msg}
                    expertIndex={Math.max(0, expertIdx)}
                  />
                );
              })}

              {/* Loading bubble */}
              {isLoading && loadingExpert && (
                <LoadingBubble
                  expertName={loadingExpert}
                  color={EXPERT_COLORS[0]}
                />
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            {!isLoading && (
              <div className="border-t border-border-default">
                {/* Action buttons */}
                {messages.length > 0 && !debateFinished && (
                  <div className="flex items-center gap-2 px-3 pt-2">
                    <button
                      onClick={generateSummary}
                      disabled={isLoading}
                      className="text-xs px-3 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition-colors"
                    >
                      <Sparkles className="w-3 h-3 inline mr-1" />
                      Gerar Síntese
                    </button>
                  </div>
                )}

                {/* User input */}
                <div className="p-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <input
                    type="text"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendUserMessage()}
                    placeholder="Fazer uma pergunta ou pedir uma perspectiva específica..."
                    className="flex-1 text-sm bg-transparent text-text-primary placeholder:text-text-muted focus:outline-none"
                  />
                  <button
                    onClick={sendUserMessage}
                    disabled={!userMessage.trim() || isLoading}
                    className="p-1.5 text-accent-primary hover:bg-accent-primary/10 rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
