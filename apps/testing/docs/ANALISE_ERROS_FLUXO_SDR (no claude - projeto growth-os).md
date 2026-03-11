# Análise de Erros - Fluxo SDR Julia Amare

## Problemas Identificados

---

### 1. ERRO: Tool Input Schema (API_KEY, lead_id, usuario_responsavel)

**Erro:**
```
Received tool input did not match expected schema
✖ Required → at API_KEY
✖ Required → at lead_id
✖ Required → at usuario_responsavel
```

**Causa:** As tools do agente (Busca_disponibilidade, Agendar_reuniao, etc) têm campos marcados como `required: false` no schema, mas a IA está chamando sem passar esses valores.

**Locais afetados:**
- Linha 481-485: Tool Busca_disponibilidade
- Linha 569-582: Tool Agendar_reuniao
- Linha 731-743: Tool Update Profissão
- Linha 801-816: Tool Update Estado

**Solução:**
Os campos `$fromAI()` estão vazios. Precisa adicionar instruções claras no prompt da ferramenta:

```json
// ANTES (errado)
"API_KEY": "={{ $fromAI('API_KEY', ``, 'string') }}"

// DEPOIS (correto) - Pegar do contexto
"API_KEY": "={{ $('Info').first().json.api_key }}"
"lead_id": "={{ $('Info').first().json.lead_id }}"
"usuario_responsavel": "={{ $('Info').first().json.usuario_responsavel || 'Sistema' }}"
```

---

### 2. ERRO: Missing Phone Number no WhatsApp

**Erro:**
```
422 - Missing phone number
```

**Causa:** O nó "Whatsapp" (linha 265) está usando `type: "SMS"` mas o lead veio do Instagram e não tem telefone.

**Código atual (linha 265):**
```json
{
  "type": "SMS",
  "contactId": "{{ $('Info').first().json.lead_id }}",
  "message": "{{ $json.output }}"
}
```

**Problema:**
- O nó Canal (linha 342) roteia baseado em `$('Info').first().json.source`
- MAS o source está vindo `instagram` e mesmo assim caindo no branch `Whatsapp`

**Verificação:** No screenshot, vejo:
- INPUT mostra "Instagram (1 item)" e "Whatsapp (1 item)"
- Parece que AMBOS estão recebendo o mesmo item
- O output mostra "Boa tarde" mas deveria verificar o horário

**Solução:**
1. O nó Canal precisa garantir que apenas UM branch recebe dados
2. Adicionar validação: se `telefone` é null, não enviar por SMS

---

### 3. ERRO: Roteamento Canal Incorreto (Instagram → WhatsApp)

**Causa:** A lógica do Switch "Canal" (linha 289-329) está comparando na ordem errada:

```json
"leftValue": "whatsapp",
"rightValue": "={{ $('Info').first().json.source }}"
```

Isso compara se a string literal "whatsapp" é igual ao source. Mas se o source vier com letras maiúsculas ou espaços, não vai bater.

**Solução:**
```json
// Usar lowercase e trim
"leftValue": "={{ $('Info').first().json.source?.toLowerCase()?.trim() }}",
"rightValue": "whatsapp"
```

---

### 4. ERRO: Saudação Incorreta (Boa Tarde vs Bom Dia)

**Causa:** A IA está dizendo "Boa tarde" às 10:41 da manhã.

**Problema:** O prompt não está instruindo a IA a verificar o horário atual para a saudação.

**Solução:** Adicionar no prompt do agente SDR1:

```
## SAUDAÇÃO POR HORÁRIO
- 00:00 às 11:59 → "Bom dia"
- 12:00 às 17:59 → "Boa tarde"
- 18:00 às 23:59 → "Boa noite"

Use a hora atual: {{ $now.format('HH') }} horas
```

Ou criar um campo calculado no nó "Info":
```javascript
// No nó Info, adicionar:
saudacao: (() => {
  const hora = new Date().getHours();
  if (hora < 12) return "Bom dia";
  if (hora < 18) return "Boa tarde";
  return "Boa noite";
})()
```

---

## Correções Necessárias

### Prioridade 1 - Crítico (Quebra o fluxo)

| # | Problema | Nó | Correção |
|---|----------|-----|----------|
| 1 | API_KEY vazio | Busca_disponibilidade | Pegar de `$('Info').first().json.api_key` |
| 2 | lead_id vazio | Agendar_reuniao | Pegar de `$('Info').first().json.lead_id` |
| 3 | Missing phone | Whatsapp | Validar se tem telefone antes de enviar |

### Prioridade 2 - Alto (Experiência ruim)

| # | Problema | Nó | Correção |
|---|----------|-----|----------|
| 4 | Canal errado | Canal (Switch) | Usar `.toLowerCase()` na comparação |
| 5 | Saudação errada | SDR1 (prompt) | Calcular saudação por horário |

### Prioridade 3 - Médio (Melhorias)

| # | Problema | Nó | Correção |
|---|----------|-----|----------|
| 6 | usuario_responsavel vazio | Tools | Default para "Sistema" ou nome do location |

---

## Arquivos para Correção

1. **SDR Julia Amare - Corrigido.json** - Fluxo n8n principal
2. **Prompt do agente SDR1** - Adicionar regra de saudação

---

## Correções Aplicadas (08/01/2026)

### Resumo das Modificações no Arquivo `SDR Julia Amare - Corrigido (1).json`

| # | Correção | Status |
|---|----------|--------|
| 1 | **Busca_disponibilidade**: API_KEY, lead_id, usuario_responsavel agora pegam do contexto `$('Info')` | ✅ Aplicado |
| 2 | **Agendar_reuniao**: API_KEY, email, telefone, location_id, firstName, lastName, lead_id, usuario_responsavel agora pegam do contexto | ✅ Aplicado |
| 3 | **Atualizar Profissão**: API_KEY, location_id, contact_id agora pegam do contexto | ✅ Aplicado |
| 4 | **Atualizar Estado**: API_KEY, estadoValue, contact_id, location_id agora pegam do contexto | ✅ Aplicado |
| 5 | **Nó WhatsApp**: Mudou de `"type": "SMS"` para `"type": "WhatsApp"` | ✅ Aplicado |
| 6 | **Nó Canal**: Comparação agora é case-insensitive com `.toLowerCase().trim()` | ✅ Aplicado |
| 7 | **Nó Info**: Adicionado campo `saudacao` calculado automaticamente por horário | ✅ Aplicado |
| 8 | **Nó Info**: Adicionado campo `hora_atual` para debug | ✅ Aplicado |

### Como Usar a Saudação no Prompt da IA

No prompt do agente SDR, adicione a instrução:

```
Use a saudação adequada ao horário: {{ $('Info').first().json.saudacao }}
Hora atual: {{ $('Info').first().json.hora_atual }}h

Sempre inicie a conversa com a saudação correta conforme o horário.
```

### Valores Disponíveis no Contexto

Agora as tools podem usar estes valores do `$('Info').first().json`:

- `api_key` - Chave da API GHL
- `lead_id` - ID do contato/lead
- `location_id` - ID da location
- `usuario_responsavel` - Nome do responsável (ou "Sistema" como fallback)
- `saudacao` - "Bom dia", "Boa tarde" ou "Boa noite" (calculado automaticamente)
- `hora_atual` - Hora atual (0-23)
- `email` - Email do lead
- `telefone` - Telefone do lead
- `first_name` - Primeiro nome
- `last_name` - Sobrenome

---

*Análise realizada em 08/01/2026*
*Correções aplicadas em 08/01/2026*
