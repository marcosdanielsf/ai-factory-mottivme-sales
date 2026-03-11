# Guia de Preenchimento - Agent Version

> Template para criar novos agentes na tabela `agent_versions`

---

## Placeholders para Substituir

| Placeholder | Descrição | Exemplo |
|-------------|-----------|---------|
| `{{LOCATION_ID}}` | ID da location no GHL | `GT77iGk2WDneoHwtuq6D` |
| `{{VERSION}}` | Versão do agente | `1.0`, `2.0`, `4.0` |
| `{{AGENT_NAME}}` | Nome do agente | `Dr. Alberto Correia - Mentoria` |
| `{{DEPLOYMENT_NOTES}}` | Notas de deploy | `v1.0 - Primeira versão...` |

---

## Campos JSON (Principais)

### 1. SYSTEM_PROMPT

O prompt base do agente. Usar estrutura CRITICS:

```
# NOME DO AGENTE vX.X

<Role>
Quem você é e seu propósito.
Personalidade em bullet points.
</Role>

<Background>
História, números, credenciais.
</Background>

<Constraints>
Regras de formatação.
Proibições.
</Constraints>

<Inputs>
Como recebe os dados (blocos XML).
</Inputs>

<Tools>
Ferramentas disponíveis e quando usar.
</Tools>

<Instructions>
Fluxo principal de vendas/atendimento.
</Instructions>

<Solutions>
Cenários comuns e como responder.
</Solutions>
```

---

### 2. TOOLS_CONFIG

Ferramentas que o agente pode usar:

```json
{
  "versao": "1.0",
  "location_id": "{{LOCATION_ID}}",
  "enabled_tools": {
    "gestao": [
      {
        "code": "Escalar_humano",
        "name": "Escalar para humano",
        "enabled": true,
        "parameters": ["motivo"],
        "description": "Direciona para gestor"
      }
    ],
    "cobranca": [
      {
        "code": "Criar_ou_buscar_cobranca",
        "name": "Gerar cobrança Asaas",
        "enabled": true,  // false se não usa
        "parameters": ["nome", "cpf", "cobranca_valor"],
        "description": "Gera link de pagamento"
      }
    ],
    "agendamento": [
      {
        "code": "Busca_disponibilidade",
        "name": "Buscar horários",
        "enabled": true,
        "parameters": ["calendar_id"],
        "description": "Consulta agenda"
      },
      {
        "code": "Agendar_reuniao",
        "name": "Criar agendamento",
        "enabled": true,
        "parameters": ["calendar_id", "datetime", "nome", "telefone", "email"],
        "description": "Agenda reunião/consulta"
      }
    ]
  },
  "regras_globais": {
    "nao_gerar_cobranca": false,  // true se não precisa cobrar
    "closer": "Nome do Closer",
    "calendar_id": "ID_DO_CALENDARIO"
  }
}
```

**Tipos de ferramentas disponíveis:**

| Categoria | Ferramentas |
|-----------|-------------|
| gestao | `Escalar_humano`, `Refletir`, `Adicionar_tag_perdido` |
| cobranca | `Criar_ou_buscar_cobranca` |
| conteudo | `Busca_historias`, `Enviar_video_menopausa`, `Enviar_video_consulta` |
| agendamento | `Busca_disponibilidade`, `Agendar_reuniao`, `Atualizar_agendamento` |
| confirmacao | `Enviar_comprovante_pagamento` |

---

### 3. COMPLIANCE_RULES

Regras e proibições:

```json
{
  "versao": "1.0",
  "proibicoes": [
    "Falar preço antes de gerar valor",
    "Parecer robótico",
    "Pressionar o lead",
    "Mensagens mais de 4 linhas",
    "Usar apelidos"
  ],
  "regras_criticas": {
    "closer": "Quem fecha a venda",
    "preco": "NUNCA falar preço no chat",
    "tom": "Descrição do tom"
  },
  "limites_mensagem": {
    "max_linhas": 4,
    "max_emoji": 1
  },
  "fluxo_obrigatorio": [
    "acolhimento",
    "discovery",
    "geracao_valor",
    "apresentacao_preco",
    "agendamento"
  ]
}
```

---

### 4. PERSONALITY_CONFIG

Personalidade e modos:

```json
{
  "modos": {
    "sdr_inbound": {
      "tom": "acolhedor, elegante",
      "nome": "Nome do Agente",
      "objetivo": "qualificar e agendar",
      "max_frases": 3
    },
    "social_seller_instagram": {
      "tom": "casual, autêntico",
      "nome": "Nome do Agente",
      "objetivo": "prospecção via DM",
      "max_frases": 2
    },
    "followuper": {
      "tom": "leve, sem pressão",
      "nome": "Nome do Agente",
      "objetivo": "reengajar inativos",
      "max_frases": 2,
      "cadencia": {
        "primeiro": "3 dias",
        "segundo": "5 dias",
        "terceiro": "7 dias"
      }
    },
    "objection_handler": {
      "tom": "empático, seguro",
      "nome": "Nome do Agente",
      "objetivo": "neutralizar objeção",
      "max_frases": 3
    }
  },
  "default_mode": "sdr_inbound",
  "expressoes_tipicas": [
    "Expressão 1",
    "Expressão 2"
  ]
}
```

**Modos disponíveis:**

| Modo | Quando usar |
|------|-------------|
| `sdr_inbound` | Lead de anúncio/formulário |
| `social_seller_instagram` | Prospecção Instagram |
| `followuper` | Reengajamento |
| `objection_handler` | Objeções |
| `scheduler` | Agendamento (após pagamento) |
| `concierge` | Pós-agendamento |

---

### 5. BUSINESS_CONFIG

Dados do negócio:

```json
{
  "nome_negocio": "Nome da Empresa/Clínica",
  "expert": "Nome do Expert/Médico",
  "metodo": "Nome do Método (se houver)",
  "produto": "Descrição do produto/serviço",
  "publico": "Público-alvo",
  "closer": "Quem fecha a venda",
  "calendar_id": "ID_DO_CALENDARIO",
  "valores": {
    "consulta": 1500,
    "parcelamento": "3x R$ 600"
  },
  "enderecos": {
    "unidade_1": {
      "nome": "São Paulo",
      "endereco": "Av. Exemplo, 123",
      "calendar_id": "CAL_ID_1"
    }
  },
  "diferenciais": [
    "Diferencial 1",
    "Diferencial 2"
  ],
  "horario": "Seg-Sex 9h-18h | Sab 8h-12h"
}
```

---

### 6. QUALIFICATION_CONFIG

Perfis de lead:

```json
{
  "perfis": {
    "hot_lead": {
      "sinais": ["pergunta preço", "pergunta horário", "urgência"],
      "score_minimo": 75
    },
    "warm_lead": {
      "sinais": ["interesse moderado", "pesquisando"],
      "score_minimo": 50
    },
    "cold_lead": {
      "sinais": ["apenas curiosidade"],
      "score_minimo": 25
    }
  },
  "qualificadores": {
    "need": {
      "peso": 30,
      "perguntas": ["Qual sua maior dificuldade?"]
    },
    "budget": {
      "peso": 25,
      "perguntas": ["Já investiu em tratamentos?"]
    },
    "authority": {
      "peso": 25,
      "perguntas": ["Você toma a decisão?"]
    },
    "timing": {
      "peso": 20,
      "perguntas": ["Quando quer começar?"]
    }
  }
}
```

---

### 7. HYPERPERSONALIZATION

Personalização por contexto:

```json
{
  "saudacoes_por_horario": {
    "manha": "Bom dia",
    "tarde": "Boa tarde",
    "noite": "Boa noite"
  },
  "personalizacao_por_ddd": {
    "11": {
      "contexto": "São Paulo capital",
      "unidade_proxima": "Unidade Moema"
    },
    "21": {
      "contexto": "Rio de Janeiro",
      "unidade_proxima": "Atendimento Online"
    }
  }
}
```

---

### 8. PROMPTS_BY_MODE

Prompts específicos por modo (JSON):

```json
{
  "sdr_inbound": "# MODO: SDR INBOUND\n\n## CONTEXTO\n...\n\n## OBJETIVO\n...\n\n## ACOLHIMENTO\n...\n\n## QUALIFICAÇÃO\n...",

  "social_seller_instagram": "# MODO: SOCIAL SELLER\n\n## CONTEXTO\n...",

  "followuper": "# MODO: FOLLOWUPER\n\n## CADÊNCIA\n...\n\n## TEMPLATES\n...",

  "objection_handler": "# MODO: OBJECTION HANDLER\n\n## OBJEÇÕES\n..."
}
```

**Estrutura de cada modo:**

```markdown
# MODO: NOME_DO_MODO

## CONTEXTO
Quando este modo é ativado.

## OBJETIVO
O que deve alcançar.

## FLUXO/TEMPLATES
Mensagens e fluxo específico.

## CALENDAR
ID do calendário: XXX
```

---

## Checklist de Criação

```
□ Location ID correto?
□ Calendar ID correto?
□ Nome do closer correto?
□ Ferramentas necessárias habilitadas?
□ Precisa gerar cobrança? (se não, desabilitar)
□ Prompts por modo criados?
□ Expressões típicas do expert incluídas?
□ Diferenciais do negócio listados?
□ Valores/preços configurados (se aplicável)?
□ Endereços das unidades (se aplicável)?
```

---

## Exemplo: Tipos de Agente

### Tipo A: Venda com Pagamento Antecipado (Dr. Luiz)
- Cobrança: ✅ Habilitada
- Fluxo: Discovery → Valor → Preço → Pagamento → Agendamento
- Closer: O próprio expert

### Tipo B: Venda com Closer Separado (Dr. Alberto)
- Cobrança: ❌ Desabilitada
- Fluxo: Discovery → Valor → Agendar Call com Closer
- Closer: Pessoa separada (Jean Pierre)

### Tipo C: Atendimento Paciente (Clínica)
- Cobrança: Depende
- Fluxo: Acolhimento → Triagem → Agendamento
- Closer: Recepção/Atendimento

---

## Comandos Úteis

```sql
-- Ver agentes de uma location
SELECT agent_name, version, is_active, status
FROM agent_versions
WHERE location_id = 'XXX'
ORDER BY created_at DESC;

-- Ver modos disponíveis
SELECT jsonb_object_keys(prompts_by_mode)
FROM agent_versions
WHERE location_id = 'XXX' AND is_active = true;

-- Desativar versão anterior
UPDATE agent_versions
SET is_active = false, status = 'deprecated'
WHERE location_id = 'XXX' AND version = 'X.X';
```
