# Resumo da Sessão - 2026-01-20

## 1. Dr. Alberto Correia v5.1 (CRITICS)

**Arquivo:** `sql/dr_alberto_v5.1_CRITICS.sql`

**Score:** 92/100 no checklist CRITICS

**Location ID:** `GT77iGk2WDneoHwtuq6D`

**Calendar ID (Jean Pierre):** `Nwc3Wp6nSGMJTcXT2K3a`

### Correções aplicadas:
1. ❌ NUNCA se apresentar ("Alberto por aqui" = PROIBIDO)
2. ❌ NUNCA resetar conversa após lead responder
3. ❌ NUNCA perguntar o que já sabemos do perfil
4. ✅ SEMPRE usar contexto de `<hiperpersonalizacao>`
5. ✅ UMA mensagem por vez
6. ✅ Tom de colega médico (casual, direto)

### Estrutura CRITICS:
- Role: 10/10
- Constraints: 18/20
- Inputs: 15/15 (blocos XML documentados)
- Tools: 14/15
- Instructions: 18/20
- Conclusions: 9/10
- Solutions: 8/10

---

## 2. Marcos Ferreira v2.1 (Reativação)

**Arquivo:** `sql/marcos_ferreira_v2.1_reativacao.sql`

**Location ID:** `XNjmi1DpvqoF09y1mip9`

### Lógica de Reativação (PADRÃO para todos leads novos):

**PRIMEIRA MENSAGEM (sem histórico):**
```
"Oi [nome]!
Cara, aconteceu um problema aqui na plataforma e eu perdi o histórico da nossa conversa.
Tu consegue me relembrar sobre o que a gente tava falando? Quero te dar a melhor atenção possível."
```

**Após lead responder:**
- Se relembrou → "Ah sim! Valeu por me situar." → continua
- Se não lembra → "Ah, então deve ser a primeira vez! De boa. Me conta, qual ta sendo o maior desafio do teu negócio hoje?"

### Motivo:
Imprevisto no WhatsApp do Marcos Ferreira - perdeu histórico de conversas. Todos os leads (importados ou novos) recebem a mensagem de reativação.

---

## 3. Bug Fix: Isabella hardcoded em nodes n8n

**Arquivo corrigido:** `n8n_nodes/altere aqui.json`

### 5 correções aplicadas:
1. `variaveis.agente = prev.agent_name || 'Agente'` (era 'Isabella')
2. Resposta final usa `${variaveis.agente}` (era "Isabella")
3. `_meta.agent_name` dinâmico (era 'Isabella')
4. Histórico usa 'ASSISTENTE' (era 'ISABELLA')
5. Output `agent_name` dinâmico (era 'Isabella')

**Node corrigido:** `Montar Prompts Finais1` v6.6

---

## Arquivos criados/modificados nesta sessão:

| Arquivo | Ação |
|---------|------|
| `sql/dr_alberto_v5.1_CRITICS.sql` | Criado |
| `sql/marcos_ferreira_v2.1_reativacao.sql` | Criado |
| `n8n_nodes/altere aqui.json` | Corrigido (Isabella → dinâmico) |
| `n8n_nodes/node_montar_prompts_finais_v66_CORRIGIDO.json` | Referência |

---

## Próximos passos:

1. [ ] Rodar `dr_alberto_v5.1_CRITICS.sql` no Supabase
2. [ ] Rodar `marcos_ferreira_v2.1_reativacao.sql` no Supabase
3. [ ] Testar Dr. Alberto com lead simulado
4. [ ] Testar Marcos Ferreira com lead novo (verificar se mensagem de reativação aparece)
