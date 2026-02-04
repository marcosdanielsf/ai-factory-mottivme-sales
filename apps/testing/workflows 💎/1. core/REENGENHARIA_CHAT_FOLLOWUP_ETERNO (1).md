# 🔄 REENGENHARIA REVERSA DO CHAT
## Contexto Completo para Continuação em Nova Sessão

**Data:** 24 de Janeiro de 2026
**Projeto:** MOTTIVME - Sistema Follow Up Eterno
**Stack:** n8n + GHL + Supabase + WhatsApp/Instagram

---

# 📋 SUMÁRIO EXECUTIVO

Este chat focou em **3 entregas principais**:

1. **Implementação de Memes/GIFs** no Follow Up Eterno (Pattern Interrupts)
2. **Análise do documento "Fluxos Social Selling"** (4.044 linhas - Charlie Morgan + JP Middleton)
3. **Criação de Meta-Prompts** para IAs que constroem agentes de IA

---

# 🏗️ CONTEXTO ANTERIOR (Sessões Passadas)

## Sistema Follow Up Eterno - Status Atual

### Tabelas Supabase (5 tabelas validadas)
```sql
-- 1. Tracking de leads
n8n_schedule_tracking (unique_id, lead_id, follow_up_count, last_execution, status)

-- 2. Configuração de agentes
agent_config (id, follow_up_type, system_prompt, personality_config, business_context)

-- 3. Cadências de follow-up
follow_up_cadencias (id, canal, tentativa, delay_horas, tipo_mensagem)

-- 4. Histórico de conversas
conversation_history (id, contact_id, messages, created_at)

-- 5. NOVA - Banco de memes
memes_followup (id, nome, url, tipo, legenda_sugerida, canal, tentativa_recomendada, ativo)
```

### Dados Atuais
- **2.220 leads ativos** no tracking
- **17 GIFs** validados no banco de memes (Giphy)
- **API GHL aceita attachments** externos (VALIDADO)

### Cadência Instagram 24h (Criada)
| Tentativa | Delay | Tipo |
|-----------|-------|------|
| 1 | 0h | sdr_primeiro_contato |
| 2 | 4h | sdr_followup |
| 3 | 12h | **pattern_interrupt** (MEME) |
| 4 | 22h | sdr_urgencia |

---

# 🎯 SESSÃO ATUAL - O QUE FOI FEITO

## 1. Workflow V3.1 com Memes

### Novo Nó Adicionado
**"Buscar Meme Instagram"** (Postgres node)
```sql
SELECT id, nome, url, tipo, legenda_sugerida, categoria
FROM memes_followup
WHERE ativo = true
  AND (canal = 'all' OR canal = 'instagram')
  AND tentativa_recomendada <= {{ $('Sem Resposta').item.json.tentativa || 3 }}
ORDER BY RANDOM()
LIMIT 1;
```

### Nó Instagram Modificado
```javascript
const meme = $('Buscar Meme Instagram').first()?.json;
const tentativa = $('Sem Resposta').item?.json?.tentativa || 1;
const usarMeme = tentativa >= 3 && meme?.url;

const payload = {
  "type": "IG",
  "contactId": $('Informacoes Relevantes - FUP').first().json['Lead Id'],
  "message": $json.output
};

if (usarMeme) {
  payload.attachments = [meme.url];
}

return JSON.stringify(payload);
```

### Fluxo Atualizado
```
Canal (Switch)
├── WhatsApp → Whatsapp (HTTP) → Aguardar 1.5s
└── Instagram → Buscar Meme Instagram (Postgres) → Instagram (HTTP + attachments) → Aguardar 1.5s
```

### Arquivos Gerados
- `/mnt/user-data/outputs/follow_up_eterno_v31_com_memes.json` - Workflow completo
- `/mnt/user-data/outputs/memes_followup.sql` - SQL corrigido

---

## 2. Análise do Documento Social Selling

### Estrutura Identificada (4.044 linhas)
- **Guia 1 (linhas 1-2304):** Fluxos GS, VS, Follow-up
- **Guia 2 (linhas 2305-4044):** Charlie Morgan + JP Middleton

### 5 Fluxos Principais Documentados

| Fluxo | Objetivo | Cadência |
|-------|----------|----------|
| **GS (Gatilho Social)** | Stories → Conversas | Imediato |
| **VS (Validação Social)** | FOMO → Agendamento | Variável |
| **Follow-up Eterno** | Ghosting → Resposta | 15min, 2h, 8h, 22h |
| **Keeper (27h Rule)** | Blindar Show Rate | T+0, T-27h, T-1h |
| **Reactivation (Aristotle)** | Base antiga → Agendamento | 9 palavras |

### Princípios Charlie Morgan Extraídos
1. **Vagueza** - Nunca explique o mecanismo, venda o resultado
2. **Escassez** - Agenda disputada, lead precisa "merecer"
3. **Brevidade** - Máximo 2 frases, parecer no celular
4. **Opção Binária** - "Terça ou Quinta?", nunca pergunta aberta
5. **Desqualificação Reversa** - Retirar oferta se hesitar

### Métricas Benchmark
| Métrica | Meta |
|---------|------|
| Speed to Lead | < 1 min |
| Booking Rate | 15-20% |
| Show Rate | > 70% |
| Close Rate | > 20% |

### Arquivo Gerado
- `/mnt/user-data/outputs/analise_social_selling_completa.md`

---

## 3. Meta-Prompts para Criação de Agentes

### Taxonomia de 6 Tipos de Agentes

| Tipo | Uso | Tom |
|------|-----|-----|
| **SDR_INBOUND** | Lead chegou até você | Screener seletivo |
| **SDR_OUTBOUND** | Prospecção fria | Curioso, pede permissão |
| **KEEPER** | Pós-agendamento | Cuidadoso, escassez |
| **REACTIVATION** | Base antiga (>30 dias) | Casual, familiar |
| **FOLLOW_UP_ETERNO** | Ghosting | Criativo, memes |
| **CLOSER_SUPPORT** | Suporte ao fechamento | Expert, autoridade |

### Template de Criação (Estrutura)
```markdown
# AGENTE: [NOME]
## Tipo: [TIPO]

## 1. IDENTIDADE
- Nome, Papel, Personalidade, Anti-Persona

## 2. CONTEXTO DO NEGÓCIO
- Empresa, Produto, Público, Proposta de Valor

## 3. OBJETIVO
- Meta Primária, Secundária, KPIs

## 4. REGRAS DE CONVERSA
- Princípios Charlie Morgan
- Fluxo de Conversa
- Gatilhos de Escalação
- Respostas para Objeções

## 5. TOOLS DISPONÍVEIS
- Lista de tools e regras de uso

## 6. FEW-SHOT EXAMPLES
- 4+ exemplos de conversa

## 7. GUARDRAILS
- Compliance, Limites, Palavras Proibidas

## 8. INTEGRAÇÃO TÉCNICA
- Variáveis, Formato de Saída, Triggers
```

### Arquivos Gerados
- `/mnt/user-data/outputs/meta_prompt_criacao_agentes_ia.md`
- `/mnt/user-data/outputs/prompts_por_tipo_workflow.md`

---

# ⚠️ PROBLEMA IDENTIFICADO (NÃO RESOLVIDO)

## Hardcoded `follow_up_type = 'sdr_inbound'`

**Localização:** Nó "Buscar Config Agente" no workflow
```sql
WHERE follow_up_type = 'sdr_inbound'  -- HARDCODED!
```

**Problema:** Todos os follow-ups usam a mesma config, sem diferenciar:
- Instagram vs WhatsApp
- Inbound vs Outbound
- SDR vs Keeper vs Reactivation

**Opções Propostas:**
- A) Por Canal: `CASE WHEN source = 'instagram' THEN 'sdr_instagram' ...`
- B) Campo no tracking: Adicionar `follow_up_type` em `n8n_schedule_tracking`
- C) Por estágio: `CASE WHEN pipeline_stage = 'agendado' THEN 'keeper' ...`

**Status:** Aguardando decisão do Marcos

---

# 📁 ARQUIVOS DO PROJETO

## Uploads (Inputs)
- `__GHL___Follow_Up_Eterno_-_CORRIGIDO_V3__2_.json` - Workflow original
- `Co_pia_de_Fluxos_Social_Selling__2_.txt` - Documento analisado (4.044 linhas)

## Outputs Gerados
| Arquivo | Descrição |
|---------|-----------|
| `follow_up_eterno_v31_com_memes.json` | Workflow V3.1 com memes |
| `memes_followup.sql` | SQL para banco de memes |
| `instagram_cadencias.sql` | Cadências 24h |
| `analise_social_selling_completa.md` | Análise do documento |
| `meta_prompt_criacao_agentes_ia.md` | Meta-prompt para IAs |
| `prompts_por_tipo_workflow.md` | Prompts por tipo de workflow |

---

# ✅ PRÓXIMOS PASSOS PENDENTES

## Imediatos (Técnicos)
1. [ ] Rodar `memes_followup.sql` no Supabase
2. [ ] Importar workflow V3.1 no n8n
3. [ ] Testar envio de meme na tentativa 3
4. [ ] Validar GIF aparece no Instagram do lead

## Estratégicos (Decisões)
5. [ ] Decidir estratégia de `follow_up_type` (A, B ou C)
6. [ ] Implementar lógica dinâmica de tipo
7. [ ] Criar configs separadas por tipo de agente

## Expansão (Novos Workflows)
8. [ ] Implementar KEEPER (regra 27h)
9. [ ] Implementar REACTIVATION (Aristotle)
10. [ ] Criar sistema de Quality Assurance para prompts

---

# 🔧 CONFIGURAÇÕES TÉCNICAS

## Credenciais Ativas
- **Postgres:** "Postgres Marcos Daniels" (Supabase)
- **GHL API:** Token PIT (per-installation-token)
- **n8n:** cliente-a1.mentorfy.io (versão 1.119.1+)

## Variáveis de Ambiente
```
GHL_API_BASE=https://services.leadconnectorhq.com
SUPABASE_URL=postgresql://...
N8N_INSTANCE=cliente-a1.mentorfy.io
```

## Memes Validados (Giphy)
```
- Esqueleto Esperando: https://media.giphy.com/media/QBd2kLB5qDmysEXre9/giphy.gif
- Pablo Escobar: https://media.giphy.com/media/ISOckXUybVfQ4/giphy.gif
- Travolta Confuso: https://media.giphy.com/media/hEc4k5pN17GZq/giphy.gif
- This is Fine: https://media.giphy.com/media/QMHoU66sBXqqLqYvGO/giphy.gif
- Baby Yoda: https://media.giphy.com/media/Wn74RUT0vjnoU98Hnt/giphy.gif
```

---

# 📝 PROMPT PARA CONTINUAR

Cole isso no próximo chat:

```
Continuando sessão anterior sobre MOTTIVME - Follow Up Eterno.

## Contexto Rápido:
- Sistema de follow-up automatizado com n8n + GHL + Supabase
- Implementamos memes/GIFs para Pattern Interrupt na tentativa 3+
- Analisamos documento "Fluxos Social Selling" (Charlie Morgan + JP Middleton)
- Criamos meta-prompts para IAs construírem agentes

## Arquivos Relevantes (no projeto):
- follow_up_eterno_v31_com_memes.json (workflow)
- memes_followup.sql (banco de memes)
- analise_social_selling_completa.md (análise do documento)
- meta_prompt_criacao_agentes_ia.md (template para IAs)
- prompts_por_tipo_workflow.md (prompts por tipo)

## Pendente:
1. Resolver hardcoded `follow_up_type = 'sdr_inbound'`
2. Rodar SQLs no Supabase
3. Testar workflow com memes
4. Implementar KEEPER (regra 27h)
5. Implementar REACTIVATION (Aristotle)

## Metodologias Base:
- Charlie Morgan: Vagueza, Escassez, Opção Binária, Desqualificação Reversa
- JP Middleton: Sistema Aristóteles, Database Reactivation
- Eric Worre: Go Pro, Relacionamento primeiro

O que você precisa que eu faça agora?
```

---

*Documento gerado em 24/01/2026*
*Projeto: MOTTIVME - Follow Up Eterno*
