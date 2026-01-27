# 📊 BUSINESS GAPS - AI Factory Dashboard

**Data:** 2025-01-27  
**Análise por:** Head Comercial, Sales Ops, Customer Success

---

## 🎯 Resumo Executivo

O dashboard atual é **operacional**, não **estratégico**. Permite ver o que está acontecendo, mas não permite:
- Prever o futuro (forecast)
- Medir sucesso (ROI, metas)
- Agir proativamente (alertas, automações)
- Reter clientes (health score, churn)

---

## 🔴 TOP 10 PRIORIDADES

| # | Gap | Área | Impacto | Esforço |
|---|-----|------|---------|---------|
| 1 | Forecast/Pipeline com valores R$ | Comercial | 🔴 Crítico | Alto |
| 2 | Health Score do cliente | CS | 🔴 Crítico | Médio |
| 3 | Meta vs Realizado | Comercial | 🔴 Crítico | Médio |
| 4 | Alertas em tempo real | Ops | 🔴 Crítico | Médio |
| 5 | ROI visível por cliente | CS | 🔴 Crítico | Médio |
| 6 | SLA de resposta da IA | Ops | 🟠 Alto | Baixo |
| 7 | Motivos de perda | Comercial | 🟠 Alto | Baixo |
| 8 | Integração GHL bidirecional | Ops | 🟠 Alto | Alto |
| 9 | Onboarding tracking | CS | 🟡 Médio | Baixo |
| 10 | Automações (follow-up, escalation) | Ops | 🟡 Médio | Alto |

---

## 📈 HEAD COMERCIAL

### Métricas Faltando

#### Críticas (Impedem decisões estratégicas)
| Métrica | Por que é crítica |
|---------|-------------------|
| **Forecast de Vendas** | Impossível planejar recursos, definir metas |
| **Pipeline com Valores (R$)** | Não sei quanto dinheiro está em jogo |
| **Meta vs Realizado** | Zero controle sobre atingimento |
| **Ticket Médio** | Não calculo receita potencial |
| **Ciclo Médio de Vendas** | Não sei tempo de conversão |
| **Motivos de Perda** | Não aprendo com erros |

#### Importantes
| Métrica | Impacto |
|---------|---------|
| Comparativo período vs período | Não sei se estou melhorando |
| Receita Gerada / ROI | Não sei se IA está valendo |
| CAC (Custo de Aquisição) | Não sei custo por cliente |
| NPS / Satisfação | Não sei se leads satisfeitos |

### Perguntas que NÃO consegue responder
- "Quanto vou faturar esse mês?"
- "Estou no caminho certo para bater a meta?"
- "Por que estamos perdendo negócios?"
- "O custo com IA está se pagando?"

### Sugestões de Implementação

#### 1. Página de Pipeline (Nova)
```
Pipeline de Vendas - Janeiro/2025
─────────────────────────────────────────────────
Etapa          │ Leads │ Valor Total  │ Previsão
─────────────────────────────────────────────────
Qualificação   │  45   │ R$ 450.000   │ 10%
Agendamento    │  28   │ R$ 280.000   │ 30%
Proposta       │  12   │ R$ 180.000   │ 60%
Negociação     │   8   │ R$ 120.000   │ 80%
─────────────────────────────────────────────────
FORECAST TOTAL │  93   │ R$ 252.000   │ (ponderado)
```

#### 2. Painel de Metas (Dashboard)
```
Meta do Mês: Fevereiro/2025
────────────────────────────────────────
Vendas Fechadas: 8 / 15  (53%)
▓▓▓▓▓▓▓▓░░░░░░░

Receita: R$ 48.000 / R$ 100.000  (48%)
▓▓▓▓▓▓▓░░░░░░░░░

Ritmo necessário: 0.58 vendas/dia
Ritmo atual: 0.47 vendas/dia ⚠️
```

#### 3. Cards com Comparativo
```
┌─────────────────────────────────────┐
│  Taxa de Conversão                  │
│  12.5%  ↑ +2.3% vs mês anterior     │
│  ████████░░░░░░░░░                  │
│  Meta: 15%                          │
└─────────────────────────────────────┘
```

---

## ⚙️ SALES OPS

### Gaps Operacionais

#### P1 - Críticos
| Gap | Impacto |
|-----|---------|
| **Tempo de resposta da IA não medido** | Não há SLA tracking |
| **Taxa de handoff humano desconhecida** | Não sei % intervenção |
| **Conversas travadas não detectadas** | Zero visibilidade |
| **Leads sem follow-up segmentado** | Não diferencia 1 dia vs 7 dias |

#### P2 - Importantes
| Gap | Impacto |
|-----|---------|
| Cadência de mensagens não configurável | Sem automação |
| Taxa de resposta por horário | Não otimiza timing |
| Taxa de bloqueio/spam | Zero tracking |

### Automações Sugeridas

#### 1. Auto-Escalation
```
TRIGGER: Conversa sem resposta da IA > 5 minutos
AÇÃO: Notifica gestora no dashboard + badge visual
```

#### 2. Follow-up Automático Inteligente
```
TRIGGER: Lead ativo + última msg há > 24h + follow_up_count < 5
AÇÃO: Dispara próximo follow-up via n8n webhook
REGRAS:
  - Não enviar entre 21h-8h
  - Máximo 1 msg/dia
  - Parar se 3 msgs sem resposta
```

#### 3. Detecção de Intenção de Compra
```
TRIGGER: Palavras-chave ("preço", "valor", "agendar", "comprar")
AÇÃO: Muda status para 'hot_lead' + alerta gestora
```

#### 4. Pausa Automática por Sentimento Negativo
```
TRIGGER: qa_score < 40 em 2+ mensagens consecutivas
AÇÃO: Pausa IA + notifica para revisão humana
```

### Alertas Necessários

| Alerta | Condição | Prioridade |
|--------|----------|------------|
| 🔴 SLA Breach | Msg do lead sem resposta > 10min | CRÍTICA |
| 🟠 IA Travada | Erro consecutivo em 3+ respostas | ALTA |
| 🟠 Lead Quente | Intenção de compra detectada | ALTA |
| 🟡 Follow-up Atrasado | Leads prontos há > 48h | MÉDIA |
| 🟡 Sentimento Negativo | qa_score < 30 | MÉDIA |

### Integrações GHL Faltando

| Integração | Direção | Status |
|------------|---------|--------|
| Sync de leads | GHL → AI Factory | ⚠️ Parcial |
| Status da conversa | AI Factory → GHL | ❌ Falta |
| Criação de oportunidade | AI Factory → GHL | ❌ Falta |
| Tags automáticas | AI Factory → GHL | ❌ Falta |
| Webhook de eventos | GHL → AI Factory | ❌ Falta |

---

## 💚 CUSTOMER SUCCESS

### Métricas Faltando

#### Health Score
| Falta | Impacto |
|-------|---------|
| **Health Score consolidado** | Não vejo saúde do cliente em um número |
| **Tendência de saúde** | Não sei se cliente melhorando/piorando |
| **Segmentação por risco** | Não priorizo atendimento |

#### Valor Entregue (ROI)
| Falta | Impacto |
|-------|---------|
| **ROI do cliente** | Cliente não vê valor → churn |
| **Custo vs Resultado** | Só vejo custo, não retorno |
| **Valor por fechamento** | Não sei quanto vale em R$ |

#### Engajamento & Adoção
| Falta | Impacto |
|-------|---------|
| **Frequência de uso** | Não sei se cliente está usando |
| **Último login/acesso** | Só tenho atividade de IA |
| **Time to First Value** | Não sei tempo até resultado |

#### Onboarding
| Falta | Impacto |
|-------|---------|
| **Taxa de conclusão** | Não sei quantos completaram |
| **Etapa onde travam** | Não identifico gargalos |
| **Clientes pendentes** | Não sei quem precisa ajuda |

### Sistema de Health Score Proposto

```typescript
interface HealthScore {
  score: number;           // 0-100
  trend: 'improving' | 'stable' | 'declining';
  riskLevel: 'healthy' | 'attention' | 'risk' | 'critical';
  components: {
    engagement: number;    // 30% do peso
    results: number;       // 40% do peso
    adoption: number;      // 20% do peso
    support: number;       // 10% do peso
  }
}
```

| Score | Nível | Ação |
|-------|-------|------|
| 80-100 | 🟢 Healthy | Expansão |
| 60-79 | 🟡 Attention | Monitorar |
| 40-59 | 🟠 Risk | Intervenção |
| 0-39 | 🔴 Critical | Resgate urgente |

### Alertas de Risco

| Alerta | Trigger | Severidade |
|--------|---------|------------|
| Inativo 7 dias | `last_activity > 7d` | 🟡 Média |
| Inativo 14 dias | `last_activity > 14d` | 🟠 Alta |
| Inativo 30 dias | `last_activity > 30d` | 🔴 Crítica |
| Conversão caindo | Taxa caiu 20% em 30d | 🟠 Alta |
| Sem resultados 30d | `fechados = 0` por 30d | 🔴 Crítica |
| Onboarding travado | Setup incompleto > 7d | 🟡 Média |
| Custo alto sem ROI | `custo > $100` e `fechados = 0` | 🔴 Crítica |

### Dashboards Sugeridos

#### 1. Painel de Sucesso do Cliente (Novo)
- Health Score médio
- Clientes ativos vs em risco
- NPS
- Alertas ativos
- Segmentação por health

#### 2. Detalhe do Cliente (Melhorar)
- Atualmente 100% mockado
- Adicionar: ROI, valor entregue, comparativo antes/depois, timeline

#### 3. Onboarding Tracker (Novo)
- Taxa de conclusão
- Funil por etapa
- Clientes travados
- Time to First Value

---

## 🗄️ TABELAS NECESSÁRIAS

### 1. client_health_scores
```sql
CREATE TABLE client_health_scores (
  id UUID PRIMARY KEY,
  location_id TEXT NOT NULL,
  score INTEGER NOT NULL,
  engagement_score INTEGER,
  results_score INTEGER,
  adoption_score INTEGER,
  support_score INTEGER,
  risk_level TEXT,
  trend TEXT,
  calculated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. onboarding_progress
```sql
CREATE TABLE onboarding_progress (
  id UUID PRIMARY KEY,
  location_id TEXT NOT NULL UNIQUE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 7,
  time_to_first_value_days INTEGER,
  status TEXT
);
```

### 3. cs_alerts
```sql
CREATE TABLE cs_alerts (
  id UUID PRIMARY KEY,
  location_id TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL,
  triggered_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP,
  message TEXT,
  suggested_action TEXT,
  is_active BOOLEAN DEFAULT TRUE
);
```

### 4. sales_pipeline
```sql
CREATE TABLE sales_pipeline (
  id UUID PRIMARY KEY,
  location_id TEXT NOT NULL,
  lead_id TEXT,
  stage TEXT NOT NULL,
  value_brl DECIMAL(12,2),
  probability INTEGER,
  expected_close_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

### 5. sales_goals
```sql
CREATE TABLE sales_goals (
  id UUID PRIMARY KEY,
  location_id TEXT,
  period_type TEXT, -- monthly, quarterly
  period_start DATE,
  period_end DATE,
  goal_leads INTEGER,
  goal_conversions INTEGER,
  goal_revenue_brl DECIMAL(12,2),
  actual_leads INTEGER DEFAULT 0,
  actual_conversions INTEGER DEFAULT 0,
  actual_revenue_brl DECIMAL(12,2) DEFAULT 0
);
```

### 6. Campos adicionais
```sql
-- Em client_settings ou similar
ALTER TABLE client_settings ADD COLUMN ticket_medio DECIMAL(10,2);
ALTER TABLE client_settings ADD COLUMN meta_fechamentos_mes INTEGER;

-- Em supervision_states ou similar
ALTER TABLE n8n_historico_mensagens ADD COLUMN response_time_seconds INTEGER;
```

---

## 📅 ROADMAP SUGERIDO

### Fase 1 - Quick Wins (1-2 semanas)
- [ ] Adicionar comparativo período vs período nos cards
- [ ] Criar alerta de SLA (conversas > 10min sem resposta)
- [ ] Conectar ClientDetail a dados reais (remover mock)
- [ ] Adicionar campo ticket_medio para ROI

### Fase 2 - Fundação (2-4 semanas)
- [ ] Criar tabelas de health score e alertas
- [ ] Implementar Health Score básico
- [ ] Criar página de Pipeline com valores
- [ ] Implementar sistema de alertas proativos
- [ ] Tracking de onboarding

### Fase 3 - Automações (1-2 meses)
- [ ] Follow-up automático inteligente
- [ ] Detecção de intenção de compra
- [ ] Integração bidirecional com GHL
- [ ] Pausa automática por sentimento negativo

### Fase 4 - Inteligência (2-3 meses)
- [ ] Forecast com ML
- [ ] Predição de churn
- [ ] Sugestão de melhor horário
- [ ] Dashboard de ROI para cliente

---

## ✅ O QUE JÁ FUNCIONA BEM

| Recurso | Avaliação |
|---------|-----------|
| Funil de Conversão Visual | ✅ Excelente |
| Ranking Top Performers | ✅ Bom |
| Tabela de Performance por Cliente | ✅ Completa |
| Custos por Cliente | ✅ Detalhado |
| Supervisão de Conversas | ✅ Funcional |
| Sales Ops Views | ✅ Bom |
| Filtros de Período | ⚠️ Parcial (não compara) |

---

*Documento gerado em 2025-01-27*
