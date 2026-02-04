# Roadmap de Features - Self-Improving AI System

## Contexto

Análise baseada nos prints do Starter Kit (Mark Kashef) e Quick Start Guide para identificar features que podem ser implementadas no AI Factory V3.

---

## 📊 Features Identificadas

### Prioridade 1: Autonomia do CS

| Feature | Descrição | Impacto | Esforço |
|---------|-----------|---------|---------|
| **Chat de Ajustes** ✅ | Interface natural para CS ajustar prompts | Alto | Médio |
| **Reflection Settings UI** | Configurar thresholds sem código | Alto | Baixo |
| **Experience Suggestions** | Aprovar/rejeitar sugestões visualmente | Alto | Médio |

### Prioridade 2: Visibilidade Total

| Feature | Descrição | Impacto | Esforço |
|---------|-----------|---------|---------|
| **Reflection Logs** | Ver histórico de reflexões e decisões | Médio | Baixo |
| **Prompt History** | Histórico de versões com "Revert" | Alto | Baixo |
| **Alertas Inteligentes** | Notificações quando score cai | Médio | Médio |

### Prioridade 3: Otimização com Dados

| Feature | Descrição | Impacto | Esforço |
|---------|-----------|---------|---------|
| **A/B Testing de Prompts** | Testar 2 versões simultaneamente | Alto | Alto |
| **ROI Dashboard** | Medir impacto financeiro das melhorias | Médio | Alto |
| **Predictive Analytics** | Prever problemas antes de acontecerem | Baixo | Alto |

---

## 🎯 Matriz Impacto vs Esforço

```
                    ALTO IMPACTO
                         │
     Chat de Ajustes     │     A/B Testing
     [✓ ESPECIFICADO]    │     [A ESPECIFICAR]
                         │
                         │
   Experience Suggestions│     ROI Dashboard
                         │
   ─────────────────────┼─────────────────────
   BAIXO ESFORÇO        │         ALTO ESFORÇO
                         │
   Reflection Settings   │     Predictive Analytics
                         │
   Prompt History        │
   Reflection Logs       │
                         │
                    BAIXO IMPACTO
```

---

## 📋 Fase 1: Autonomia do CS

### 1.1 Chat de Ajustes ✅
**Status:** Especificado em `CHAT-DE-AJUSTES-CS.md`

### 1.2 Reflection Settings UI

**Objetivo:** Permitir configurar os parâmetros do Reflection Loop sem código.

**Baseado no print:** `Xnip2025-12-23_04-04-38.png`

**Campos configuráveis:**
- **Reflection Interval** (minutos): De quanto em quanto tempo roda
- **Score Threshold** (0.0 - 10.0): Nota mínima para considerar OK
- **Weakness Repeat** (número): Quantas vezes uma fraqueza precisa aparecer
- **Messages to Evaluate** (número): Quantas mensagens avaliar por vez
- **Auto-Apply Changes** (boolean): Aplicar mudanças automaticamente ou aguardar aprovação

**Schema SQL:**
```sql
-- Tabela já existe em 001_self_improving_system.sql como self_improving_settings
-- Apenas precisa de UI para editar

-- Campos existentes:
-- reflection_interval_minutes INTEGER DEFAULT 120
-- min_messages_to_reflect INTEGER DEFAULT 10
-- score_threshold DECIMAL(3,2) DEFAULT 7.00
-- auto_apply_improvements BOOLEAN DEFAULT false

-- Campos a adicionar:
ALTER TABLE self_improving_settings
ADD COLUMN IF NOT EXISTS weakness_repeat_threshold INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS messages_to_evaluate INTEGER DEFAULT 20,
ADD COLUMN IF NOT EXISTS alert_on_low_score BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS alert_threshold DECIMAL(3,2) DEFAULT 5.00;
```

**Componente React:**
```tsx
// components/reflection/ReflectionSettings.tsx
interface ReflectionConfig {
  reflection_interval_minutes: number;
  score_threshold: number;
  weakness_repeat_threshold: number;
  messages_to_evaluate: number;
  auto_apply_improvements: boolean;
  alert_on_low_score: boolean;
  alert_threshold: number;
}

export function ReflectionSettings({ agentId }: { agentId: string }) {
  const [config, setConfig] = useState<ReflectionConfig | null>(null);

  return (
    <Card>
      <CardHeader>
        <CardTitle>⚙️ Reflection Settings</CardTitle>
        <CardDescription>
          Configure os parâmetros do loop de auto-melhoria
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">

        {/* Intervalo */}
        <div className="space-y-2">
          <Label>Intervalo de Reflexão</Label>
          <div className="flex items-center gap-4">
            <Slider
              min={30} max={480} step={30}
              value={[config.reflection_interval_minutes]}
              onValueChange={([v]) => updateConfig('reflection_interval_minutes', v)}
            />
            <span className="w-20 text-right">
              {config.reflection_interval_minutes} min
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            A cada quanto tempo o sistema analisa as conversas
          </p>
        </div>

        {/* Score Threshold */}
        <div className="space-y-2">
          <Label>Score Threshold</Label>
          <div className="flex items-center gap-4">
            <Slider
              min={1} max={10} step={0.5}
              value={[config.score_threshold]}
              onValueChange={([v]) => updateConfig('score_threshold', v)}
            />
            <span className="w-16 text-right font-mono">
              {config.score_threshold.toFixed(1)}
            </span>
          </div>
          <p className="text-xs text-zinc-500">
            Nota mínima para considerar a performance OK
          </p>
        </div>

        {/* Weakness Repeat */}
        <div className="space-y-2">
          <Label>Repetições de Fraqueza</Label>
          <div className="flex items-center gap-4">
            <Slider
              min={1} max={10} step={1}
              value={[config.weakness_repeat_threshold]}
              onValueChange={([v]) => updateConfig('weakness_repeat_threshold', v)}
            />
            <span className="w-16 text-right">{config.weakness_repeat_threshold}x</span>
          </div>
          <p className="text-xs text-zinc-500">
            Quantas vezes uma fraqueza precisa aparecer para gerar sugestão
          </p>
        </div>

        {/* Messages to Evaluate */}
        <div className="space-y-2">
          <Label>Mensagens por Avaliação</Label>
          <div className="flex items-center gap-4">
            <Slider
              min={5} max={100} step={5}
              value={[config.messages_to_evaluate]}
              onValueChange={([v]) => updateConfig('messages_to_evaluate', v)}
            />
            <span className="w-16 text-right">{config.messages_to_evaluate}</span>
          </div>
          <p className="text-xs text-zinc-500">
            Quantas mensagens avaliar em cada ciclo
          </p>
        </div>

        <Separator />

        {/* Auto Apply */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Auto-aplicar Melhorias</Label>
            <p className="text-xs text-zinc-500">
              Aplicar sugestões aprovadas automaticamente
            </p>
          </div>
          <Switch
            checked={config.auto_apply_improvements}
            onCheckedChange={(v) => updateConfig('auto_apply_improvements', v)}
          />
        </div>

        {/* Alertas */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Alertar Score Baixo</Label>
            <p className="text-xs text-zinc-500">
              Notificar quando score cair abaixo de {config.alert_threshold}
            </p>
          </div>
          <Switch
            checked={config.alert_on_low_score}
            onCheckedChange={(v) => updateConfig('alert_on_low_score', v)}
          />
        </div>

      </CardContent>
      <CardFooter>
        <Button onClick={saveConfig} className="w-full">
          💾 Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
}
```

---

### 1.3 Experience Suggestions UI

**Objetivo:** Interface visual para aprovar/rejeitar sugestões de melhoria geradas pelo Reflection Loop.

**Baseado no print:** `Xnip2025-12-23_04-06-39.png`

**Schema SQL (já existe em 001):**
```sql
-- Tabela improvement_suggestions já existe
-- Precisa adicionar campos para categorização

ALTER TABLE improvement_suggestions
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS category VARCHAR(50),
ADD COLUMN IF NOT EXISTS impact_estimate TEXT,
ADD COLUMN IF NOT EXISTS implementation_difficulty VARCHAR(20);

-- Valores de priority: high, medium, low
-- Valores de category: guardrails, persona, few_shot, knowledge, tools
-- Valores de difficulty: easy, medium, hard
```

**Componente React:**
```tsx
// components/suggestions/SuggestionsList.tsx
interface Suggestion {
  id: string;
  content: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  impact_estimate: string;
  created_at: string;
  weakness_pattern: string;
  status: 'pending' | 'approved' | 'rejected';
}

export function SuggestionsList({ agentId }: { agentId: string }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [filter, setFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const handleApprove = async (id: string) => {
    await api.post(`/suggestions/${id}/approve`);
    refetch();
    toast.success('Sugestão aprovada! Será aplicada no próximo ciclo.');
  };

  const handleReject = async (id: string, reason: string) => {
    await api.post(`/suggestions/${id}/reject`, { reason });
    refetch();
    toast.info('Sugestão rejeitada.');
  };

  const priorityColors = {
    high: 'bg-red-500/20 text-red-400 border-red-500/30',
    medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/20 text-blue-400 border-blue-500/30'
  };

  const priorityLabels = {
    high: '🔴 Alta',
    medium: '🟡 Média',
    low: '🔵 Baixa'
  };

  return (
    <div className="space-y-4">
      {/* Header com filtros */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Sugestões de Melhoria</h2>
        <div className="flex gap-2">
          {['all', 'high', 'medium', 'low'].map((f) => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(f as any)}
            >
              {f === 'all' ? 'Todas' : priorityLabels[f]}
            </Button>
          ))}
        </div>
      </div>

      {/* Lista de sugestões */}
      <div className="space-y-3">
        {suggestions
          .filter(s => filter === 'all' || s.priority === filter)
          .map((suggestion) => (
            <Card key={suggestion.id} className="overflow-hidden">
              <div className="flex">
                {/* Priority indicator */}
                <div className={`w-1 ${
                  suggestion.priority === 'high' ? 'bg-red-500' :
                  suggestion.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />

                <div className="flex-1 p-4">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={priorityColors[suggestion.priority]}>
                        {priorityLabels[suggestion.priority]}
                      </Badge>
                      <Badge variant="outline">{suggestion.category}</Badge>
                    </div>
                    <span className="text-xs text-zinc-500">
                      {formatRelativeTime(suggestion.created_at)}
                    </span>
                  </div>

                  {/* Weakness Pattern */}
                  <div className="text-sm text-zinc-400 mb-2">
                    <span className="text-zinc-500">Padrão detectado:</span>{' '}
                    {suggestion.weakness_pattern}
                  </div>

                  {/* Content */}
                  <p className="text-sm mb-3">{suggestion.content}</p>

                  {/* Impact */}
                  {suggestion.impact_estimate && (
                    <div className="text-xs text-zinc-500 mb-3">
                      💡 Impacto estimado: {suggestion.impact_estimate}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="default"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() => handleApprove(suggestion.id)}
                    >
                      ✓ Aprovar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-400 hover:bg-red-500/10"
                      onClick={() => {
                        const reason = prompt('Motivo da rejeição (opcional):');
                        handleReject(suggestion.id, reason || '');
                      }}
                    >
                      ✗ Rejeitar
                    </Button>
                    <Button size="sm" variant="ghost">
                      👁️ Ver Detalhes
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </div>

      {/* Empty state */}
      {suggestions.length === 0 && (
        <div className="text-center py-12 text-zinc-500">
          <span className="text-4xl">🎉</span>
          <p className="mt-2">Nenhuma sugestão pendente!</p>
          <p className="text-sm">O agente está performando bem.</p>
        </div>
      )}
    </div>
  );
}
```

---

## 📋 Fase 2: Visibilidade Total

### 2.1 Reflection Logs

**Objetivo:** Visualizar histórico de todas as reflexões executadas.

**Baseado no print:** `Xnip2025-12-23_04-06-27.png`

**Schema (já existe):**
```sql
-- Tabela reflection_logs já existe
-- View vw_self_improving_summary já existe
```

**Componente React:**
```tsx
// components/reflection/ReflectionLogs.tsx
interface ReflectionLog {
  id: string;
  run_at: string;
  decision: 'improved' | 'kept' | 'failed';
  avg_score: number;
  messages_analyzed: number;
  weaknesses_found: string[];
  new_version?: string;
  improvements_applied?: string[];
}

export function ReflectionLogs({ agentId }: { agentId: string }) {
  const [logs, setLogs] = useState<ReflectionLog[]>([]);

  const decisionStyles = {
    improved: { icon: '✅', label: 'Melhorado', color: 'text-green-400' },
    kept: { icon: '➖', label: 'Mantido', color: 'text-zinc-400' },
    failed: { icon: '❌', label: 'Falhou', color: 'text-red-400' }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Histórico de Reflexões</h2>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-40">Data/Hora</TableHead>
            <TableHead className="w-24">Decisão</TableHead>
            <TableHead className="w-24">Score Médio</TableHead>
            <TableHead>Fraquezas</TableHead>
            <TableHead className="w-24">Versão</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="font-mono text-xs">
                {formatDateTime(log.run_at)}
              </TableCell>
              <TableCell>
                <span className={decisionStyles[log.decision].color}>
                  {decisionStyles[log.decision].icon}{' '}
                  {decisionStyles[log.decision].label}
                </span>
              </TableCell>
              <TableCell>
                <ScoreBadge score={log.avg_score} />
              </TableCell>
              <TableCell>
                {log.weaknesses_found.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {log.weaknesses_found.slice(0, 3).map((w, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {w}
                      </Badge>
                    ))}
                    {log.weaknesses_found.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{log.weaknesses_found.length - 3}
                      </Badge>
                    )}
                  </div>
                ) : (
                  <span className="text-zinc-500">-</span>
                )}
              </TableCell>
              <TableCell className="font-mono">
                {log.new_version || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 8 ? 'bg-green-500/20 text-green-400' :
                score >= 6 ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-red-500/20 text-red-400';

  return (
    <Badge className={color}>
      {score.toFixed(1)}
    </Badge>
  );
}
```

---

### 2.2 Prompt History

**Objetivo:** Ver todas as versões do prompt com opção de rollback.

**Baseado no print:** `Xnip2025-12-23_04-05-52.png`

**Componente React:**
```tsx
// components/prompts/PromptHistory.tsx
interface PromptVersion {
  id: string;
  version: string;
  content: string;
  created_at: string;
  created_by: string;
  change_reason?: string;
  is_active: boolean;
  performance_data?: {
    avg_score: number;
    conversations: number;
  };
}

export function PromptHistory({ agentId }: { agentId: string }) {
  const [versions, setVersions] = useState<PromptVersion[]>([]);
  const [selectedVersion, setSelectedVersion] = useState<PromptVersion | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareWith, setCompareWith] = useState<PromptVersion | null>(null);

  const handleRevert = async (versionId: string) => {
    if (!confirm('Tem certeza que deseja reverter para esta versão?')) return;

    await api.post(`/prompts/${versionId}/revert`);
    toast.success('Prompt revertido com sucesso!');
    refetch();
  };

  return (
    <div className="flex h-[600px]">
      {/* Lista de versões */}
      <div className="w-80 border-r border-zinc-800 overflow-y-auto">
        <div className="p-4 border-b border-zinc-800 sticky top-0 bg-zinc-950">
          <h2 className="font-semibold">Histórico de Versões</h2>
          <p className="text-xs text-zinc-500">{versions.length} versões</p>
        </div>

        <div className="divide-y divide-zinc-800">
          {versions.map((version) => (
            <div
              key={version.id}
              className={`p-4 cursor-pointer hover:bg-zinc-900 ${
                selectedVersion?.id === version.id ? 'bg-zinc-900' : ''
              } ${version.is_active ? 'border-l-2 border-green-500' : ''}`}
              onClick={() => setSelectedVersion(version)}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-mono font-semibold">
                  v{version.version}
                </span>
                {version.is_active && (
                  <Badge className="bg-green-500/20 text-green-400">
                    Ativo
                  </Badge>
                )}
              </div>

              <div className="text-xs text-zinc-500 mb-1">
                {formatDateTime(version.created_at)}
              </div>

              {version.change_reason && (
                <div className="text-xs text-zinc-400 truncate">
                  {version.change_reason}
                </div>
              )}

              {version.performance_data && (
                <div className="flex items-center gap-2 mt-2 text-xs">
                  <ScoreBadge score={version.performance_data.avg_score} />
                  <span className="text-zinc-500">
                    {version.performance_data.conversations} conversas
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Preview da versão */}
      <div className="flex-1 flex flex-col">
        {selectedVersion ? (
          <>
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">
                  Versão {selectedVersion.version}
                </h3>
                <p className="text-xs text-zinc-500">
                  Por {selectedVersion.created_by} em{' '}
                  {formatDateTime(selectedVersion.created_at)}
                </p>
              </div>
              <div className="flex gap-2">
                {!selectedVersion.is_active && (
                  <Button
                    size="sm"
                    onClick={() => handleRevert(selectedVersion.id)}
                  >
                    ↩️ Reverter para esta versão
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setCompareMode(!compareMode)}
                >
                  📊 Comparar
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {compareMode && compareWith ? (
                <DiffView
                  before={compareWith.content}
                  after={selectedVersion.content}
                />
              ) : (
                <pre className="text-sm font-mono whitespace-pre-wrap bg-zinc-900 p-4 rounded-lg">
                  {selectedVersion.content}
                </pre>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            Selecione uma versão para visualizar
          </div>
        )}
      </div>
    </div>
  );
}
```

---

### 2.3 Alertas Inteligentes

**Objetivo:** Sistema de notificações para eventos importantes.

**Eventos que geram alerta:**
- Score médio cai abaixo do threshold
- Mesma fraqueza aparece X vezes
- Agente não responde há Y minutos
- Erro no Reflection Loop
- Nova sugestão de alta prioridade

**Schema SQL:**
```sql
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Escopo
  agent_version_id UUID REFERENCES agent_versions(id),
  location_id VARCHAR(255),

  -- Alerta
  alert_type VARCHAR(50) NOT NULL,
  -- 'low_score', 'repeated_weakness', 'agent_offline', 'reflection_error', 'high_priority_suggestion'

  severity VARCHAR(20) DEFAULT 'warning',
  -- 'info', 'warning', 'critical'

  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,

  -- Dados contextuais
  context JSONB DEFAULT '{}',
  -- Ex: {"score": 4.5, "threshold": 6.0, "weakness": "tom formal"}

  -- Status
  status VARCHAR(20) DEFAULT 'active',
  -- 'active', 'acknowledged', 'resolved', 'dismissed'

  acknowledged_by VARCHAR(255),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_status ON system_alerts(status, created_at DESC);
CREATE INDEX idx_alerts_agent ON system_alerts(agent_version_id, status);

-- Função para criar alerta
CREATE OR REPLACE FUNCTION create_alert(
  p_agent_id UUID,
  p_type VARCHAR,
  p_severity VARCHAR,
  p_title VARCHAR,
  p_message TEXT,
  p_context JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO system_alerts (agent_version_id, alert_type, severity, title, message, context)
  VALUES (p_agent_id, p_type, p_severity, p_title, p_message, p_context)
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql;
```

**Componente React:**
```tsx
// components/alerts/AlertsBell.tsx
export function AlertsBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="relative">
          🔔
          {activeAlerts.length > 0 && (
            <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-xs flex items-center justify-center ${
              criticalCount > 0 ? 'bg-red-500' : 'bg-yellow-500'
            }`}>
              {activeAlerts.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="p-3 border-b border-zinc-800">
          <h3 className="font-semibold">Alertas</h3>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {activeAlerts.length === 0 ? (
            <div className="p-4 text-center text-zinc-500">
              Nenhum alerta ativo
            </div>
          ) : (
            activeAlerts.map((alert) => (
              <AlertItem
                key={alert.id}
                alert={alert}
                onAcknowledge={() => acknowledge(alert.id)}
              />
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function AlertItem({ alert, onAcknowledge }: { alert: Alert; onAcknowledge: () => void }) {
  const severityStyles = {
    critical: 'border-l-red-500 bg-red-500/5',
    warning: 'border-l-yellow-500 bg-yellow-500/5',
    info: 'border-l-blue-500 bg-blue-500/5'
  };

  return (
    <div className={`p-3 border-l-2 ${severityStyles[alert.severity]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="font-medium text-sm">{alert.title}</div>
          <p className="text-xs text-zinc-400 mt-1">{alert.message}</p>
          <div className="text-xs text-zinc-500 mt-2">
            {formatRelativeTime(alert.created_at)}
          </div>
        </div>
        <Button size="sm" variant="ghost" onClick={onAcknowledge}>
          ✓
        </Button>
      </div>
    </div>
  );
}
```

---

## 📋 Fase 3: Otimização com Dados

### 3.1 A/B Testing de Prompts

**Objetivo:** Testar duas versões de prompt simultaneamente para comparar performance.

**Conceito:**
- 50% do tráfego vai para Prompt A, 50% para Prompt B
- Sistema coleta métricas de cada versão
- Após N conversas, declara um vencedor
- Opção de aplicar automaticamente o vencedor

**Schema SQL:**
```sql
CREATE TABLE IF NOT EXISTS prompt_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relacionamentos
  agent_version_id UUID NOT NULL REFERENCES agent_versions(id),
  prompt_a_id UUID NOT NULL REFERENCES system_prompts(id),
  prompt_b_id UUID NOT NULL REFERENCES system_prompts(id),

  -- Configuração
  name VARCHAR(255) NOT NULL,
  hypothesis TEXT, -- "Prompt B deve converter melhor por ser mais direto"
  traffic_split DECIMAL(3,2) DEFAULT 0.50, -- % para prompt B

  -- Critérios de sucesso
  min_conversations INTEGER DEFAULT 50, -- Mínimo para declarar vencedor
  min_statistical_significance DECIMAL(3,2) DEFAULT 0.95,

  -- Métricas coletadas
  primary_metric VARCHAR(50) DEFAULT 'avg_score',
  -- 'avg_score', 'conversion_rate', 'response_time', 'escalation_rate'

  -- Status
  status VARCHAR(20) DEFAULT 'draft',
  -- 'draft', 'running', 'paused', 'completed', 'cancelled'

  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  -- Resultados
  winner_prompt_id UUID REFERENCES system_prompts(id),
  winner_declared_at TIMESTAMPTZ,

  -- Métricas em tempo real
  conversations_a INTEGER DEFAULT 0,
  conversations_b INTEGER DEFAULT 0,
  avg_score_a DECIMAL(4,2),
  avg_score_b DECIMAL(4,2),
  conversion_rate_a DECIMAL(5,2),
  conversion_rate_b DECIMAL(5,2),

  -- Auto-apply
  auto_apply_winner BOOLEAN DEFAULT false,
  winner_applied_at TIMESTAMPTZ,

  -- Metadata
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela para rastrear qual prompt foi usado em cada conversa
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id UUID NOT NULL REFERENCES prompt_experiments(id),
  conversation_id UUID NOT NULL,
  assigned_prompt VARCHAR(1) NOT NULL, -- 'a' ou 'b'
  prompt_id UUID NOT NULL REFERENCES system_prompts(id),

  -- Métricas da conversa
  score DECIMAL(4,2),
  converted BOOLEAN,
  escalated BOOLEAN,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_experiment_assignments ON experiment_assignments(experiment_id, assigned_prompt);
```

**Workflow n8n: Roteador de Experimento**
```javascript
// Dentro do 05-AI-Agent-Execution-Modular
// Antes de chamar o LLM, verificar se há experimento ativo

const agentId = $json.agent_version_id;

// Buscar experimento ativo
const experiment = await supabase
  .from('prompt_experiments')
  .select('*')
  .eq('agent_version_id', agentId)
  .eq('status', 'running')
  .single();

if (experiment) {
  // Decidir qual prompt usar (baseado em traffic_split)
  const usePromptB = Math.random() < experiment.traffic_split;
  const promptId = usePromptB ? experiment.prompt_b_id : experiment.prompt_a_id;
  const assignment = usePromptB ? 'b' : 'a';

  // Registrar assignment
  await supabase.from('experiment_assignments').insert({
    experiment_id: experiment.id,
    conversation_id: $json.conversation_id,
    assigned_prompt: assignment,
    prompt_id: promptId
  });

  // Buscar prompt específico
  const prompt = await supabase
    .from('system_prompts')
    .select('content')
    .eq('id', promptId)
    .single();

  return {
    ...items[0].json,
    prompt_content: prompt.content,
    experiment_id: experiment.id,
    experiment_assignment: assignment
  };
} else {
  // Sem experimento, usar prompt ativo normal
  return items[0].json;
}
```

**Componente React:**
```tsx
// components/experiments/ExperimentDashboard.tsx
export function ExperimentDashboard({ experimentId }: { experimentId: string }) {
  const [experiment, setExperiment] = useState<Experiment | null>(null);

  const getWinnerProbability = () => {
    // Cálculo simplificado de significância estatística
    const { conversations_a, conversations_b, avg_score_a, avg_score_b } = experiment;
    // ... cálculo real usaria teste t ou similar
    return 0.87; // exemplo
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{experiment.name}</h1>
          <p className="text-zinc-400">{experiment.hypothesis}</p>
        </div>
        <div className="flex gap-2">
          {experiment.status === 'running' && (
            <Button variant="outline" onClick={pauseExperiment}>
              ⏸️ Pausar
            </Button>
          )}
          {experiment.status === 'paused' && (
            <Button onClick={resumeExperiment}>
              ▶️ Retomar
            </Button>
          )}
          <Button variant="destructive" onClick={endExperiment}>
            🛑 Encerrar
          </Button>
        </div>
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-4">
        <Badge className={
          experiment.status === 'running' ? 'bg-green-500/20 text-green-400' :
          experiment.status === 'completed' ? 'bg-blue-500/20 text-blue-400' :
          'bg-zinc-500/20 text-zinc-400'
        }>
          {experiment.status.toUpperCase()}
        </Badge>
        {experiment.status === 'running' && (
          <span className="text-sm text-zinc-500">
            Rodando há {formatDuration(experiment.started_at)}
          </span>
        )}
      </div>

      {/* Comparison Cards */}
      <div className="grid grid-cols-2 gap-6">
        {/* Prompt A */}
        <Card className={experiment.winner_prompt_id === experiment.prompt_a_id ? 'ring-2 ring-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prompt A (Controle)</CardTitle>
              {experiment.winner_prompt_id === experiment.prompt_a_id && (
                <Badge className="bg-green-500">🏆 Vencedor</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold">{experiment.avg_score_a?.toFixed(2) || '-'}</div>
                <div className="text-xs text-zinc-500">Score Médio</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{experiment.conversations_a || 0}</div>
                <div className="text-xs text-zinc-500">Conversas</div>
              </div>
            </div>
            <Progress
              value={(experiment.conversations_a / experiment.min_conversations) * 100}
              className="h-2"
            />
            <div className="text-xs text-zinc-500 mt-1">
              {experiment.conversations_a} / {experiment.min_conversations} conversas
            </div>
          </CardContent>
        </Card>

        {/* Prompt B */}
        <Card className={experiment.winner_prompt_id === experiment.prompt_b_id ? 'ring-2 ring-green-500' : ''}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Prompt B (Variante)</CardTitle>
              {experiment.winner_prompt_id === experiment.prompt_b_id && (
                <Badge className="bg-green-500">🏆 Vencedor</Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-2xl font-bold">{experiment.avg_score_b?.toFixed(2) || '-'}</div>
                <div className="text-xs text-zinc-500">Score Médio</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{experiment.conversations_b || 0}</div>
                <div className="text-xs text-zinc-500">Conversas</div>
              </div>
            </div>
            <Progress
              value={(experiment.conversations_b / experiment.min_conversations) * 100}
              className="h-2"
            />
            <div className="text-xs text-zinc-500 mt-1">
              {experiment.conversations_b} / {experiment.min_conversations} conversas
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Statistical Significance */}
      <Card>
        <CardHeader>
          <CardTitle>Análise Estatística</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="text-sm text-zinc-400 mb-1">Confiança do Resultado</div>
              <Progress value={getWinnerProbability() * 100} className="h-3" />
            </div>
            <div className="text-2xl font-bold">
              {(getWinnerProbability() * 100).toFixed(0)}%
            </div>
          </div>

          {getWinnerProbability() >= experiment.min_statistical_significance && (
            <Alert className="mt-4 bg-green-500/10 border-green-500/30">
              <AlertDescription>
                ✅ Resultado estatisticamente significativo! Podemos declarar um vencedor.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Declare Winner */}
      {experiment.status === 'running' &&
       getWinnerProbability() >= experiment.min_statistical_significance && (
        <div className="flex justify-center gap-4">
          <Button
            size="lg"
            onClick={() => declareWinner(experiment.prompt_a_id)}
          >
            Declarar Prompt A Vencedor
          </Button>
          <Button
            size="lg"
            onClick={() => declareWinner(experiment.prompt_b_id)}
          >
            Declarar Prompt B Vencedor
          </Button>
        </div>
      )}
    </div>
  );
}
```

---

## 🗓️ Cronograma de Implementação

### Semana 1-2: Autonomia do CS
- [ ] Implementar Chat de Ajustes (backend + frontend)
- [ ] Implementar Reflection Settings UI
- [ ] Implementar Experience Suggestions UI

### Semana 3-4: Visibilidade Total
- [ ] Implementar Reflection Logs
- [ ] Implementar Prompt History com Revert
- [ ] Implementar Sistema de Alertas

### Semana 5-6: Otimização com Dados
- [ ] Implementar A/B Testing de Prompts
- [ ] Implementar Dashboard de ROI (opcional)

---

## 📁 Arquivos a Criar

### Backend (SQL)
```
sql/
├── migrations/
│   ├── 002_reflection_settings_extended.sql
│   ├── 003_system_alerts.sql
│   └── 004_ab_testing.sql
```

### Backend (n8n)
```
workflows/
├── 15-Chat-de-Ajustes.json
├── 16-Alertas-Inteligentes.json
└── 17-AB-Testing-Router.json
```

### Frontend (React)
```
src/
├── pages/
│   ├── ChatAjustes.tsx
│   ├── Experiments.tsx
│   └── AlertsHistory.tsx
├── components/
│   ├── chat-ajustes/
│   │   ├── ChatInterface.tsx
│   │   ├── ChangePreview.tsx
│   │   └── AdjustmentHistory.tsx
│   ├── reflection/
│   │   ├── ReflectionSettings.tsx
│   │   └── ReflectionLogs.tsx
│   ├── suggestions/
│   │   └── SuggestionsList.tsx
│   ├── prompts/
│   │   └── PromptHistory.tsx
│   ├── experiments/
│   │   ├── ExperimentDashboard.tsx
│   │   └── CreateExperiment.tsx
│   └── alerts/
│       ├── AlertsBell.tsx
│       └── AlertsHistory.tsx
```

---

## ✅ Resumo Executivo

| Feature | Impacto | Esforço | Prioridade |
|---------|---------|---------|------------|
| Chat de Ajustes | 🔥🔥🔥 | ⏱️⏱️ | P1 |
| Reflection Settings | 🔥🔥🔥 | ⏱️ | P1 |
| Experience Suggestions | 🔥🔥🔥 | ⏱️⏱️ | P1 |
| Reflection Logs | 🔥🔥 | ⏱️ | P2 |
| Prompt History | 🔥🔥🔥 | ⏱️ | P2 |
| Alertas Inteligentes | 🔥🔥 | ⏱️⏱️ | P2 |
| A/B Testing | 🔥🔥🔥 | ⏱️⏱️⏱️ | P3 |
| ROI Dashboard | 🔥🔥 | ⏱️⏱️⏱️ | P3 |

**Recomendação:** Começar pela Fase 1 (Autonomia do CS) que resolve o problema imediato de depender do desenvolvedor para ajustes simples.
