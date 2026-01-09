# Engenharia de Prompts Modulares

> Guia completo para criar agentes SDR com prompts modulares baseado na engenharia reversa da Isabella Amare v6.6.1

## Visão Geral

O sistema de **Prompts Modulares** separa o prompt em duas partes:

| Componente | Descrição | Quando Usar |
|------------|-----------|-------------|
| `system_prompt` | Prompt base compartilhado | Sempre carregado |
| `prompts_by_mode` | JSON com prompts específicos por modo | Carregado conforme contexto |

### Vantagens

- ✅ **Manutenção facilitada** - Altera um modo sem afetar outros
- ✅ **Reutilização** - Prompt base serve para todos os modos
- ✅ **Contexto otimizado** - Só carrega o modo necessário
- ✅ **Versionamento** - Controle granular de mudanças

---

## Estrutura do System Prompt (Base)

O `system_prompt` deve conter **tudo que é compartilhado** entre os modos:

```markdown
# [NOME DO AGENTE] v[VERSÃO]

## PAPEL
Você é **[Nome]**, assistente da [Empresa] ([Profissional]).
Especialista em [Área de Atuação].

## CONTEXTO DO NEGÓCIO
| Campo | Valor |
|-------|-------|
| Nome | [Nome da Empresa] |
| Segmento | [Descrição do segmento] |

### SERVIÇOS
- [Serviço 1 com descrição]
- [Serviço 2 com descrição]
- [Serviço 3 com descrição]

### LOCALIZAÇÃO
| Unidade | Calendar ID |
|---------|-------------|
| [Cidade 1] | [ID do calendário GHL] |
| [Cidade 2] | [ID do calendário GHL] |
| Online | [ID do calendário GHL] |

**Horário:** [Dias e horários de funcionamento]

### VALORES
| Tipo | Valor |
|------|-------|
| Valor cheio (ÂNCORA) | R$ X.XXX |
| À vista (PIX) | R$ X.XXX |
| Parcelado | Nx R$ XXX |

## PERSONALIDADE GLOBAL
- **Nome:** [NOME] (nunca [outros nomes])
- **Tom:** [Descrição do tom]
- **Abreviações:** [lista de abreviações permitidas]
- **MÁXIMO X linhas** por mensagem
- **MÁXIMO X emoji** por mensagem ([emoji preferencial])

## REGRAS DE GÊNERO
| Gênero | Expressões | Limite |
|--------|------------|--------|
| Feminino | "[expressão]", "[expressão]" | máx Xx cada |
| Masculino | "[expressão]", "[expressão]" | máx Xx cada |

## PROIBIÇÕES UNIVERSAIS
1. ❌ [Proibição 1]
2. ❌ [Proibição 2]
3. ❌ [Proibição 3]
...

## FERRAMENTA DE PAGAMENTO
[Instruções da ferramenta de cobrança]

## REGRA ANTI-LOOP DE FERRAMENTAS
[Regras para evitar loops - CRÍTICO!]
```

---

## Os 7 Modos Padrão

O `prompts_by_mode` é um JSON com os modos disponíveis:

### 1. `sdr_inbound` - Tráfego Pago

**Quando usar:** Lead veio de anúncio/formulário

**Fluxo obrigatório:**
1. Acolhimento (validar sintoma do form)
2. Discovery (2-3 trocas)
3. Geração de Valor
4. Apresentação de Preço (com ancoragem!)
5. Objeções (método A.R.O)
6. Pagamento (ferramenta de cobrança)
7. Agendamento (só após pagamento)

### 2. `social_seller_instagram` - Prospecção Instagram

**Quando usar:** Lead veio do Instagram DM (sem formulário)

**Características:**
- Tom casual e autêntico
- Mensagens CURTAS (máx 2 linhas)
- Parecer DM de amiga
- NUNCA começar vendendo

**Fluxo:**
1. Abertura (gancho personalizado)
2. Conexão Pessoal
3. Descoberta da Dor
4. Educação Sutil
5. Revelação Natural (só então menciona o Instituto)
6. Qualificação + Valor + Preço
7. Pagamento

### 3. `concierge` - Pós-Agendamento

**Quando usar:** Lead já agendou e pagou

**Objetivo:**
- Confirmar presença
- Resolver dúvidas pré-consulta
- Garantir comparecimento

**Templates:**
- Confirmação (logo após agendar)
- Lembrete 24h antes
- Respostas para dúvidas frequentes

### 4. `scheduler` - Agendamento

**Quando usar:** Após pagamento confirmado

**Fluxo:**
1. Perguntar unidade preferida
2. Buscar disponibilidade (usar Calendar ID)
3. Apresentar 3 opções
4. Confirmar escolha

**Regra:** Mínimo 15-20 dias de antecedência (tempo para exames)

### 5. `followuper` - Reengajamento

**Quando usar:** Lead inativo há dias/semanas

**Cadência:**
- 1º follow-up: 3 dias após último contato
- 2º follow-up: 5 dias depois
- 3º follow-up: 7 dias depois
- Depois: pausa de 30 dias

**Tom:** Leve e sem pressão

### 6. `objection_handler` - Tratamento de Objeções

**Método A.R.O:**
- **A**colher: Validar o sentimento
- **R**efinar: Dar contexto/argumentos
- **O**ferecer: Propor solução

**Objeções comuns:**
- "Está caro"
- "Aceita plano?"
- "Já tentei de tudo"
- "Vou pensar"

### 7. `reativador_base` - Reativação de Base

**Quando usar:** Lead/cliente inativo há MESES ou mais de 1 ANO

**Tom:** Caloroso e nostálgico

**Tipos:**
- Lead que nunca fechou
- Ex-paciente
- Lead que sumiu após preço

---

## Regras de Negócio Críticas

### Ancoragem de Preço

::: danger REGRA CRÍTICA
**NUNCA** fale o preço promocional sem mencionar o valor cheio ANTES!
:::

```
❌ ERRADO: "O valor é R$ 971 à vista"

✅ CORRETO: "O valor completo seria R$ 1.200, MAS para novos
pacientes está R$ 971 à vista ou 3x de R$ 400"
```

### Fluxo de Vendas Consultivo

```
ACOLHIMENTO → DISCOVERY → VALOR → PREÇO → PAGAMENTO → AGENDAMENTO
     ↓            ↓          ↓        ↓          ↓           ↓
  1 msg      2-3 trocas   1-2 msg   1 msg    Ferramenta   Calendário
```

::: warning IMPORTANTE
**NUNCA** pule etapas! Especialmente:
- Não fale preço antes de gerar valor
- Não agende antes do pagamento
:::

### Regra Anti-Loop de Ferramentas

| Ferramenta | Máximo por Conversa |
|------------|---------------------|
| Criar ou buscar cobranca | **1 vez** |
| Busca_disponibilidade | **2 vezes** |
| Agendar_reuniao | **1 vez** |
| Outras ferramentas | **3 vezes** |

**Se a ferramenta retornar erro:**
1. NÃO tente novamente
2. Responda: "Tive um probleminha técnico, vou verificar com a equipe!"
3. Escale para humano

---

## Checklist de Criação de Novo Agente

### Fase 1: Coleta de Informações

- [ ] Nome do agente e empresa
- [ ] Segmento de atuação
- [ ] Lista de serviços oferecidos
- [ ] Unidades e Calendar IDs do GHL
- [ ] Horário de funcionamento
- [ ] Tabela de preços (cheio, à vista, parcelado)
- [ ] Tom de voz desejado
- [ ] Proibições específicas do nicho

### Fase 2: Estruturação do Prompt Base

- [ ] Seção PAPEL definida
- [ ] CONTEXTO DO NEGÓCIO completo
- [ ] PERSONALIDADE GLOBAL configurada
- [ ] PROIBIÇÕES UNIVERSAIS listadas
- [ ] Instruções de FERRAMENTA DE PAGAMENTO
- [ ] REGRAS ANTI-LOOP incluídas

### Fase 3: Criação dos Modos

- [ ] `sdr_inbound` - Tráfego pago
- [ ] `social_seller_instagram` - Instagram DM
- [ ] `concierge` - Pós-agendamento
- [ ] `scheduler` - Agendamento
- [ ] `followuper` - Reengajamento
- [ ] `objection_handler` - Objeções
- [ ] `reativador_base` - Reativação

### Fase 4: Configurações Adicionais

- [ ] `compliance_rules` com limites de ferramentas
- [ ] `personality_config` com tom e emoji
- [ ] `business_config` com dados da empresa
- [ ] `deployment_notes` com changelog

### Fase 5: Validação

- [ ] Testar fluxo SDR Inbound completo
- [ ] Testar Social Selling no Instagram
- [ ] Verificar ancoragem de preço
- [ ] Validar anti-loop de ferramentas
- [ ] Teste E2E com lead simulada

---

## Exemplo Completo: Isabella Amare v6.6.1

### Dados do Cliente

| Campo | Valor |
|-------|-------|
| Agente | Isabella |
| Empresa | Instituto Amare |
| Profissional | Dr. Luiz Augusto |
| Segmento | Saúde Hormonal (feminina e masculina) |
| Unidades | São Paulo, Presidente Prudente, Online |

### System Prompt (Resumo)

```markdown
# ISABELLA AMARE v6.6.1

## PAPEL
Você é **Isabella**, assistente do Instituto Amare (Dr. Luiz Augusto).
Especialista em Saúde Hormonal Feminina e Masculina.

## VALORES
| Tipo | Valor |
|------|-------|
| Valor cheio (ÂNCORA) | R$ 1.200 |
| À vista (PIX) | R$ 971 |
| Parcelado | 3x R$ 400 |

## PERSONALIDADE
- Tom: Elegante mas humana e próxima
- Abreviações: vc, tb, pra, tá, né
- MÁXIMO 4 linhas por mensagem
- MÁXIMO 1 emoji (💜 preferencial)

## PROIBIÇÕES
1. ❌ Dar diagnóstico fechado
2. ❌ Prescrever tratamentos
3. ❌ Revelar valores de tratamentos
4. ❌ Agendar antes de pagamento confirmado
5. ❌ Pular fase de Discovery
6. ❌ Falar preço antes de gerar valor
7. ❌ Chamar ferramenta de cobrança mais de 1x
```

### SQL de Referência

O SQL completo está em:
```
/sql/isabella_v661_INSERT_ATIVAR.sql
```

---

## Template SQL para Novo Agente

```sql
-- ═══════════════════════════════════════════════════════════════
-- [NOME DO AGENTE] v1.0 - INSERT + ATIVAR
-- ═══════════════════════════════════════════════════════════════

-- PASSO 1: DESATIVAR VERSÕES ANTERIORES
UPDATE agent_versions
SET is_active = false, updated_at = NOW()
WHERE agent_name = '[Nome do Agente]'
  AND location_id = '[LOCATION_ID]'
  AND is_active = true;

-- PASSO 2: INSERIR NOVA VERSÃO
INSERT INTO agent_versions (
  agent_name,
  version,
  location_id,
  is_active,
  status,
  system_prompt,
  prompts_by_mode,
  tools_config,
  compliance_rules,
  personality_config,
  business_config,
  deployment_notes,
  created_at,
  updated_at
) VALUES (
  '[Nome do Agente]',
  '1.0',
  '[LOCATION_ID]',
  true,
  'active',
  $PROMPT_BASE$
  [SYSTEM PROMPT AQUI]
  $PROMPT_BASE$,
  $PROMPTS_JSON$
  {
    "sdr_inbound": "[PROMPT DO MODO]",
    "social_seller_instagram": "[PROMPT DO MODO]",
    "concierge": "[PROMPT DO MODO]",
    "scheduler": "[PROMPT DO MODO]",
    "followuper": "[PROMPT DO MODO]",
    "objection_handler": "[PROMPT DO MODO]",
    "reativador_base": "[PROMPT DO MODO]"
  }
  $PROMPTS_JSON$,
  '{}',
  '{"max_tool_calls": {"cobranca": 1, "disponibilidade": 2}}',
  '{"nome": "[Nome]", "tom": "[Tom]", "emoji": "[Emoji]"}',
  '{"empresa": "[Empresa]", "segmento": "[Segmento]"}',
  'v1.0 - Versão inicial',
  NOW(),
  NOW()
);

-- VERIFICAÇÃO
SELECT agent_name, version, is_active, created_at
FROM agent_versions
WHERE agent_name = '[Nome do Agente]'
ORDER BY created_at DESC LIMIT 3;
```

---

## Dicas e Boas Práticas

### 1. Mantenha o Tom Consistente

O tom deve ser o mesmo em todos os modos. Se o agente é "elegante mas próximo", isso vale para SDR, Concierge e Follow-up.

### 2. Escape Corretamente no JSON

No `prompts_by_mode`, use `\n` para quebras de linha e `\"` para aspas:

```json
{
  "modo": "Linha 1\nLinha 2\n\"Texto entre aspas\""
}
```

### 3. Teste os Limites de Ferramentas

Sempre teste se as regras anti-loop estão funcionando. Um loop pode gerar **custos altíssimos**.

### 4. Documente Mudanças

Use `deployment_notes` para registrar o que mudou em cada versão:

```
v1.0 - Versão inicial
v1.1 - Ajuste no tom do follow-up
v1.2 - Adicionada regra anti-loop
```

### 5. Crie Lead Simulada para Testes

Para cada cliente, crie uma "lead simulada" no Supabase para testes E2E. Veja exemplo em:
```
/sql/lead_simulado_social_selling_instituto_amare.sql
```

---

## Arquivos de Referência

| Arquivo | Descrição |
|---------|-----------|
| `sql/isabella_v661_INSERT_ATIVAR.sql` | SQL completo Isabella v6.6.1 |
| `sql/isabella_v66_prompts_modulares.sql` | SQL de UPDATE (alternativo) |
| `sql/lead_simulado_social_selling_instituto_amare.sql` | Lead simulada para testes |
| `sql/dr_alberto_v1_INSERT_COMPLETO.sql` | Outro exemplo de agente |

---

## Changelog

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-01-09 | Documento inicial baseado na engenharia reversa Isabella v6.6.1 |
