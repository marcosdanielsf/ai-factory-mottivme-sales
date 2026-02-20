import React, { useState, useMemo } from 'react';
import {
  Copy,
  MessageSquare,
  Brain,
  TrendingUp,
  Users,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useOwnerMessages, OwnerMessage, PersonalityProfile } from '../../hooks/useOwnerMessages';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// ============= STAT CARD =============
function StatCard({ icon: Icon, label, value, sub }: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon size={16} className="text-accent-primary" />
        <span className="text-text-muted text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-text-primary">{value}</p>
      {sub && <p className="text-text-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ============= MESSAGE ROW =============
function MessageRow({ msg }: { msg: OwnerMessage }) {
  const [expanded, setExpanded] = useState(false);
  const time = new Date(msg.message_timestamp).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  });
  const preview = msg.content.length > 120 ? msg.content.substring(0, 120) + '...' : msg.content;

  return (
    <div
      className="bg-bg-secondary border border-border-default rounded-lg p-3 hover:border-accent-primary/50 cursor-pointer transition-colors"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-text-muted text-xs">{time}</span>
            {msg.is_group && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent-primary/20 text-accent-primary">grupo</span>
            )}
            <span className="text-text-muted text-xs">{msg.phone_to}</span>
          </div>
          <p className="text-text-primary text-sm">{expanded ? msg.content : preview}</p>
        </div>
        <div className="flex items-center gap-1 text-text-muted">
          <span className="text-xs">{msg.word_count}w</span>
          {msg.content.length > 120 && (expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
        </div>
      </div>
    </div>
  );
}

// ============= PERSONALITY CARD =============
function PersonalityCard({ profile }: { profile: PersonalityProfile }) {
  return (
    <div className="bg-bg-secondary border border-border-default rounded-lg p-5 space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Brain size={18} className="text-accent-primary" />
        <h3 className="text-text-primary font-semibold">Perfil de Personalidade</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <p className="text-text-muted text-xs mb-1">Tom de voz</p>
          <p className="text-text-primary text-sm">{profile.tom_de_voz}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs mb-1">Assertividade</p>
          <p className="text-text-primary text-sm">{profile.nivel_assertividade}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs mb-1">Pontuacao</p>
          <p className="text-text-primary text-sm">{profile.uso_pontuacao}</p>
        </div>
        <div>
          <p className="text-text-muted text-xs mb-1">Msg media</p>
          <p className="text-text-primary text-sm">{profile.comprimento_medio_mensagem} palavras</p>
        </div>
      </div>

      <div>
        <p className="text-text-muted text-xs mb-1">Como da instrucoes</p>
        <p className="text-text-primary text-sm">{profile.estilo_instrucoes}</p>
      </div>
      <div>
        <p className="text-text-muted text-xs mb-1">Como pede favores</p>
        <p className="text-text-primary text-sm">{profile.estilo_pedidos}</p>
      </div>

      {profile.vocabulario_frequente?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs mb-2">Vocabulario frequente</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.vocabulario_frequente.slice(0, 30).map((word, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-accent-primary/10 text-accent-primary">
                {word}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.girias_expressoes?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs mb-2">Girias e expressoes</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.girias_expressoes.map((exp, i) => (
              <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-bg-tertiary text-text-secondary">
                {exp}
              </span>
            ))}
          </div>
        </div>
      )}

      {profile.emojis_frequentes?.length > 0 && (
        <div>
          <p className="text-text-muted text-xs mb-2">Emojis</p>
          <p className="text-lg">{profile.emojis_frequentes.join(' ')}</p>
        </div>
      )}

      {profile.resumo_geral && (
        <div className="border-t border-border-default pt-3 mt-3">
          <p className="text-text-muted text-xs mb-1">Resumo</p>
          <p className="text-text-secondary text-sm whitespace-pre-line">{profile.resumo_geral}</p>
        </div>
      )}
    </div>
  );
}

// ============= MAIN PAGE =============
export function CloneDashboard() {
  const { messages, stats, profile, loading, error, totalCount, refetch } = useOwnerMessages();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'messages' | 'profile' | 'stats'>('messages');

  const filteredMessages = useMemo(() => {
    if (!search.trim()) return messages;
    const q = search.toLowerCase();
    return messages.filter(m =>
      m.content.toLowerCase().includes(q) || m.phone_to.includes(q)
    );
  }, [messages, search]);

  const chartData = useMemo(() =>
    [...stats].reverse().map(s => ({
      dia: new Date(s.dia).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
      total: s.total_msgs,
      avg_words: Math.round(s.avg_words),
      direct: s.direct_msgs,
      group: s.group_msgs,
    })),
    [stats]
  );

  const avgWords = useMemo(() => {
    if (messages.length === 0) return 0;
    const total = messages.reduce((acc, m) => acc + (m.word_count || 0), 0);
    return Math.round(total / messages.length);
  }, [messages]);

  const groupCount = useMemo(() => messages.filter(m => m.is_group).length, [messages]);

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-4 md:p-8 flex flex-col items-center justify-center min-h-[400px] text-center">
        <p className="text-text-muted mb-4">{error}</p>
        <button onClick={() => refetch()} className="flex items-center gap-2 px-4 py-2 bg-accent-primary text-white rounded-lg text-sm">
          <RefreshCw size={14} /> Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border-default pb-4 md:pb-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2 text-text-primary">
            <Copy className="text-accent-primary" size={22} />
            Clone do Marcos
          </h1>
          <p className="text-text-secondary text-xs md:text-sm mt-1">
            Coleta de mensagens + perfil de personalidade para treinar o clone
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-2 px-4 py-2 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-secondary hover:border-accent-primary/50 transition-colors"
        >
          <RefreshCw size={14} /> Atualizar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard icon={MessageSquare} label="Total coletadas" value={totalCount.toLocaleString('pt-BR')} />
        <StatCard icon={TrendingUp} label="Media palavras/msg" value={avgWords} />
        <StatCard icon={Users} label="Em grupos" value={groupCount} sub={`de ${messages.length} exibidas`} />
        <StatCard icon={Brain} label="Perfil" value={profile ? 'Ativo' : 'Pendente'} sub={profile ? 'Analise concluida' : 'Rode /analyze-personality'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-tertiary p-1 rounded-lg w-fit">
        {([
          { key: 'messages', label: 'Mensagens' },
          { key: 'profile', label: 'Personalidade' },
          { key: 'stats', label: 'Estatisticas' },
        ] as const).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-md text-sm transition-colors ${
              tab === t.key
                ? 'bg-accent-primary text-white'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Messages */}
      {tab === 'messages' && (
        <>
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Buscar mensagens..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-bg-tertiary border border-border-default rounded-lg text-sm text-text-primary placeholder:text-text-muted focus:border-accent-primary outline-none"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-bg-secondary border border-border-default rounded-lg p-4 animate-pulse h-16" />
              ))}
            </div>
          ) : filteredMessages.length === 0 ? (
            <div className="text-center py-12 text-text-muted">
              <MessageSquare size={32} className="mx-auto mb-3 opacity-40" />
              <p>Nenhuma mensagem coletada ainda.</p>
              <p className="text-xs mt-1">Configure CLONE_COLLECTOR_ENABLED=true no Railway</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMessages.map(msg => (
                <MessageRow key={msg.id} msg={msg} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Tab: Personality */}
      {tab === 'profile' && (
        profile ? (
          <PersonalityCard profile={profile} />
        ) : (
          <div className="text-center py-12 text-text-muted">
            <Brain size={32} className="mx-auto mb-3 opacity-40" />
            <p>Perfil de personalidade ainda nao gerado.</p>
            <p className="text-xs mt-2">Colete pelo menos 10 mensagens e depois chame:</p>
            <code className="text-xs bg-bg-tertiary px-3 py-1 rounded mt-2 inline-block text-text-secondary">
              POST /api/jarvis/analyze-personality
            </code>
          </div>
        )
      )}

      {/* Tab: Stats */}
      {tab === 'stats' && (
        <div className="space-y-5">
          {chartData.length > 0 ? (
            <div className="bg-bg-secondary border border-border-default rounded-lg p-5">
              <h3 className="text-text-primary font-semibold text-sm mb-4">Mensagens por dia</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="direct" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.4} name="Diretas" />
                    <Area type="monotone" dataKey="group" stackId="1" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.3} name="Grupos" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-text-muted">
              <TrendingUp size={32} className="mx-auto mb-3 opacity-40" />
              <p>Sem dados estatisticos ainda.</p>
            </div>
          )}

          {chartData.length > 0 && (
            <div className="bg-bg-secondary border border-border-default rounded-lg p-5">
              <h3 className="text-text-primary font-semibold text-sm mb-4">Media de palavras por dia</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-default)" />
                    <XAxis dataKey="dia" tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'var(--color-bg-secondary)',
                        border: '1px solid var(--color-border-default)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                    />
                    <Area type="monotone" dataKey="avg_words" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} name="Palavras/msg" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default CloneDashboard;
