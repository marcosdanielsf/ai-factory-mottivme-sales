# FASE 0 - Plano de Implementacao Detalhado

## Objetivo
Integrar os sistemas existentes (AgenticOS + AI Factory + GHL) para que trabalhem juntos.

---

## 1. VISAO GERAL DA INTEGRACAO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              FASE 0 - INTEGRACAO                                 │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                        AgenticOSKevsAcademy                                │  │
│  │                                                                            │  │
│  │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                    │  │
│  │  │LeadDiscovery│───▶│ProfileAnalyz│───▶│LeadQualifier│                    │  │
│  │  │   Agent     │    │    Agent    │    │   Agent     │                    │  │
│  │  └─────────────┘    └──────┬──────┘    └──────┬──────┘                    │  │
│  │                            │                   │                           │  │
│  │                            ▼                   ▼                           │  │
│  │                    ┌───────────────────────────────────┐                   │  │
│  │                    │     BRIDGE SERVICE (NOVO)         │                   │  │
│  │                    │  integration_bridge.py            │                   │  │
│  │                    └───────────────┬───────────────────┘                   │  │
│  └────────────────────────────────────┼───────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           SUPABASE                                         │  │
│  │                                                                            │  │
│  │  AgenticOS Tables           AI Factory Tables           Unified Tables     │  │
│  │  ┌──────────────┐          ┌──────────────┐          ┌──────────────────┐ │  │
│  │  │ crm_leads    │          │agent_versions│          │ unified_leads    │ │  │
│  │  │socialfy_leads│◀────────▶│call_recordings│◀────────▶│ (VIEW)          │ │  │
│  │  │socialfy_msgs │          │ qa_analyses  │          └──────────────────┘ │  │
│  │  └──────────────┘          └──────────────┘                               │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                           AI FACTORY V3                                    │  │
│  │                                                                            │  │
│  │  05-Execution le dados enriquecidos ──▶ Hyperpersonalization REAL         │  │
│  │  09-QA-Analyst recebe sentiment ──▶ Analise mais completa                 │  │
│  │                                                                            │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │                              GHL                                           │  │
│  │                                                                            │  │
│  │  Custom Fields atualizados com dados do ProfileAnalyzer                   │  │
│  │  ┌──────────────────────────────────────────────────────────────────────┐ │  │
│  │  │ lead_cargo │ lead_empresa │ lead_setor │ lead_porte │ icp_score     │ │  │
│  │  └──────────────────────────────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. COMPONENTES A CRIAR

### 2.1 Bridge Service (Python)

**Arquivo:** `AgenticOSKevsAcademy/implementation/integration_bridge.py`

```python
"""
INTEGRATION BRIDGE
==================
Conecta AgenticOS com AI Factory.
Sincroniza dados entre os dois sistemas.
"""

class IntegrationBridge:
    """
    Responsabilidades:
    1. Quando ProfileAnalyzer enriquece lead → atualiza AI Factory tables
    2. Quando LeadQualifier pontua lead → atualiza GHL custom fields
    3. Quando Quality Squad analisa → envia para 09-QA-Analyst
    """

    # Skills:
    # - sync_lead_to_ai_factory
    # - update_ghl_custom_fields
    # - send_sentiment_to_qa
    # - get_agent_config_for_lead
```

### 2.2 Novos Custom Fields GHL

| Field Key | Field Name | Tipo | Origem |
|-----------|------------|------|--------|
| `lead_cargo` | Cargo do Lead | Text | ProfileAnalyzer |
| `lead_empresa` | Empresa do Lead | Text | ProfileAnalyzer |
| `lead_setor` | Setor/Industria | Dropdown | ProfileAnalyzer |
| `lead_porte` | Porte da Empresa | Dropdown | ProfileAnalyzer |
| `lead_followers` | Seguidores IG | Number | ProfileAnalyzer |
| `lead_engagement` | Taxa Engajamento | Number | ProfileAnalyzer |
| `icp_score` | ICP Score (0-100) | Number | LeadQualifier |
| `icp_tier` | Tier (HOT/WARM/COLD) | Dropdown | LeadQualifier |
| `lead_source` | Fonte do Lead | Dropdown | LeadDiscovery |
| `enriched_at` | Data Enriquecimento | Date | Bridge |

### 2.3 View Unificada Supabase

```sql
CREATE VIEW unified_leads AS
SELECT
    -- Dados do AgenticOS
    sl.id,
    sl.name,
    sl.instagram_handle,
    sl.icp_score,
    sl.source_data->>'cargo' as cargo,
    sl.source_data->>'empresa' as empresa,
    sl.source_data->>'setor' as setor,
    sl.source_data->>'porte' as porte,

    -- Dados do AI Factory (se existir agente)
    av.id as agent_version_id,
    av.is_active as has_active_agent,

    -- Dados de conversas
    (SELECT COUNT(*) FROM agent_conversations ac WHERE ac.contact_id = sl.id) as total_conversations,

    -- Ultima analise QA
    (SELECT qa.overall_score FROM qa_analyses qa
     WHERE qa.conversation_id IN (SELECT id FROM agent_conversations WHERE contact_id = sl.id)
     ORDER BY qa.created_at DESC LIMIT 1) as last_qa_score

FROM socialfy_leads sl
LEFT JOIN clients c ON c.id = sl.organization_id
LEFT JOIN agent_versions av ON av.client_id = c.id AND av.is_active = true;
```

---

## 3. AGENTES E SUBAGENTES

### 3.1 Orquestrador Principal

**Nome:** `IntegrationOrchestrator`
**Tipo:** Coordinator Agent
**Responsabilidade:** Orquestra todos os subagentes da FASE 0

```python
class IntegrationOrchestrator(BaseAgent):
    """
    Orquestrador central da integracao.

    Subagentes:
    - LeadSyncAgent: Sincroniza leads entre sistemas
    - GHLUpdaterAgent: Atualiza custom fields no GHL
    - QABridgeAgent: Envia dados para QA-Analyst
    - ConfigFetcherAgent: Busca config do agente para lead
    """

    def __init__(self):
        super().__init__(
            name="IntegrationOrchestrator",
            description="Orquestra integracao AgenticOS <-> AI Factory"
        )

        self.subagents = [
            LeadSyncAgent(),
            GHLUpdaterAgent(),
            QABridgeAgent(),
            ConfigFetcherAgent()
        ]
```

### 3.2 Subagente: LeadSyncAgent

**Responsabilidade:** Sincroniza leads enriquecidos para o AI Factory

```python
class LeadSyncAgent(BaseAgent):
    """
    Sincroniza leads do AgenticOS para AI Factory.

    Skills:
    - sync_single_lead: Sincroniza um lead especifico
    - sync_batch_leads: Sincroniza lote de leads
    - check_sync_status: Verifica status de sincronizacao

    Triggers:
    - Quando ProfileAnalyzer completa analise
    - Quando LeadQualifier atribui score
    - Agendado a cada 15 minutos (batch sync)
    """

    async def sync_single_lead(self, lead_id: str) -> Dict:
        """
        1. Busca lead em socialfy_leads
        2. Extrai dados enriquecidos (cargo, empresa, setor, etc)
        3. Busca/cria registro em unified_leads
        4. Atualiza ou insere dados
        5. Retorna status
        """
        pass

    async def sync_batch_leads(self, limit: int = 100) -> Dict:
        """
        1. Busca leads modificados nas ultimas 24h
        2. Filtra os que nao estao sincronizados
        3. Sincroniza em batch
        4. Retorna estatisticas
        """
        pass
```

### 3.3 Subagente: GHLUpdaterAgent

**Responsabilidade:** Atualiza custom fields no GHL

```python
class GHLUpdaterAgent(BaseAgent):
    """
    Atualiza GHL com dados enriquecidos.

    Skills:
    - update_contact_fields: Atualiza custom fields de um contato
    - batch_update_fields: Atualiza em lote
    - create_custom_fields: Cria fields se nao existirem

    Mapeamento:
    - ProfileAnalyzer.cargo → GHL.lead_cargo
    - ProfileAnalyzer.empresa → GHL.lead_empresa
    - ProfileAnalyzer.setor → GHL.lead_setor
    - LeadQualifier.icp_score → GHL.icp_score
    - LeadQualifier.tier → GHL.icp_tier
    """

    async def update_contact_fields(self, contact_id: str, location_id: str, data: Dict) -> Dict:
        """
        1. Valida dados recebidos
        2. Mapeia para custom fields GHL
        3. Chama API GHL para atualizar
        4. Retorna status
        """
        pass

    async def ensure_custom_fields_exist(self, location_id: str) -> Dict:
        """
        1. Lista custom fields existentes
        2. Compara com fields necessarios
        3. Cria os que faltam
        4. Retorna mapeamento field_key -> field_id
        """
        pass
```

### 3.4 Subagente: QABridgeAgent

**Responsabilidade:** Envia dados de qualidade para o 09-QA-Analyst

```python
class QABridgeAgent(BaseAgent):
    """
    Conecta Quality Squad do AgenticOS com 09-QA-Analyst do AI Factory.

    Skills:
    - send_sentiment_analysis: Envia analise de sentimento
    - send_message_quality: Envia score de qualidade de mensagem
    - aggregate_qa_data: Agrega dados para relatorio

    Fluxo:
    1. Quality Squad analisa conversa no AgenticOS
    2. QABridgeAgent recebe analise
    3. Formata para schema do AI Factory
    4. Insere em qa_analyses ou envia webhook
    """

    async def send_sentiment_analysis(self, conversation_id: str, sentiment_data: Dict) -> Dict:
        """
        1. Busca conversa no AI Factory
        2. Formata dados de sentiment
        3. Insere em qa_analyses com dimensao extra
        4. Retorna status
        """
        pass
```

### 3.5 Subagente: ConfigFetcherAgent

**Responsabilidade:** Busca configuracao do agente para um lead

```python
class ConfigFetcherAgent(BaseAgent):
    """
    Busca config do agente AI Factory baseado no lead.

    Skills:
    - get_agent_for_lead: Retorna agente ativo para o lead
    - get_hyperpersonalization: Retorna config de hiperpersonalizacao
    - get_modes_available: Retorna modos disponiveis

    Uso:
    - AgenticOS precisa saber como o AI Factory vai atender o lead
    - Evita duplicacao de esforco
    - Permite MessageComposer usar mesmo tom do AI Factory
    """

    async def get_agent_for_lead(self, location_id: str) -> Dict:
        """
        1. Busca client por location_id
        2. Busca agent_version ativo
        3. Retorna config completa (personality, modes, compliance)
        """
        pass
```

---

## 4. SKILLS (Funcoes Reutilizaveis)

### 4.1 Skill: sync_lead

```python
@skill(name="sync_lead", description="Sincroniza lead entre sistemas")
async def sync_lead(
    lead_id: str,
    source: Literal["agenticos", "ai_factory"],
    target: Literal["agenticos", "ai_factory", "ghl"]
) -> Dict:
    """
    Sincroniza dados de um lead entre sistemas.

    Params:
    - lead_id: ID do lead
    - source: Sistema de origem
    - target: Sistema de destino

    Returns:
    - success: bool
    - synced_fields: List[str]
    - errors: List[str]
    """
    pass
```

### 4.2 Skill: enrich_lead

```python
@skill(name="enrich_lead", description="Enriquece lead com dados externos")
async def enrich_lead(
    lead_id: str,
    sources: List[Literal["instagram", "linkedin", "cnpj"]]
) -> Dict:
    """
    Enriquece lead buscando dados de fontes externas.

    Params:
    - lead_id: ID do lead
    - sources: Lista de fontes para buscar

    Returns:
    - enriched_data: Dict com dados encontrados
    - sources_used: List[str]
    - confidence_score: float
    """
    pass
```

### 4.3 Skill: update_ghl_contact

```python
@skill(name="update_ghl_contact", description="Atualiza contato no GHL")
async def update_ghl_contact(
    contact_id: str,
    location_id: str,
    custom_fields: Dict[str, Any]
) -> Dict:
    """
    Atualiza custom fields de um contato no GHL.

    Params:
    - contact_id: ID do contato no GHL
    - location_id: ID da location
    - custom_fields: Dict com field_key -> value

    Returns:
    - success: bool
    - updated_fields: List[str]
    - errors: List[str]
    """
    pass
```

### 4.4 Skill: get_agent_config

```python
@skill(name="get_agent_config", description="Busca config do agente AI Factory")
async def get_agent_config(
    location_id: str
) -> Dict:
    """
    Busca configuracao do agente ativo para uma location.

    Params:
    - location_id: ID da location no GHL

    Returns:
    - agent_id: str
    - personality: Dict
    - modes: List[str]
    - hyperpersonalization: Dict
    - compliance_rules: List[str]
    """
    pass
```

### 4.5 Skill: send_qa_data

```python
@skill(name="send_qa_data", description="Envia dados para QA Analyst")
async def send_qa_data(
    conversation_id: str,
    qa_type: Literal["sentiment", "message_quality", "compliance"],
    data: Dict
) -> Dict:
    """
    Envia dados de qualidade para o 09-QA-Analyst.

    Params:
    - conversation_id: ID da conversa no AI Factory
    - qa_type: Tipo de analise
    - data: Dados da analise

    Returns:
    - success: bool
    - qa_analysis_id: str
    """
    pass
```

---

## 5. WORKFLOWS N8N (Novos/Modificados)

### 5.1 Webhook Receiver (Novo)

**Nome:** `21-AgenticOS-Webhook-Receiver.json`

**Funcao:** Recebe eventos do AgenticOS

```
Trigger: Webhook POST /agenticos-events

Eventos:
- lead_enriched: Lead foi enriquecido pelo ProfileAnalyzer
- lead_qualified: Lead foi qualificado pelo LeadQualifier
- message_composed: Mensagem foi composta
- qa_analysis_done: Analise de qualidade concluida

Fluxo:
1. Recebe evento
2. Valida payload
3. Switch por event_type
4. Processa cada tipo:
   - lead_enriched → Atualiza GHL + Supabase
   - lead_qualified → Atualiza GHL icp_score
   - qa_analysis_done → Insere em qa_analyses
```

### 5.2 Modificacao: 05-AI-Agent-Execution-Modular

**Adicionar:** Busca de dados enriquecidos antes de executar

```
Antes do AI Agent:
1. Busca contato no GHL
2. Busca dados enriquecidos (custom fields)
3. Se existir lead_cargo, lead_empresa, etc:
   - Adiciona ao contexto do prompt
   - Ativa hiperpersonalizacao avancada
4. Executa AI Agent com contexto expandido
```

### 5.3 Modificacao: 09-QA-Analyst

**Adicionar:** Receber dimensoes extras do Quality Squad

```
Dimensoes atuais:
- Clareza
- Objecoes
- Compliance
- Avanco

Novas dimensoes (do AgenticOS):
- Sentiment Score (positivo/neutro/negativo)
- Message Quality Score
- Response Time
- Engagement Level
```

---

## 6. TABELAS SUPABASE (Novas)

### 6.1 integration_sync_log

```sql
CREATE TABLE integration_sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_system VARCHAR(50) NOT NULL, -- 'agenticos', 'ai_factory', 'ghl'
    target_system VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- 'lead', 'conversation', 'qa_analysis'
    entity_id UUID NOT NULL,
    sync_status VARCHAR(20) NOT NULL, -- 'pending', 'success', 'failed'
    sync_data JSONB,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX idx_sync_log_status ON integration_sync_log(sync_status);
CREATE INDEX idx_sync_log_entity ON integration_sync_log(entity_type, entity_id);
```

### 6.2 enriched_lead_data

```sql
CREATE TABLE enriched_lead_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL, -- Referencia para socialfy_leads ou crm_leads
    source VARCHAR(50) NOT NULL, -- 'instagram', 'linkedin', 'cnpj'

    -- Dados comuns
    cargo VARCHAR(255),
    empresa VARCHAR(255),
    setor VARCHAR(100),
    porte VARCHAR(50),

    -- Dados Instagram
    ig_handle VARCHAR(100),
    ig_followers INTEGER,
    ig_following INTEGER,
    ig_posts INTEGER,
    ig_engagement_rate DECIMAL(5,2),
    ig_bio TEXT,
    ig_is_business BOOLEAN,
    ig_category VARCHAR(100),

    -- Dados LinkedIn
    li_url TEXT,
    li_headline TEXT,
    li_connections INTEGER,
    li_experience JSONB,
    li_education JSONB,

    -- Dados CNPJ
    cnpj VARCHAR(20),
    razao_social VARCHAR(255),
    cnae_principal VARCHAR(10),
    faturamento_estimado VARCHAR(50),

    -- Metadata
    raw_data JSONB,
    confidence_score DECIMAL(3,2),
    enriched_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,

    UNIQUE(lead_id, source)
);

CREATE INDEX idx_enriched_lead ON enriched_lead_data(lead_id);
CREATE INDEX idx_enriched_source ON enriched_lead_data(source);
```

---

## 7. FLUXO DE DADOS COMPLETO

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           FLUXO DE DADOS FASE 0                                  │
│                                                                                  │
│  1. DESCOBERTA DE LEAD                                                          │
│  ───────────────────                                                            │
│  LeadDiscoveryAgent scrape Instagram                                            │
│       │                                                                          │
│       ▼                                                                          │
│  Salva em crm_leads (AgenticOS)                                                 │
│       │                                                                          │
│       ▼                                                                          │
│  2. ENRIQUECIMENTO                                                              │
│  ─────────────────                                                              │
│  ProfileAnalyzerAgent analisa perfil                                            │
│       │                                                                          │
│       ├──▶ Extrai: cargo, empresa, setor, porte, followers, engagement          │
│       │                                                                          │
│       ▼                                                                          │
│  Salva em enriched_lead_data                                                    │
│       │                                                                          │
│       ▼                                                                          │
│  3. QUALIFICACAO                                                                │
│  ───────────────                                                                │
│  LeadQualifierAgent pontua lead                                                 │
│       │                                                                          │
│       ├──▶ ICP Score: 0-100                                                     │
│       ├──▶ Tier: HOT/WARM/COLD                                                  │
│       │                                                                          │
│       ▼                                                                          │
│  Atualiza socialfy_leads com score                                              │
│       │                                                                          │
│       ▼                                                                          │
│  4. SINCRONIZACAO                                                               │
│  ────────────────                                                               │
│  IntegrationBridge recebe evento "lead_qualified"                               │
│       │                                                                          │
│       ├──▶ LeadSyncAgent sincroniza para unified_leads                          │
│       │                                                                          │
│       ├──▶ GHLUpdaterAgent atualiza custom fields no GHL                        │
│       │    - lead_cargo, lead_empresa, lead_setor, icp_score, etc               │
│       │                                                                          │
│       ▼                                                                          │
│  5. EXECUCAO AI FACTORY                                                         │
│  ──────────────────────                                                         │
│  Lead envia mensagem no WhatsApp                                                │
│       │                                                                          │
│       ▼                                                                          │
│  GHL Webhook → 05-AI-Agent-Execution-Modular                                    │
│       │                                                                          │
│       ├──▶ Busca dados enriquecidos do lead                                     │
│       ├──▶ Adiciona ao contexto: "Lead eh {cargo} na {empresa}, setor {setor}"  │
│       │                                                                          │
│       ▼                                                                          │
│  AI Agent responde com HIPERPERSONALIZACAO REAL                                 │
│       │                                                                          │
│       ▼                                                                          │
│  6. QA UNIFICADO                                                                │
│  ──────────────                                                                 │
│  Quality Squad analisa conversa (AgenticOS)                                     │
│       │                                                                          │
│       ├──▶ Sentiment analysis                                                   │
│       ├──▶ Message quality                                                      │
│       │                                                                          │
│       ▼                                                                          │
│  QABridgeAgent envia para 09-QA-Analyst                                         │
│       │                                                                          │
│       ▼                                                                          │
│  QA-Analyst tem 6 dimensoes (4 originais + 2 do AgenticOS)                      │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. CHECKLIST DE IMPLEMENTACAO

### Semana 1

- [ ] **Dia 1-2: Setup**
  - [ ] Criar branch `feature/fase-0-integration`
  - [ ] Criar arquivo `integration_bridge.py`
  - [ ] Criar tabelas Supabase (integration_sync_log, enriched_lead_data)
  - [ ] Criar view unified_leads

- [ ] **Dia 3-4: Subagentes**
  - [ ] Implementar LeadSyncAgent
  - [ ] Implementar GHLUpdaterAgent
  - [ ] Testar sincronizacao basica

- [ ] **Dia 5: Skills**
  - [ ] Implementar skill sync_lead
  - [ ] Implementar skill update_ghl_contact
  - [ ] Testar skills isoladamente

### Semana 2

- [ ] **Dia 1-2: Integracao GHL**
  - [ ] Criar custom fields no GHL (todas locations)
  - [ ] Testar atualizacao de campos
  - [ ] Implementar ensure_custom_fields_exist

- [ ] **Dia 3-4: Workflows n8n**
  - [ ] Criar 21-AgenticOS-Webhook-Receiver
  - [ ] Modificar 05-Execution para ler dados enriquecidos
  - [ ] Modificar 09-QA-Analyst para dimensoes extras

- [ ] **Dia 5: Testes E2E**
  - [ ] Testar fluxo completo: Lead discovery → Enrichment → GHL → AI Factory
  - [ ] Validar hiperpersonalizacao funcionando
  - [ ] Documentar resultados

---

## 9. METRICAS DE SUCESSO

| Metrica | Antes | Depois (Esperado) |
|---------|-------|-------------------|
| Leads com dados enriquecidos | 0% | 80%+ |
| Custom fields preenchidos no GHL | ~20% | 90%+ |
| Taxa de hiperpersonalizacao real | 0% | 80%+ |
| Dimensoes de QA | 4 | 6 |
| Tempo para lead ter dados completos | Manual | < 5 min |

---

## 10. RISCOS E MITIGACOES

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Rate limit GHL API | Alto | Implementar queue com delay |
| Dados duplicados | Medio | Usar UPSERT com unique constraints |
| Inconsistencia entre sistemas | Alto | Sync log + reconciliacao diaria |
| Performance | Medio | Batch processing + cache |

---

---

## 11. FLUXO CRITICO: PROSPECCAO → QUALIFICACAO → HANDOFF

### 11.1 Visao Geral do Fluxo

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                    FLUXO COMPLETO: OUTBOUND → INBOUND                            │
│                                                                                  │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ FASE A: PROSPECCAO (AgenticOS)                                            │  │
│  │                                                                            │  │
│  │  LeadDiscovery → ProfileAnalyzer → LeadQualifier → MessageComposer       │  │
│  │       │               │                │                │                 │  │
│  │       ▼               ▼                ▼                ▼                 │  │
│  │  crm_leads      enriched_data     icp_score        DM pronta             │  │
│  │  (CRM interno)                                          │                 │  │
│  │                                                         ▼                 │  │
│  │                                              OutreachExecutor            │  │
│  │                                                    │                      │  │
│  │                                                    ▼                      │  │
│  │                                              ENVIA DM (IG)               │  │
│  │                                                                            │  │
│  │  ⚠️ Lead existe no AgenticOS, NAO existe no GHL ainda                     │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ FASE B: LEAD RESPONDE                                                     │  │
│  │                                                                            │  │
│  │  Lead responde DM no Instagram                                            │  │
│  │       │                                                                    │  │
│  │       ▼                                                                    │  │
│  │  Webhook do IG dispara para n8n                                           │  │
│  │       │                                                                    │  │
│  │       ▼                                                                    │  │
│  │  14-Multi-Tenant-Inbox-Classifier identifica:                             │  │
│  │  - canal: instagram                                                        │  │
│  │  - location_id: qual cliente                                               │  │
│  │  - contact_id: quem eh o lead                                              │  │
│  │       │                                                                    │  │
│  │       ▼                                                                    │  │
│  │  ┌─────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  GATE DE QUALIFICACAO (NOVO - IntegrationBridge)                    │  │  │
│  │  │                                                                      │  │  │
│  │  │  1. Verifica se lead existe no AgenticOS (by ig_handle)             │  │  │
│  │  │  2. Se existe: puxa dados enriquecidos (cargo, empresa, icp_score)  │  │  │
│  │  │  3. Se nao existe: eh lead de trafego (nao prospectado)             │  │  │
│  │  │  4. Anexa dados ao contexto do AI Factory                           │  │  │
│  │  └─────────────────────────────────────────────────────────────────────┘  │  │
│  │       │                                                                    │  │
│  │       ▼                                                                    │  │
│  │  05-AI-Agent-Execution-Modular                                            │  │
│  │  - Recebe contexto COM dados enriquecidos                                 │  │
│  │  - Gera resposta hiperpersonalizada                                       │  │
│  │  - Responde NO MESMO CANAL (Instagram)                                    │  │
│  │                                                                            │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                       │                                          │
│                                       ▼                                          │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ FASE C: SINCRONIZACAO COM GHL                                             │  │
│  │                                                                            │  │
│  │  Quando criar contato no GHL?                                             │  │
│  │                                                                            │  │
│  │  OPCAO RECOMENDADA: Apos primeira resposta qualificada                    │  │
│  │                                                                            │  │
│  │  ResponseAnalyzer detecta intent:                                         │  │
│  │  - "interessado" + icp_score >= 60 → CRIA NO GHL                         │  │
│  │  - "curioso" → Continua nurturing, nao cria ainda                        │  │
│  │  - "descarte" → Marca como perdido, nunca cria                           │  │
│  │                                                                            │  │
│  │  Quando cria no GHL:                                                      │  │
│  │  - Contato ja vem com todos os custom fields preenchidos                 │  │
│  │  - lead_cargo, lead_empresa, icp_score, lead_source                      │  │
│  │  - agenticos_id (link entre sistemas)                                     │  │
│  │                                                                            │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 11.2 Principio Multi-Canal

O AI Factory ja opera em multi-canal. O canal de ENTRADA define o canal de SAIDA:

```
┌─────────────────────────────────────────────────────────────────┐
│                    RESPOSTA MULTI-CANAL                          │
│                                                                  │
│  Lead envia por:          AI Factory responde por:              │
│  ─────────────────        ────────────────────────              │
│  Instagram DM      →      Instagram DM                          │
│  WhatsApp          →      WhatsApp                              │
│  Facebook Messenger →     Facebook Messenger                    │
│  SMS               →      SMS                                   │
│  Email             →      Email                                 │
│                                                                  │
│  O canal eh detectado pelo 14-Multi-Tenant-Inbox-Classifier     │
│  e passado para o 05-Execution que usa a API correta            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.3 Fluxo Detalhado: Outbound Instagram

```python
# ETAPA 1: Prospeccao (AgenticOS)
# ================================

# LeadDiscoveryAgent encontra lead
lead = {
    "id": "uuid-123",
    "name": "Joao Silva",
    "ig_handle": "@joaosilva",
    "source": "instagram_scrape",
    "status": "discovered"
}
# Salva em: crm_leads

# ProfileAnalyzerAgent enriquece
enrichment = {
    "lead_id": "uuid-123",
    "cargo": "CEO",
    "empresa": "TechCorp",
    "setor": "Tecnologia",
    "ig_followers": 5420,
    "ig_engagement": 3.2
}
# Salva em: enriched_lead_data

# LeadQualifierAgent pontua
lead["icp_score"] = 85
lead["icp_tier"] = "HOT"
# Atualiza: crm_leads

# MessageComposerAgent cria DM
dm = """
Oi Joao! Vi que voce esta a frente da TechCorp.
Estamos ajudando empresas de tech a [proposta de valor].
Faz sentido pra voce?
"""

# OutreachExecutorAgent envia
send_instagram_dm(handle="@joaosilva", message=dm)
lead["status"] = "outreach_sent"
lead["outreach_sent_at"] = "2026-01-02T10:00:00Z"


# ETAPA 2: Lead Responde (AI Factory)
# ====================================

# Webhook do Instagram chega no n8n
webhook_payload = {
    "platform": "instagram",
    "sender": "@joaosilva",
    "message": "Oi! Sim, conte mais sobre isso",
    "location_id": "loc_abc123",
    "timestamp": "2026-01-02T10:15:00Z"
}

# 14-Multi-Tenant-Inbox-Classifier processa
classified = {
    "channel": "instagram",
    "location_id": "loc_abc123",
    "contact_id": "ghl_contact_xyz",  # Se ja existe no GHL
    "ig_handle": "@joaosilva"
}

# NOVO: IntegrationBridge busca dados do AgenticOS
agenticos_data = integration_bridge.get_lead_by_ig_handle("@joaosilva")
# Retorna:
# {
#   "found": True,
#   "lead_id": "uuid-123",
#   "cargo": "CEO",
#   "empresa": "TechCorp",
#   "icp_score": 85,
#   "outreach_message": "Oi Joao! Vi que voce...",
#   "prospected_at": "2026-01-02T10:00:00Z"
# }

# 05-AI-Agent-Execution-Modular recebe contexto expandido
execution_context = {
    "message": "Oi! Sim, conte mais sobre isso",
    "channel": "instagram",
    "contact": {
        "name": "Joao Silva",
        "ig_handle": "@joaosilva",
        # Dados do AgenticOS (HIPERPERSONALIZACAO REAL)
        "cargo": "CEO",
        "empresa": "TechCorp",
        "setor": "Tecnologia",
        "icp_score": 85,
        "was_prospected": True,
        "prospected_at": "2026-01-02T10:00:00Z"
    }
}

# IA gera resposta hiperpersonalizada
ai_response = """
Que bom Joao! Como CEO da TechCorp, voce provavelmente
lida com [dor especifica do setor tech].

Nossa solucao ajuda empresas como a sua a [beneficio].

Quer que eu te mande um case de uma empresa similar?
"""

# Resposta vai pelo MESMO CANAL (Instagram)
send_instagram_dm(handle="@joaosilva", message=ai_response)


# ETAPA 3: Sync com GHL (Apos qualificacao)
# ==========================================

# ResponseAnalyzer detecta intent positivo
intent = analyze_intent("Oi! Sim, conte mais sobre isso")
# intent = "interested"

# Como intent == "interested" e icp_score >= 60:
if intent == "interested" and agenticos_data["icp_score"] >= 60:

    # Criar contato no GHL com dados completos
    ghl_contact = create_ghl_contact(
        location_id="loc_abc123",
        first_name="Joao",
        last_name="Silva",
        custom_fields={
            "lead_cargo": "CEO",
            "lead_empresa": "TechCorp",
            "lead_setor": "Tecnologia",
            "icp_score": "85",
            "icp_tier": "HOT",
            "lead_source": "instagram_outbound",
            "agenticos_id": "uuid-123",  # LINK CRITICO
            "enriched_at": "2026-01-02T10:00:00Z"
        }
    )

    # Atualizar AgenticOS com referencia do GHL
    update_lead(
        lead_id="uuid-123",
        ghl_contact_id=ghl_contact["id"],
        status="synced_to_ghl"
    )
```

### 11.4 Subagente: LeadHandoffAgent (NOVO)

```python
class LeadHandoffAgent(BaseAgent):
    """
    Gerencia o handoff de leads do AgenticOS para o GHL.

    Responsabilidades:
    1. Detectar quando lead deve ir pro GHL
    2. Criar contato com dados enriquecidos
    3. Manter link entre sistemas (agenticos_id)
    4. Evitar duplicatas

    Triggers:
    - Quando lead responde com intent positivo
    - Quando lead pede contato direto (WhatsApp, telefone)
    - Quando lead agenda reuniao
    """

    async def should_handoff(self, lead_id: str, response: str) -> bool:
        """Decide se lead deve ir pro GHL."""

        # Buscar dados do lead
        lead = await self.get_lead(lead_id)

        # Analisar intent da resposta
        intent = await self.analyze_intent(response)

        # Regras de handoff
        if intent == "interested" and lead["icp_score"] >= 60:
            return True

        if intent == "requested_contact":
            return True

        if intent == "scheduled_meeting":
            return True

        return False

    async def execute_handoff(self, lead_id: str, location_id: str) -> Dict:
        """Executa o handoff para o GHL."""

        # 1. Buscar todos os dados
        lead = await self.get_lead(lead_id)
        enriched = await self.get_enriched_data(lead_id)

        # 2. Verificar se ja existe no GHL
        existing = await self.find_ghl_contact(
            location_id=location_id,
            ig_handle=lead.get("ig_handle"),
            email=lead.get("email"),
            phone=lead.get("phone")
        )

        if existing:
            # Atualizar contato existente
            await self.update_ghl_contact(
                contact_id=existing["id"],
                location_id=location_id,
                custom_fields=self._build_custom_fields(lead, enriched)
            )
            return {"action": "updated", "contact_id": existing["id"]}

        # 3. Criar novo contato
        contact = await self.create_ghl_contact(
            location_id=location_id,
            first_name=lead.get("first_name"),
            last_name=lead.get("last_name"),
            email=lead.get("email"),
            phone=lead.get("phone"),
            custom_fields=self._build_custom_fields(lead, enriched)
        )

        # 4. Atualizar AgenticOS
        await self.update_lead(
            lead_id=lead_id,
            ghl_contact_id=contact["id"],
            status="synced_to_ghl",
            synced_at="now()"
        )

        # 5. Registrar sync
        await self.log_sync(
            source="agenticos",
            target="ghl",
            entity_type="lead",
            entity_id=lead_id,
            sync_data={"ghl_contact_id": contact["id"]}
        )

        return {"action": "created", "contact_id": contact["id"]}

    def _build_custom_fields(self, lead: Dict, enriched: Dict) -> Dict:
        """Monta custom fields para o GHL."""
        return {
            "lead_cargo": enriched.get("cargo"),
            "lead_empresa": enriched.get("empresa"),
            "lead_setor": enriched.get("setor"),
            "lead_porte": enriched.get("porte"),
            "lead_followers": str(enriched.get("ig_followers", "")),
            "lead_engagement": str(enriched.get("ig_engagement", "")),
            "icp_score": str(lead.get("icp_score", 0)),
            "icp_tier": lead.get("icp_tier", "COLD"),
            "lead_source": lead.get("source", "unknown"),
            "agenticos_id": lead.get("id"),
            "enriched_at": enriched.get("enriched_at")
        }
```

### 11.5 Skill: get_lead_by_channel (NOVO)

```python
# AgenticOSKevsAcademy/implementation/skills/get_lead_by_channel.py

from . import skill
from typing import Dict, Optional

@skill(name="get_lead_by_channel", description="Busca lead pelo identificador do canal")
async def get_lead_by_channel(
    channel: str,
    identifier: str
) -> Dict:
    """
    Busca lead no AgenticOS pelo identificador do canal.

    Params:
    - channel: "instagram", "whatsapp", "email"
    - identifier: @handle, +5511999999999, email@domain.com

    Returns:
    - found: bool
    - lead_data: Dict com dados do lead e enriquecimento
    """

    # Mapear channel para campo de busca
    field_map = {
        "instagram": "ig_handle",
        "whatsapp": "phone",
        "email": "email",
        "facebook": "fb_id"
    }

    field = field_map.get(channel)
    if not field:
        return {"found": False, "error": f"Canal desconhecido: {channel}"}

    # Normalizar identifier
    if channel == "instagram" and not identifier.startswith("@"):
        identifier = f"@{identifier}"

    if channel == "whatsapp":
        identifier = normalize_phone(identifier)

    # Buscar lead
    lead = supabase.table("socialfy_leads")\
        .select("*")\
        .eq(field, identifier)\
        .single()\
        .execute()

    if not lead.data:
        return {"found": False, "lead_data": None}

    # Buscar dados enriquecidos
    enriched = supabase.table("enriched_lead_data")\
        .select("*")\
        .eq("lead_id", lead.data["id"])\
        .execute()

    # Consolidar dados
    lead_data = {
        **lead.data,
        "enrichment": consolidate_enrichment(enriched.data) if enriched.data else {},
        "was_prospected": lead.data.get("source", "").startswith("outbound"),
        "prospected_at": lead.data.get("outreach_sent_at")
    }

    return {
        "found": True,
        "lead_data": lead_data
    }
```

### 11.6 Modificacao: 05-AI-Agent-Execution-Modular

Adicionar node ANTES do AI Agent para buscar dados do AgenticOS:

```
┌─────────────────────────────────────────────────────────────────┐
│  FLUXO MODIFICADO: 05-AI-Agent-Execution-Modular                │
│                                                                  │
│  Webhook Trigger                                                 │
│       │                                                          │
│       ▼                                                          │
│  [EXISTENTE] Classificar mensagem                                │
│       │                                                          │
│       ▼                                                          │
│  [NOVO] HTTP Request: Buscar dados AgenticOS ◄────────────────┐ │
│       │                                                        │ │
│       │  POST /api/get-lead-context                           │ │
│       │  {                                                     │ │
│       │    "channel": "{{$json.channel}}",                    │ │
│       │    "identifier": "{{$json.sender}}"                   │ │
│       │  }                                                     │ │
│       │                                                        │ │
│       │  Response:                                             │ │
│       │  {                                                     │ │
│       │    "found": true,                                      │ │
│       │    "cargo": "CEO",                                     │ │
│       │    "empresa": "TechCorp",                              │ │
│       │    "icp_score": 85,                                    │ │
│       │    "was_prospected": true                              │ │
│       │  }                                                     │ │
│       │                                                          │
│       ▼                                                          │
│  [EXISTENTE] Buscar agente ativo                                │
│       │                                                          │
│       ▼                                                          │
│  [MODIFICADO] Montar prompt com contexto expandido              │
│       │                                                          │
│       │  Se agenticos_data.found:                               │
│       │    prompt += "                                          │
│       │      CONTEXTO DO LEAD:                                  │
│       │      - Cargo: {{cargo}}                                 │
│       │      - Empresa: {{empresa}}                             │
│       │      - ICP Score: {{icp_score}}/100                     │
│       │      - Foi prospectado: {{was_prospected}}              │
│       │    "                                                     │
│       │                                                          │
│       ▼                                                          │
│  [EXISTENTE] AI Agent (OpenRouter)                              │
│       │                                                          │
│       ▼                                                          │
│  [EXISTENTE] Enviar resposta pelo canal de origem               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.7 Endpoint API: get-lead-context

```python
# AgenticOSKevsAcademy/api/endpoints/lead_context.py

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from implementation.skills.get_lead_by_channel import get_lead_by_channel

router = APIRouter()

class LeadContextRequest(BaseModel):
    channel: str
    identifier: str

class LeadContextResponse(BaseModel):
    found: bool
    lead_id: str = None
    cargo: str = None
    empresa: str = None
    setor: str = None
    porte: str = None
    icp_score: int = None
    icp_tier: str = None
    ig_followers: int = None
    ig_engagement: float = None
    was_prospected: bool = False
    prospected_at: str = None
    outreach_message: str = None

@router.post("/api/get-lead-context", response_model=LeadContextResponse)
async def get_lead_context(request: LeadContextRequest):
    """
    Endpoint para AI Factory buscar contexto do lead.
    Chamado pelo 05-Execution antes de gerar resposta.
    """

    result = await get_lead_by_channel(
        channel=request.channel,
        identifier=request.identifier
    )

    if not result["found"]:
        return LeadContextResponse(found=False)

    lead = result["lead_data"]
    enrichment = lead.get("enrichment", {})

    return LeadContextResponse(
        found=True,
        lead_id=lead.get("id"),
        cargo=enrichment.get("cargo"),
        empresa=enrichment.get("empresa"),
        setor=enrichment.get("setor"),
        porte=enrichment.get("porte"),
        icp_score=lead.get("icp_score"),
        icp_tier=lead.get("icp_tier"),
        ig_followers=enrichment.get("ig_followers"),
        ig_engagement=enrichment.get("ig_engagement"),
        was_prospected=lead.get("was_prospected", False),
        prospected_at=lead.get("prospected_at"),
        outreach_message=lead.get("last_outreach_message")
    )
```

---

## 12. IMPLEMENTACAO DETALHADA DOS SKILLS

### 12.1 Estrutura Base dos Skills

```python
# AgenticOSKevsAcademy/implementation/skills/__init__.py

from typing import Dict, List, Any, Literal, Optional
from functools import wraps
import asyncio
from supabase import create_client
import httpx

# Decorator para skills
def skill(name: str, description: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Log inicio
            print(f"[SKILL] Executando: {name}")
            try:
                result = await func(*args, **kwargs)
                # Log sucesso
                print(f"[SKILL] Concluido: {name}")
                return {"success": True, "data": result}
            except Exception as e:
                # Log erro
                print(f"[SKILL] Erro em {name}: {str(e)}")
                return {"success": False, "error": str(e)}
        wrapper._skill_name = name
        wrapper._skill_description = description
        return wrapper
    return decorator
```

### 12.2 Skill: sync_lead (Implementacao Completa)

```python
# AgenticOSKevsAcademy/implementation/skills/sync_lead.py

from . import skill
from typing import Dict, Literal
import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@skill(name="sync_lead", description="Sincroniza lead entre sistemas")
async def sync_lead(
    lead_id: str,
    source: Literal["agenticos", "ai_factory"],
    target: Literal["agenticos", "ai_factory", "ghl"]
) -> Dict:
    """
    Sincroniza dados de um lead entre sistemas.
    """

    # 1. Buscar dados do lead no source
    if source == "agenticos":
        lead_data = supabase.table("socialfy_leads").select("*").eq("id", lead_id).single().execute()

        if not lead_data.data:
            return {"synced": False, "error": "Lead nao encontrado no AgenticOS"}

        lead = lead_data.data

        # 2. Buscar dados enriquecidos
        enriched = supabase.table("enriched_lead_data").select("*").eq("lead_id", lead_id).execute()

    elif source == "ai_factory":
        # Buscar do AI Factory (agent_conversations com contact_id)
        lead = supabase.table("agent_conversations")\
            .select("contact_id, contact_name, contact_phone")\
            .eq("id", lead_id)\
            .single().execute().data

    # 3. Sincronizar para target
    if target == "ai_factory":
        # Upsert em tabela unificada
        sync_data = {
            "agenticos_id": lead_id,
            "name": lead.get("name"),
            "phone": lead.get("phone"),
            "email": lead.get("email"),
            "cargo": lead.get("source_data", {}).get("cargo"),
            "empresa": lead.get("source_data", {}).get("empresa"),
            "setor": lead.get("source_data", {}).get("setor"),
            "icp_score": lead.get("icp_score"),
            "synced_at": "now()"
        }

        result = supabase.table("unified_leads").upsert(sync_data).execute()

    elif target == "ghl":
        # Preparar para GHLUpdaterAgent
        from .update_ghl_contact import update_ghl_contact

        ghl_data = {
            "lead_cargo": lead.get("source_data", {}).get("cargo"),
            "lead_empresa": lead.get("source_data", {}).get("empresa"),
            "lead_setor": lead.get("source_data", {}).get("setor"),
            "icp_score": str(lead.get("icp_score", 0)),
            "enriched_at": lead.get("updated_at")
        }

        result = await update_ghl_contact(
            contact_id=lead.get("ghl_contact_id"),
            location_id=lead.get("location_id"),
            custom_fields=ghl_data
        )

    # 4. Registrar sync log
    supabase.table("integration_sync_log").insert({
        "source_system": source,
        "target_system": target,
        "entity_type": "lead",
        "entity_id": lead_id,
        "sync_status": "success" if result else "failed",
        "sync_data": sync_data
    }).execute()

    return {
        "synced": True,
        "source": source,
        "target": target,
        "synced_fields": list(sync_data.keys()) if sync_data else []
    }
```

### 12.3 Skill: update_ghl_contact (Implementacao Completa)

```python
# AgenticOSKevsAcademy/implementation/skills/update_ghl_contact.py

from . import skill
from typing import Dict, Any
import os
import httpx

GHL_API_URL = "https://services.leadconnectorhq.com"
GHL_API_KEY = os.getenv("GHL_API_KEY")

@skill(name="update_ghl_contact", description="Atualiza contato no GHL")
async def update_ghl_contact(
    contact_id: str,
    location_id: str,
    custom_fields: Dict[str, Any]
) -> Dict:
    """
    Atualiza custom fields de um contato no GHL.
    """

    headers = {
        "Authorization": f"Bearer {GHL_API_KEY}",
        "Content-Type": "application/json",
        "Version": "2021-07-28"
    }

    # 1. Buscar IDs dos custom fields
    async with httpx.AsyncClient() as client:
        fields_response = await client.get(
            f"{GHL_API_URL}/locations/{location_id}/customFields",
            headers=headers
        )

        if fields_response.status_code != 200:
            return {"updated": False, "error": "Erro ao buscar custom fields"}

        existing_fields = fields_response.json().get("customFields", [])

        # Mapear field_key para field_id
        field_map = {f["fieldKey"]: f["id"] for f in existing_fields}

    # 2. Preparar payload para update
    custom_fields_payload = []

    for field_key, value in custom_fields.items():
        if field_key in field_map:
            custom_fields_payload.append({
                "id": field_map[field_key],
                "field_value": str(value) if value else ""
            })
        else:
            print(f"[WARN] Custom field '{field_key}' nao existe no GHL")

    # 3. Atualizar contato
    update_payload = {
        "customFields": custom_fields_payload
    }

    async with httpx.AsyncClient() as client:
        update_response = await client.put(
            f"{GHL_API_URL}/contacts/{contact_id}",
            headers=headers,
            json=update_payload
        )

        if update_response.status_code not in [200, 201]:
            return {
                "updated": False,
                "error": f"Erro ao atualizar: {update_response.text}"
            }

    return {
        "updated": True,
        "contact_id": contact_id,
        "updated_fields": list(custom_fields.keys())
    }
```

### 12.4 Skill: get_agent_config (Implementacao Completa)

```python
# AgenticOSKevsAcademy/implementation/skills/get_agent_config.py

from . import skill
from typing import Dict
import os
from supabase import create_client

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@skill(name="get_agent_config", description="Busca config do agente AI Factory")
async def get_agent_config(location_id: str) -> Dict:
    """
    Busca configuracao do agente ativo para uma location.
    """

    # 1. Buscar client pela location_id
    client_response = supabase.table("clients")\
        .select("id, name, location_id")\
        .eq("location_id", location_id)\
        .single()\
        .execute()

    if not client_response.data:
        return {"found": False, "error": "Cliente nao encontrado para location"}

    client_id = client_response.data["id"]

    # 2. Buscar agent_version ativo
    agent_response = supabase.table("agent_versions")\
        .select("*")\
        .eq("client_id", client_id)\
        .eq("is_active", True)\
        .single()\
        .execute()

    if not agent_response.data:
        return {"found": False, "error": "Nenhum agente ativo para este cliente"}

    agent = agent_response.data

    # 3. Formatar resposta
    return {
        "found": True,
        "agent_id": agent["id"],
        "version": agent["version"],
        "personality": {
            "tone": agent.get("personality_tone", "profissional"),
            "style": agent.get("personality_style", "consultivo"),
            "characteristics": agent.get("personality_traits", [])
        },
        "modes": agent.get("available_modes", ["vendas", "suporte"]),
        "hyperpersonalization": {
            "enabled": agent.get("hyperpersonalization_enabled", False),
            "fields_used": agent.get("hyperpersonalization_fields", []),
            "templates": agent.get("hyperpersonalization_templates", {})
        },
        "compliance_rules": agent.get("compliance_rules", []),
        "prompt_base": agent.get("system_prompt", ""),
        "created_at": agent.get("created_at"),
        "updated_at": agent.get("updated_at")
    }
```

### 12.5 Skill: send_qa_data (Implementacao Completa)

```python
# AgenticOSKevsAcademy/implementation/skills/send_qa_data.py

from . import skill
from typing import Dict, Literal
import os
from supabase import create_client
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_BASE_URL", "https://n8n.mottivme.com.br")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@skill(name="send_qa_data", description="Envia dados para QA Analyst")
async def send_qa_data(
    conversation_id: str,
    qa_type: Literal["sentiment", "message_quality", "compliance"],
    data: Dict
) -> Dict:
    """
    Envia dados de qualidade para o 09-QA-Analyst.
    """

    # 1. Validar conversa existe
    conv_response = supabase.table("agent_conversations")\
        .select("id, client_id, contact_id")\
        .eq("id", conversation_id)\
        .single()\
        .execute()

    if not conv_response.data:
        return {"sent": False, "error": "Conversa nao encontrada"}

    conversation = conv_response.data

    # 2. Preparar payload baseado no tipo
    qa_payload = {
        "conversation_id": conversation_id,
        "client_id": conversation["client_id"],
        "contact_id": conversation["contact_id"],
        "qa_type": qa_type,
        "source": "agenticos_quality_squad"
    }

    if qa_type == "sentiment":
        qa_payload.update({
            "sentiment_score": data.get("score", 0),  # -1 a 1
            "sentiment_label": data.get("label", "neutro"),  # positivo/neutro/negativo
            "sentiment_confidence": data.get("confidence", 0.5),
            "key_phrases": data.get("key_phrases", []),
            "emotional_indicators": data.get("emotional_indicators", [])
        })

    elif qa_type == "message_quality":
        qa_payload.update({
            "quality_score": data.get("score", 0),  # 0-100
            "grammar_score": data.get("grammar", 100),
            "clarity_score": data.get("clarity", 100),
            "relevance_score": data.get("relevance", 100),
            "issues_found": data.get("issues", [])
        })

    elif qa_type == "compliance":
        qa_payload.update({
            "compliance_passed": data.get("passed", True),
            "violations": data.get("violations", []),
            "warnings": data.get("warnings", []),
            "checked_rules": data.get("rules_checked", [])
        })

    # 3. Inserir em qa_analyses (adicionar dimensoes extras)
    qa_analysis = {
        "conversation_id": conversation_id,
        "agent_version_id": await _get_active_agent_version(conversation["client_id"]),
        "agenticos_data": qa_payload,
        "dimensions": {
            "agenticos_sentiment": qa_payload.get("sentiment_score"),
            "agenticos_quality": qa_payload.get("quality_score"),
            "agenticos_compliance": qa_payload.get("compliance_passed")
        }
    }

    result = supabase.table("qa_analyses")\
        .upsert(qa_analysis, on_conflict="conversation_id")\
        .execute()

    # 4. Opcional: Disparar webhook para 09-QA-Analyst processar
    async with httpx.AsyncClient() as client:
        try:
            webhook_response = await client.post(
                f"{N8N_WEBHOOK_URL}/webhook/qa-analyst-external",
                json=qa_payload,
                timeout=10.0
            )
        except:
            pass  # Nao bloqueia se webhook falhar

    return {
        "sent": True,
        "qa_type": qa_type,
        "conversation_id": conversation_id,
        "qa_analysis_id": result.data[0]["id"] if result.data else None
    }


async def _get_active_agent_version(client_id: str) -> str:
    """Helper para buscar agent_version ativo."""
    result = supabase.table("agent_versions")\
        .select("id")\
        .eq("client_id", client_id)\
        .eq("is_active", True)\
        .single()\
        .execute()

    return result.data["id"] if result.data else None
```

### 12.6 Skill: enrich_lead (Implementacao Completa)

```python
# AgenticOSKevsAcademy/implementation/skills/enrich_lead.py

from . import skill
from typing import Dict, List, Literal
import os
from supabase import create_client
import httpx

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
APIFY_TOKEN = os.getenv("APIFY_TOKEN")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

@skill(name="enrich_lead", description="Enriquece lead com dados externos")
async def enrich_lead(
    lead_id: str,
    sources: List[Literal["instagram", "linkedin", "cnpj"]]
) -> Dict:
    """
    Enriquece lead buscando dados de fontes externas.
    """

    # 1. Buscar lead
    lead_response = supabase.table("socialfy_leads")\
        .select("*")\
        .eq("id", lead_id)\
        .single()\
        .execute()

    if not lead_response.data:
        return {"enriched": False, "error": "Lead nao encontrado"}

    lead = lead_response.data
    enriched_data = {}
    sources_used = []
    total_confidence = 0

    # 2. Enriquecer de cada source
    if "instagram" in sources and lead.get("instagram_handle"):
        ig_data = await _enrich_from_instagram(lead["instagram_handle"])
        if ig_data:
            enriched_data["instagram"] = ig_data
            sources_used.append("instagram")
            total_confidence += ig_data.get("confidence", 0)

            # Salvar em enriched_lead_data
            supabase.table("enriched_lead_data").upsert({
                "lead_id": lead_id,
                "source": "instagram",
                "ig_handle": lead["instagram_handle"],
                "ig_followers": ig_data.get("followers"),
                "ig_following": ig_data.get("following"),
                "ig_posts": ig_data.get("posts"),
                "ig_engagement_rate": ig_data.get("engagement_rate"),
                "ig_bio": ig_data.get("bio"),
                "ig_is_business": ig_data.get("is_business"),
                "ig_category": ig_data.get("category"),
                "raw_data": ig_data,
                "confidence_score": ig_data.get("confidence", 0.5)
            }, on_conflict="lead_id,source").execute()

    if "linkedin" in sources and lead.get("linkedin_url"):
        li_data = await _enrich_from_linkedin(lead["linkedin_url"])
        if li_data:
            enriched_data["linkedin"] = li_data
            sources_used.append("linkedin")
            total_confidence += li_data.get("confidence", 0)

            supabase.table("enriched_lead_data").upsert({
                "lead_id": lead_id,
                "source": "linkedin",
                "cargo": li_data.get("headline"),
                "empresa": li_data.get("current_company"),
                "li_url": lead["linkedin_url"],
                "li_headline": li_data.get("headline"),
                "li_connections": li_data.get("connections"),
                "li_experience": li_data.get("experience"),
                "li_education": li_data.get("education"),
                "raw_data": li_data,
                "confidence_score": li_data.get("confidence", 0.5)
            }, on_conflict="lead_id,source").execute()

    if "cnpj" in sources and lead.get("cnpj"):
        cnpj_data = await _enrich_from_cnpj(lead["cnpj"])
        if cnpj_data:
            enriched_data["cnpj"] = cnpj_data
            sources_used.append("cnpj")
            total_confidence += cnpj_data.get("confidence", 0)

            supabase.table("enriched_lead_data").upsert({
                "lead_id": lead_id,
                "source": "cnpj",
                "cnpj": lead["cnpj"],
                "razao_social": cnpj_data.get("razao_social"),
                "empresa": cnpj_data.get("nome_fantasia"),
                "setor": cnpj_data.get("cnae_descricao"),
                "cnae_principal": cnpj_data.get("cnae"),
                "porte": cnpj_data.get("porte"),
                "faturamento_estimado": cnpj_data.get("faturamento"),
                "raw_data": cnpj_data,
                "confidence_score": cnpj_data.get("confidence", 0.8)
            }, on_conflict="lead_id,source").execute()

    # 3. Atualizar lead com dados consolidados
    update_data = {
        "enriched": True,
        "enriched_at": "now()",
        "source_data": _consolidate_enriched_data(enriched_data)
    }

    supabase.table("socialfy_leads")\
        .update(update_data)\
        .eq("id", lead_id)\
        .execute()

    avg_confidence = total_confidence / len(sources_used) if sources_used else 0

    return {
        "enriched": True,
        "lead_id": lead_id,
        "enriched_data": enriched_data,
        "sources_used": sources_used,
        "confidence_score": round(avg_confidence, 2)
    }


async def _enrich_from_instagram(handle: str) -> Dict:
    """Busca dados do Instagram via Apify."""
    # Usar scraper do Apify
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.apify.com/v2/acts/apify~instagram-profile-scraper/runs",
            headers={"Authorization": f"Bearer {APIFY_TOKEN}"},
            json={
                "usernames": [handle],
                "resultsLimit": 1
            }
        )
        # Processar resposta...
        # Retornar dados estruturados
    return {}


async def _enrich_from_linkedin(url: str) -> Dict:
    """Busca dados do LinkedIn via Apify."""
    return {}


async def _enrich_from_cnpj(cnpj: str) -> Dict:
    """Busca dados via API ReceitaWS."""
    cnpj_clean = "".join(filter(str.isdigit, cnpj))
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"https://receitaws.com.br/v1/cnpj/{cnpj_clean}"
        )
        if response.status_code == 200:
            data = response.json()
            return {
                "razao_social": data.get("nome"),
                "nome_fantasia": data.get("fantasia"),
                "cnae": data.get("atividade_principal", [{}])[0].get("code"),
                "cnae_descricao": data.get("atividade_principal", [{}])[0].get("text"),
                "porte": data.get("porte"),
                "confidence": 0.9
            }
    return {}


def _consolidate_enriched_data(enriched: Dict) -> Dict:
    """Consolida dados de multiplas fontes."""
    consolidated = {}

    # Prioridade: LinkedIn > CNPJ > Instagram
    for source in ["instagram", "cnpj", "linkedin"]:
        if source in enriched:
            data = enriched[source]
            if "cargo" not in consolidated and data.get("headline"):
                consolidated["cargo"] = data["headline"]
            if "empresa" not in consolidated and data.get("current_company"):
                consolidated["empresa"] = data["current_company"]
            if "setor" not in consolidated and data.get("cnae_descricao"):
                consolidated["setor"] = data["cnae_descricao"]
            if "porte" not in consolidated and data.get("porte"):
                consolidated["porte"] = data["porte"]

    return consolidated
```

---

## 12. ARQUIVOS A CRIAR

### Estrutura de Diretorios

```
AgenticOSKevsAcademy/
├── implementation/
│   ├── skills/
│   │   ├── __init__.py          # Decorator e base
│   │   ├── sync_lead.py         # Skill sync_lead
│   │   ├── enrich_lead.py       # Skill enrich_lead
│   │   ├── update_ghl_contact.py # Skill update_ghl_contact
│   │   ├── get_agent_config.py  # Skill get_agent_config
│   │   └── send_qa_data.py      # Skill send_qa_data
│   │
│   ├── agents/
│   │   ├── integration_orchestrator.py  # Orquestrador FASE 0
│   │   ├── lead_sync_agent.py           # Subagente LeadSync
│   │   ├── ghl_updater_agent.py         # Subagente GHLUpdater
│   │   ├── qa_bridge_agent.py           # Subagente QABridge
│   │   └── config_fetcher_agent.py      # Subagente ConfigFetcher
│   │
│   └── integration_bridge.py    # Service principal
```

---

## 13. COMANDOS DE DEPLOY

```bash
# 1. Criar branch
git checkout -b feature/fase-0-integration

# 2. Criar estrutura de diretorios
mkdir -p implementation/skills
mkdir -p implementation/agents

# 3. Aplicar migrations Supabase
supabase db push --file supabase/migrations/001_integration_tables.sql

# 4. Criar custom fields no GHL (via API ou manual)
python scripts/create_ghl_custom_fields.py

# 5. Deploy workflow n8n
# Importar 21-AgenticOS-Webhook-Receiver.json no n8n

# 6. Testar
python -m pytest tests/integration/test_fase_0.py

# 7. Ativar
python implementation/integration_bridge.py
```

---

*Documento: FASE-0-PLANO-IMPLEMENTACAO.md*
*Versao: 3.0*
*Data: 2026-01-02*
*Atualizado com:*
- *Secao 11: Fluxo Critico Prospeccao → Qualificacao → Handoff*
- *Secao 11.2: Principio Multi-Canal (resposta no mesmo canal)*
- *Secao 11.3: Fluxo detalhado Outbound Instagram*
- *Secao 11.4: Novo subagente LeadHandoffAgent*
- *Secao 11.5: Novo skill get_lead_by_channel*
- *Secao 11.6-11.7: Modificacao 05-Execution + Endpoint API*
- *Secao 12: Implementacao completa dos 7 skills*
