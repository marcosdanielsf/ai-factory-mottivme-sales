# Prompt Studio — Engenharia Reversa & Troubleshooting

> Referencia tecnica dos ajustes feitos em 2026-02-19.
> Branch: `fix/prompt-studio-code-review` (merged main)
> Commits: `6ef4981` → `62cf44f` → `948b61e` → `d9b3857`

---

## Mapa de Arquivos

| Arquivo | O que faz | Peso |
|---------|-----------|------|
| `src/pages/PromptEditor/index.tsx` | Pagina principal — editor, toggles, save, create version | **CORE** |
| `src/pages/PromptEditor/components/VersionDetails.tsx` | Painel direito — metadata, toggle is_active/status | medio |
| `src/pages/PromptEditor/components/EditorHeader.tsx` | Header — tabs de zonas, seletor agente, versao | medio |
| `src/pages/PromptEditor/components/VersionSidebar.tsx` | Sidebar esquerda — lista de versoes | leve |
| `src/hooks/useAgents.ts` | Lista de agentes no dropdown | leve |
| `src/hooks/useAgentVersions.ts` | Versoes de um agente selecionado | medio |
| `src/components/PromptEngineerChat.tsx` | Chat "Engenheiro de Prompts" (ajustes via linguagem natural) | medio |
| `src/types.ts` | Tipos TypeScript (Agent, AgentVersion) | leve |

---

## 1. Toggle is_active / validation_status

### Como funciona

Existem **3 formas** de mudar o estado de um agente:

| Elemento | Onde | O que faz |
|----------|------|-----------|
| Botao Power (toggle) | `VersionDetails.tsx` | Muda **AMBOS** is_active + validation_status de uma vez |
| Caixa `is_active` | `VersionDetails.tsx` | Muda **SO** is_active (true↔false) |
| Caixa `status` | `VersionDetails.tsx` | Muda **SO** validation_status (active↔draft) |

### Codigo relevante

**`index.tsx` — `handleToggleActive` (~linha 160)**
```
Muda ambos: is_active + validation_status
Se ativando → desativa TODAS outras versoes do mesmo client_id
Payload: { is_active, validation_status }  (SEM updated_at!)
```

**`index.tsx` — `handleToggleField` (~linha 202)**
```
Recebe field: 'is_active' | 'validation_status'
Se field === 'is_active' e ativando → desativa outras versoes
Se field === 'validation_status' → alterna active↔draft
```

**`VersionDetails.tsx` — props**
```tsx
onToggleActive: () => void;          // botao Power
onToggleField: (field) => void;      // caixas individuais
```

### Troubleshooting

| Sintoma | Causa provavel | Fix |
|---------|---------------|-----|
| Toggle clica mas nao muda nada | `updated_at` no payload (coluna inexistente) | Remover `updated_at` do `.update()` |
| Caixas mudam juntas | Usando `onToggleActive` em vez de `onToggleField` | Verificar onClick de cada `<button>` |
| Agente ativado mas IA nao responde | `validation_status` ficou `draft` | Precisa ser `active` ou `production` |
| Ativa um mas outro nao desativa | Query `.eq('client_id', ...)` errado | Verificar `selectedAgentId` === `client_id` |

### Rollback
```
git show 6ef4981 -- src/pages/PromptEditor/components/VersionDetails.tsx
git show 6ef4981 -- src/pages/PromptEditor/index.tsx
```

---

## 2. Semver (Versionamento)

### Como funciona

Ao criar nova versao (`handleCreateVersion`) ou aplicar ajuste (`handleApplyAdjustment`):

```
versao atual: "v5.8.1"
→ split('.') → ["v5", "8", "1"]
→ incrementa ultimo: ["v5", "8", "2"]
→ join('.') → "v5.8.2"
```

### Problema anterior
`parseFloat("5.8.1")` → `5.8` (perdia o patch). Agora usa `split('.')`.

### Codigo relevante
- `handleCreateVersion` (~linha 280)
- `handleApplyAdjustment` (~linha 440)

### Troubleshooting

| Sintoma | Causa | Fix |
|---------|-------|-----|
| Versao pula de v5.8 pra v5.9 (sem patch) | Usando parseFloat | Trocar pra split('.') |
| Versao "v1.1.1.1" (4 niveis) | Dado legado no banco | Funciona, split pega ultimo nivel |
| "vundefined" | version_number null | Fallback: `version \|\| '1.0.0'` |

---

## 3. Label do Editor (barra fixa)

### Como funciona

O label "Tools Config" / "Compliance Rules" / etc. agora e uma **barra fixa** (`<div>`) acima do `<textarea>`, NAO mais `absolute` flutuando por cima.

**Antes (bugado):**
```
<div class="absolute top-4 left-14 z-20">  ← flutuava sobre o texto
  Tools Config
</div>
<textarea class="pt-10">  ← padding tentava compensar
```

**Agora (correto):**
```
<div class="flex ... px-4 py-2 border-b shrink-0">  ← barra fixa
  Tools Config
</div>
<textarea class="p-4 pl-12">  ← padding normal, alinha com line numbers
```

### Codigo relevante
- `index.tsx` (~linha 671-700)

### Troubleshooting

| Sintoma | Causa | Fix |
|---------|-------|-----|
| Label cobre texto | Voltou pra `absolute` | Usar `<div>` com `shrink-0` antes do textarea |
| Line numbers desalinhados | textarea com pt diferente | textarea e gutter devem ter mesmo pt (pt-4 = 16px) |
| Label nao aparece | `activeTab` nao bate com nenhum case | Verificar mapeamento tab→label |

### Rollback
```
git show 948b61e -- src/pages/PromptEditor/index.tsx
```

---

## 4. Fallback Offline (Engenheiro de Prompts)

### Como funciona

O chat envia instrucoes para `POST /webhook/engenheiro-prompt` (n8n). Se falhar:

```
1. isConversationalMessage(msg)?  → pede clarificacao (nao propoe mudanca)
2. detectZoneFromMessage(msg)     → identifica zona (compliance, personality, etc.)
3. extractInstructionContent(msg) → extrai conteudo real + operacao + fieldPath
4. getCurrentValue(zone, path)    → busca valor atual das props
5. Monta preview com before/after reais
```

### Deteccao de zona (keywords)

| Keywords | Zona |
|----------|------|
| proibi, compliance, escala | compliance_rules |
| tom, emoji, formal | personality_config |
| valor, preco, unidade, horario | business_config |
| ferramenta, tool, habilit | tools_config |
| contexto, publico, setor | hyperpersonalization |
| modo + (sdr\|followup\|social) | prompts_by_mode |
| default | system_prompt |

### Deteccao de mensagem conversacional

Mensagens que casam com patterns conversacionais (?, "oi", "obrigado", "da pra", "como") E NAO contem keywords de edicao (adicionar, remover, mudar, etc.) sao tratadas como conversa.

### Extracao de conteudo por zona

| Zona | Exemplo input | Resultado |
|------|---------------|-----------|
| compliance_rules | "nunca mencionar preco antes de qualificar" | content: frase inteira, fieldPath: compliance_rules.proibicoes, op: add |
| personality_config | "O tom no modo followuper deve ser mais casual" | content: "mais casual", fieldPath: personality_config.modos.followuper.tom, op: update |
| business_config | "Atualize o valor do curso de nails para $950" | content: "curso de nails: $950", fieldPath: business_config.valores, op: update |

### Troubleshooting

| Sintoma | Causa | Fix |
|---------|-------|-----|
| "Modo Offline" sempre | Webhook n8n down | Verificar `https://cliente-a1.mentorfy.io/webhook/engenheiro-prompt` |
| Instrucao vira "pedir clarificacao" | Regex conversacional pegou | Adicionar keyword de edicao na mensagem |
| Zona detectada errada | Keywords ambiguas | Usar seletor de zona manual (barra "Auto" → zona especifica) |
| "Aprovar" aplica texto literal | extractInstructionContent nao parseou | Verificar regex da zona no switch/case |

### Codigo relevante
- `src/components/PromptEngineerChat.tsx` (~linhas 423-530)

### Rollback
```
git show 62cf44f -- src/components/PromptEngineerChat.tsx
```

---

## 5. Performance (Queries Otimizadas)

### useAgents (listagem do dropdown)

**Antes:** `select('*')` → trazia system_prompt (~5-50KB) + 7 JSONBs de CADA versao
**Agora:** `select('id, client_id, agent_name, ...')` → 16 campos leves

**Campos selecionados:**
```
id, client_id, agent_name, location_id, slug,
created_at, updated_at, status, is_active, validation_status,
version_number, version, last_test_score, validation_score,
total_test_runs, framework_approved
```

### useAgentVersions (versoes no editor)

**Antes:** `select('*, clients:client_id(id, nome, empresa, telefone, email, vertical, status)')`
**Agora:** select explicito + JOIN sem `telefone`/`email` (desnecessarios)

### Troubleshooting

| Sintoma | Causa | Fix |
|---------|-------|-----|
| Dropdown vazio | Campo faltando no select do useAgents | Adicionar campo ao select |
| "undefined" em campo do editor | useAgentVersions nao traz campo | Verificar select tem o campo |
| Agente sem nome | `agent_name` null + location nao encontrada | Verificar `ghl_locations` tem o location_id |

### Rollback
```
git show d9b3857 -- src/hooks/useAgents.ts
git show d9b3857 -- src/hooks/useAgentVersions.ts
```

---

## Fluxo Completo: Selecionar Agente → Editar → Salvar

```
1. useAgents.fetchAgents()
   → SELECT 16 campos leves FROM agent_versions
   → Agrupa por client_id, pega versao ativa ou mais recente
   → Resolve nome via ghl_locations
   → Popula dropdown

2. Usuario seleciona agente
   → setSelectedAgentId(client_id)
   → useAgentVersions(client_id).fetchVersions()
   → SELECT campos + JOIN clients FROM agent_versions WHERE client_id = X
   → Popula sidebar esquerda (lista versoes)

3. Usuario seleciona versao
   → setActiveVersionId(version.id)
   → Preenche textarea com system_prompt / config JSON

4. Usuario edita e clica "Salvar"
   → handleSave()
   → Detecta aba ativa → mapeia pro campo correto:
     prompt/modes → system_prompt / prompts_by_mode
     config → hyperpersonalization
     tools → tools_config
     compliance → compliance_rules
     personality → personality_config
     business → business_config
   → UPDATE agent_versions SET {campo} WHERE id = version.id

5. Usuario cria nova versao
   → handleCreateVersion()
   → Copia 8 campos obrigatorios da versao atual
   → Incrementa semver (split + ultimo++)
   → INSERT agent_versions (is_active: false, validation_status: draft)
```

---

## Comandos Uteis

```bash
# Ver diff de um commit especifico
git show <hash> --stat
git show <hash> -- <arquivo>

# Reverter um commit (cria novo commit que desfaz)
git revert <hash>

# Ver estado de um arquivo em commit anterior
git show <hash>:<caminho/arquivo>

# Restaurar arquivo de commit anterior
git checkout <hash> -- <caminho/arquivo>
```

---

## Contato de Emergencia

Se algo quebrar e Claude nao estiver disponivel:

1. **Toggle nao funciona** → verificar se `updated_at` voltou ao payload (index.tsx, ~linha 180)
2. **Versao bugada** → verificar `split('.')` (index.tsx, buscar "nextVersion")
3. **Label cobrindo texto** → verificar se voltou `absolute` (index.tsx, ~linha 671)
4. **Lento** → verificar se `select('*')` voltou (useAgents.ts, ~linha 29)
5. **Chat offline bugado** → verificar `processLocalFallback` (PromptEngineerChat.tsx, ~linha 480)
