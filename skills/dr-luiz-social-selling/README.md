# 🎯 Dr. Luiz - Social Selling Specialist (Instagram)

## 📋 Visão Geral

Skill completa de **Social Selling semântico** para prospecção no Instagram, desenvolvida para o Dr. Luiz (odontologia estética). Combina:

- ✅ **Qualificação semântica** de perfis (score 0-100)
- ✅ **Conversação consultiva** em 5 fases (First Contact → Closing)
- ✅ **Hiperpersonalização** regional (DDD) e demográfica
- ✅ **BANT tracking** automático
- ✅ **Compliance** rigoroso (sem diagnósticos, sem venda agressiva)
- ✅ **Testing framework** com 20 casos de teste

---

## 📁 Estrutura de Arquivos

```
dr-luiz-social-selling/
├── INSTRUCTIONS.md       # ⭐ Prompt completo do agente (31KB)
├── EXAMPLES.md           # 📚 5 conversas completas (few-shot)
├── RUBRIC.md             # 📊 Rubrica de avaliação (5 dimensões)
├── test-cases.json       # 🧪 20 casos de teste
├── README.md             # 📖 Este arquivo
└── workflows/            # 🔄 n8n workflows (criados à parte)
    ├── 14-Instagram-Prospector.json
    └── 15-Instagram-Semantic-Qualifier.json
```

---

## 🚀 Como Usar

### 1. Criar Agent Version no Supabase

```sql
-- Ver arquivo: create-dr-luiz-agent.sql
INSERT INTO agent_versions (
  client_id,
  location_id,
  agent_name,
  version,
  system_prompt,
  agent_config,
  hyperpersonalization,
  status,
  is_active
) VALUES (
  'CLIENT_UUID',
  'LOCATION_ID_DR_LUIZ',
  'Dr. Luiz - Social Selling Instagram',
  1,
  '...', -- INSTRUCTIONS.md
  '{
    "prompts_por_modo": {
      "instagram_prospector": "..."
    },
    "tools_config": {...}
  }',
  '{
    "ddd": "11",
    "setor": "odontologia",
    "porte": "consultorio_medio"
  }',
  'active',
  true
);
```

### 2. Importar Workflows n8n

**Workflow 14 - Instagram Prospector:**
- Monitora DMs do Instagram
- Identifica fase da conversa
- Executa agente com contexto
- Responde automaticamente

**Workflow 15 - Instagram Semantic Qualifier:**
- Analisa perfis do Instagram
- Calcula score de qualificação (0-100)
- Envia DM apenas se score ≥ 40
- Rastreia engajamento

### 3. Configurar Integração Instagram

**Requisitos:**
- Instagram Business Account
- Meta Business Suite configurado
- Webhook do Instagram conectado ao n8n
- Permissões: `instagram_basic`, `instagram_manage_messages`

**Setup:**
1. Criar app no Meta for Developers
2. Configurar webhook apontando para n8n
3. Autorizar conta do Dr. Luiz
4. Testar envio/recebimento de DM

---

## 🎨 Sistema de Qualificação Semântica

### Score de Perfil (0-100 pontos)

```javascript
const profileScore = {
  bio_description: 20,      // Menciona dor/interesse dental?
  engagement: 30,           // Curtiu/comentou posts?
  demographics: 25,         // Idade, profissão, localização?
  recent_activity: 25       // Engajou nas últimas 48h?
};

// Exemplo de perfil HIGH-SCORE (85 pontos):
{
  "bio": "Designer | SP | Apaixonada por autocuidado ✨",  // +10
  "engagement": [
    {"type": "like", "post": "clareamento"},              // +15
    {"type": "comment", "content": "Adorei!"}             // +10
  ],
  "demographics": {
    "age_range": "25-34",                                 // +10
    "occupation": "Designer",                             // +10
    "location": "São Paulo, SP"                           // +5
  },
  "recent_activity": "curtiu 3 posts nas últimas 24h"    // +10
}
// TOTAL: 10+15+10+10+10+5+10 = 70 → QUALIFICADO
```

**Regra de Envio:**
- Score ≥ 60: Enviar DM imediatamente (alta prioridade)
- Score 40-59: Enviar DM após 24h (lead morno)
- Score < 40: NÃO enviar DM (apenas nutrir com conteúdo)

---

## 🔄 Fluxo de Prospecção (5 Fases)

### FASE 1: Identificação & Qualificação
- Analisa perfil do lead
- Calcula score semântico
- Decide se envia DM

### FASE 2: First Contact
- Primeira mensagem personalizada
- Referencia engajamento real
- Pergunta aberta

### FASE 3: Discovery
- Qualifica BANT
- Educa sobre soluções
- Quebra objeções

### FASE 4: Value Anchoring
- Apresenta opções de tratamento
- Ancora valor (não preço)
- Social proof

### FASE 5: Closing
- Propõe avaliação
- Fechamento assumido
- Confirma agendamento

---

## 📊 BANT Tracking Automático

```json
{
  "bant_score": {
    "budget": 0.8,      // 0-1: Pode pagar? Sabe preço?
    "authority": 1.0,   // 0-1: Quem decide?
    "need": 0.9,        // 0-1: Dor/problema claro?
    "timeline": 0.7     // 0-1: Quando quer resolver?
  },
  "overall_bant": 0.85  // Média ponderada
}
```

**Threshold de Qualificação:**
- BANT ≥ 0.7: Lead qualificado → Move para fechamento
- BANT 0.4-0.69: Lead morno → Continua nutrição
- BANT < 0.4: Lead frio → Aguarda 48h antes de follow-up

---

## 🎯 Métricas & KPIs

### Métricas Principais

| Métrica | Meta | Atual |
|---------|------|-------|
| Taxa de Resposta (1ª msg) | >35% | - |
| Conversas com 3+ trocas | >60% | - |
| Leads Qualificados (BANT≥0.7) | >40% | - |
| Taxa de Agendamento | >15% | - |
| Show-Up Rate | >70% | - |

### Métricas Secundárias

- Tempo médio de resposta: <2 min
- Mensagens até agendamento: 8-12
- Ciclo de venda: 3-7 dias
- NPS pós-consulta: >9.0

---

## 🧪 Testing & Validation

### Casos de Teste

**20 cenários** cobrindo:
- ✅ First contact (lead frio/morno)
- ✅ Objeções (preço, dor, tempo, medo)
- ✅ Fechamento (aceita/recusa)
- ✅ Follow-up (recuperação)
- ✅ Compliance (diagnóstico, horário)

**Rubrica de Avaliação (5 Dimensões):**
1. **Completeness** (25%): BANT completo?
2. **Tone** (20%): Tom consultivo e empático?
3. **Engagement** (20%): Lead engajado?
4. **Compliance** (20%): Seguiu guardrails?
5. **Conversion** (15%): Moveu para próximo passo?

**Threshold:** 8.0/10 para aprovação

### Como Testar

```bash
# Via Testing Framework (Python)
python -m src.cli test --agent-id <AGENT_VERSION_ID>

# Via n8n (manual)
1. Importar workflow 14
2. Enviar DM de teste para conta do Instagram
3. Verificar resposta do agente
4. Avaliar com rubrica
```

---

## 🚨 Guardrails & Compliance

### ❌ NUNCA:

1. Dar diagnóstico por DM
2. Prometer resultado garantido
3. Comparar com concorrente pelo nome
4. Pressionar após lead dizer "não"
5. Enviar >2 follow-ups sem resposta
6. Responder fora de horário (8h-19h)

### ✅ SEMPRE:

1. Personalizar primeira mensagem
2. Educar antes de vender
3. Validar objeções (não ignorar)
4. Respeitar autonomia do lead
5. Usar fechamento assumido
6. Entregar valor grátis para leads não qualificados

---

## 🎨 Hiperpersonalização

### Por DDD (Linguagem Regional)

| DDD | Região | Tom |
|-----|--------|-----|
| 11 | SP | Direto, objetivo |
| 21 | RJ | Descontraído, usa gírias leves |
| 31 | BH | Acolhedor, pede confirmação |
| 51 | POA | Caloroso, usa "tu" |

### Por Perfil Demográfico

**Executivo (30-50 anos):**
- Tom formal-objetivo
- Foco em ROI
- Horários flexíveis

**Jovem Profissional (25-35 anos):**
- Tom descontraído
- Foco em autoestima
- Referências culturais atuais

---

## 📦 Integração com GHL

### Webhook GHL → n8n

```json
{
  "contactId": "CONTACT_ID",
  "locationId": "LOCATION_ID",
  "source": "instagram",
  "message": "Lead message...",
  "agente_ia": "instagram_prospector",
  "customFields": {
    "instagram_handle": "@lead_username",
    "engagement_score": 75,
    "bant_score": 0.65
  }
}
```

### n8n → GHL (Resposta)

```json
{
  "contactId": "CONTACT_ID",
  "message": "Dr. Luiz response...",
  "phase": "discovery",
  "bant_updated": {
    "budget": 0.7,
    "authority": 0.8,
    "need": 0.9,
    "timeline": 0.6
  },
  "next_action": "schedule_call | wait_48h | send_content"
}
```

---

## 🔧 Configuração Técnica

### Environment Variables

```bash
# Instagram
INSTAGRAM_ACCESS_TOKEN=EAAxxxxxxx
INSTAGRAM_BUSINESS_ACCOUNT_ID=123456789

# n8n
N8N_WEBHOOK_URL=https://n8n.mottivme.com/webhook/instagram

# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJhbG...

# Anthropic
ANTHROPIC_API_KEY=sk-ant-api...
```

### Credenciais Necessárias

- ✅ Instagram Business Account
- ✅ Meta for Developers App
- ✅ n8n (self-hosted ou cloud)
- ✅ Supabase (source of truth)
- ✅ Anthropic API (Claude Sonnet 4)

---

## 📚 Documentação Completa

- **[INSTRUCTIONS.md](./INSTRUCTIONS.md)** - Prompt completo do agente
- **[EXAMPLES.md](./EXAMPLES.md)** - 5 conversas reais completas
- **[RUBRIC.md](./RUBRIC.md)** - Critérios de avaliação
- **[test-cases.json](./test-cases.json)** - 20 casos de teste

---

## 🛠️ Troubleshooting

### Instagram não recebe mensagens

1. Verificar webhook configurado no Meta for Developers
2. Verificar permissões: `instagram_manage_messages`
3. Testar webhook manualmente (Postman)
4. Verificar logs do n8n

### Agente não responde

1. Verificar agent_version está `active` no Supabase
2. Verificar campo `agente_ia` no webhook = `instagram_prospector`
3. Verificar logs do n8n (erro de execução?)
4. Verificar API key Anthropic (rate limit?)

### Scoring de perfil sempre baixo

1. Verificar se bio está sendo lida corretamente
2. Verificar se engajamento recente está sendo rastreado
3. Ajustar pesos do scoring no workflow 15
4. Verificar logs de qualificação

---

## 🔄 Próximos Passos

### Melhorias Futuras

- [ ] A/B testing de mensagens iniciais
- [ ] Auto-learning baseado em conversões
- [ ] Dashboard de métricas em tempo real
- [ ] Integração com WhatsApp (após validação Instagram)
- [ ] Multi-idioma (espanhol para leads EUA)
- [ ] Sentiment analysis em tempo real

### Roadmap

**Q1 2025:**
- Validação com Dr. Luiz (50 leads teste)
- Ajustes baseados em feedback
- Expansão para outros médicos

**Q2 2025:**
- Lançamento oficial
- Dashboard de analytics
- Sistema de A/B testing

---

## 📞 Suporte

- **Slack:** #ai-factory-social-selling
- **Email:** dev@mottivme.com
- **Docs:** https://docs.mottivme.com/social-selling

---

## 📄 License

MIT License - Copyright (c) 2024 MOTTIVME

---

## 🙏 Credits

- **Dr. Luiz** - Especialista odontológico e validação
- **Marcos Daniels** - Product & Architecture
- **Claude (Anthropic)** - Code generation & skill design
- **AI Factory Team** - Testing & feedback

---

**Criado por:** Marcos Daniels / Claude Code
**Para:** Dr. Luiz - Odontologia Estética
**Versão:** 1.0
**Data:** 2024-12-31

---

## 🎯 Quick Start

```bash
# 1. Criar agent_version no Supabase
psql $DATABASE_URL -f create-dr-luiz-agent.sql

# 2. Importar workflows no n8n
# - Workflow 14 (Instagram Prospector)
# - Workflow 15 (Semantic Qualifier)

# 3. Configurar Instagram Business
# - Meta for Developers
# - Webhook apontando para n8n

# 4. Testar
# - Enviar DM de teste
# - Verificar resposta
# - Validar com rubrica

# 5. Go Live! 🚀
```

**Built with ❤️ by MOTTIVME**
