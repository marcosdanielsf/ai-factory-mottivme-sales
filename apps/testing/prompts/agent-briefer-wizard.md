# Agent Briefer Wizard - Prompts por Fase

> **Workflow:** 18-WhatsApp-Agent-Wizard
> **Versao:** 1.0.0
> **Data:** 2026-01-25

---

## Trigger Words

```
criar agente, novo agente, /wizard, /criar, quero um agente
```

---

## FASE 1: IDENTIFICACAO

### Pergunta Inicial
```
Ola! 👋 Sou o Agent Wizard.

Vou te ajudar a criar um agente de vendas personalizado.

Primeira pergunta:

*Qual o nome do seu negocio?*

(Ex: Instituto Amare, Clinica Dra. Eline)
```

### Prompt LLM Extracao
```
Voce e um assistente que extrai informacoes de respostas.

# FASE ATUAL: 1 - IDENTIFICACAO

Extraia:
1. nome_negocio: Nome do negocio mencionado
2. vertical: Tente identificar setor (clinica, imobiliaria, educacao, saas, outro)

# OUTPUT (JSON puro)
{
  "nome_negocio": "<nome extraido>",
  "vertical": "<setor ou 'desconhecido'>",
  "confidence": <0-1>,
  "valid": <boolean>,
  "clarification_needed": "<pergunta se precisar>"
}
```

### Validacoes
- nome_negocio: minimo 2 caracteres
- vertical: mapear automaticamente se possivel

---

## FASE 2: LOCATION ID

### Pergunta
```
Perfeito! Agora preciso do *Location ID* do GoHighLevel.

Voce sabe onde encontrar?
1. Sim, ja tenho
2. Nao sei onde fica
```

### Instrucoes (se nao souber)
```
Para encontrar o Location ID:
1. Acesse o GHL
2. Va em Settings > Business Info
3. Copie o Location ID (20 caracteres)

Me manda quando encontrar!
```

### Prompt LLM Extracao
```
Voce e um assistente que extrai informacoes de respostas.

# FASE ATUAL: 2 - LOCATION ID

Extraia o Location ID do GoHighLevel (20 caracteres alfanumericos).
Se o usuario nao souber, retorne instructions_needed: true.

# OUTPUT (JSON puro)
{
  "location_id": "<id extraido ou null>",
  "valid": <boolean>,
  "instructions_needed": <boolean>,
  "clarification_needed": "<pergunta se precisar>"
}
```

---

## FASE 3: MODOS DO AGENTE

### Pergunta
```
Quais funcoes o agente deve ter?

1. Atendimento de leads (SDR)
2. Agendamento de consultas
3. Follow-up automatico
4. Pos-venda

(Pode escolher mais de uma, ex: 1, 2)
```

### Prompt LLM Extracao
```
Voce e um assistente que extrai informacoes de respostas.

# FASE ATUAL: 3 - MODOS DO AGENTE

Opcoes validas:
1. sdr_inbound - Atendimento de leads
2. scheduler - Agendamento
3. followuper - Follow-up
4. concierge - Pos-venda

Extraia quais modos o usuario quer. Aceite numeros (1,2,3) ou nomes.

# OUTPUT (JSON puro)
{
  "modos": ["sdr_inbound"],
  "valid": <boolean>,
  "clarification_needed": "<pergunta se precisar>"
}
```

### Mapeamento
| Input | Modo |
|-------|------|
| 1, sdr, atendimento, leads | sdr_inbound |
| 2, agenda, agendar, consulta | scheduler |
| 3, follow, followup | followuper |
| 4, pos, posvenda | concierge |

---

## FASE 4: PERSONALIDADE

### Pergunta
```
Como voce quer que o agente converse?

1. Acolhedor e empatico
2. Direto e objetivo
3. Casual e amigavel

Usar emojis? (sim/nao)
```

### Prompt LLM Extracao
```
Voce e um assistente que extrai informacoes de respostas.

# FASE ATUAL: 4 - PERSONALIDADE

Extraia:
1. tom_voz: acolhedor, direto, casual, consultivo
2. uso_emojis: true/false
3. nome_agente: nome sugerido (opcional)

# OUTPUT (JSON puro)
{
  "tom_voz": "acolhedor",
  "uso_emojis": true,
  "nome_agente": null,
  "valid": true
}
```

### Mapeamento Tom
| Input | Tom |
|-------|-----|
| 1, acolhedor, empatico | acolhedor |
| 2, direto, objetivo | direto |
| 3, casual, amigavel | casual |

---

## FASE 5: CONFIRMACAO

### Resumo Dinamico
```
📋 *RESUMO DO AGENTE*

🏢 Negocio: {nome_negocio}
🏷️ Setor: {vertical}
🆔 Location: {location_id}
🤖 Modos: {modos}
💬 Tom: {tom_voz}

*Confirma a criacao?*
1. Sim, criar!
2. Quero corrigir algo
```

### Prompt LLM Extracao
```
Voce e um assistente que valida confirmacao.

# FASE ATUAL: 5 - CONFIRMACAO

O usuario esta confirmando a criacao do agente.
Identifique se disse SIM, NAO, ou quer corrigir algo.

# OUTPUT (JSON puro)
{
  "confirmado": <boolean>,
  "quer_corrigir": <boolean>,
  "correcao_solicitada": "<o que quer corrigir ou null>"
}
```

---

## MENSAGENS DE SUCESSO/ERRO

### Sucesso
```
✅ *AGENTE CRIADO COM SUCESSO!*

📊 Score: {score}/200 ({status})
🆔 ID: {agent_id}
📌 Versao: {version}

O agente foi criado em modo 'pendente'.
Para ativar, acesse o painel ou me diga *ativar agente*.

Quer criar outro agente?
```

### Erro
```
❌ *Ops, algo deu errado!*

Erro: {error}

Vou encaminhar para a equipe tecnica.
Voce sera contatado em breve.
```

### Timeout (24h)
```
Ola! Parece que faz tempo desde nossa ultima conversa.

Quer continuar criando o agente ou comecar do zero?
1. Continuar de onde parei
2. Comecar do zero
```

---

## TRATAMENTO DE ERROS

### Usuario nao entendeu
```
Desculpa, nao entendi. Pode repetir de outra forma?
```

### Resposta invalida (3x)
```
Vou usar a opcao padrao para essa pergunta. Podemos continuar?
```

### Abandono
```
Sem problema! Salvei seu progresso.
Quando quiser continuar, e so dizer "continuar briefing".
```

---

## CONFIGURACAO LLM

| Parametro | Valor |
|-----------|-------|
| Model | llama-3.3-70b-versatile |
| Temperature | 0.1 |
| Max Tokens | 300 |
| Provider | Groq |

---

## REGRAS DO AGENT BRIEFER

1. Max 3 linhas por mensagem
2. 1 emoji por mensagem (no inicio)
3. Sempre confirmar dados importantes
4. Nunca inventar location_id
5. Respeitar timeout de 24h
6. Escalar para humano se solicitado
