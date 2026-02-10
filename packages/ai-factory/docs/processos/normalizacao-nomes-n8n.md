# Normalizacao de Nomes - Workflows n8n

> Documentado em 2026-02-10 | Projeto: **mottivme-sales** | Categoria: `workflow`

## Resumo

Processo completo para corrigir nomes de leads que chegam em formatos incorretos nos workflows n8n. Cobre o fluxo principal de conversa e o follow-up, tratando nomes grudados em CAPS, telefones como nome, usernames e Title Case PT-BR.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Categoria** | workflow |
| **Projeto** | mottivme-sales |
| **Data** | 2026-02-10 |
| **Status** | Ativo |
| **Workflows** | Principal (`HXWGWQFBY4KVfY64`), Follow-Up (`3Yx6JniDrQw4KBCi`) |

---

## Problema

Leads chegam com nomes em formatos invalidos:

| Formato | Exemplo | Causa |
|---------|---------|-------|
| ALL CAPS grudado | `MARCELORAMOS` | GHL importa sem espaco |
| Numeros no nome | `MARCELO123` | Username copiado |
| Telefone como nome | `18005550521` | Campo nome preenchido com telefone |
| Username | `uke11.maritzaaaja` | Handle do Instagram |
| Email como nome | `joao@email.com` | Campo errado |
| Nome + sobrenome no follow-up | `Marcos Daniels` | Query retornava nome completo |

## Solucao Aplicada

### 1. Node "Normalizar Nome1" (Fluxo Principal)

**Workflow:** `HXWGWQFBY4KVfY64` | **Node ID:** `0006f3ef`

Codigo v2 com 3 funcoes principais:

#### Dicionario de nomes brasileiros (~150 nomes)

```javascript
const nomesBR = new Set([
  'ana','marcos','maria','jose','joao','pedro',
  'marcelo','ramos','silva','santos','oliveira',
  // ... 150+ nomes comuns
]);
```

> **Por que dicionario?** O regex `([a-z])([A-Z])` so detecta transicao minuscula→maiuscula (camelCase). Nomes ALL CAPS como `MARCELORAMOS` nao tem essa transicao.

#### Funcao `separarPalavrasGrudadas(str)`

```javascript
function separarPalavrasGrudadas(str) {
  const lower = str.toLowerCase();
  // 1. Tenta separar por dicionario (guloso, maior match primeiro)
  // 2. Fallback: padrao vogal-consoante
  // 3. Ultimo fallback: retorna original
}
```

#### Funcao `capitalizar(str)`

```javascript
function capitalizar(str) {
  const preposicoes = ['de','da','do','das','dos','e','di'];
  return palavras.map((p, i) =>
    i > 0 && preposicoes.includes(p.toLowerCase())
      ? p.toLowerCase()
      : p.charAt(0).toUpperCase() + p.slice(1).toLowerCase()
  ).join(' ');
}
```

**Resultado:** `MARCELORAMOS` → `Marcelo Ramos` | `MARCELO123` → `Marcelo`

---

### 2. Validacao de Nomes Invalidos (Follow-Up)

**Workflow:** `3Yx6JniDrQw4KBCi` | **Node:** "Formatacao" (`e7a511e5`)

```javascript
function validarNome(nome) {
  if (!nome || nome.trim() === '') return null;
  nome = nome.trim();
  if (/^\d+$/.test(nome)) return null;           // telefone
  if (nome.includes('@')) return null;             // email
  if (/^[a-zA-Z0-9._]+$/.test(nome)
      && nome.includes('.')) return null;           // username
  if (nome.length <= 1) return null;               // caractere solto
  return nome;
}
```

**Regra no prompt da IA:** Se nome vazio/null, usar saudacao generica sem nome.

---

### 3. First Name no Follow-Up (SQL)

**Workflow:** `3Yx6JniDrQw4KBCi` | **Node:** "Sem Resposta" (`a5f1966e`)

```sql
SELECT
  CASE
    WHEN fq.contact_name IS NULL OR TRIM(fq.contact_name) = '' THEN 'Visitante'
    WHEN fq.contact_name ~ '^\d+$' THEN 'Visitante'
    ELSE INITCAP(SPLIT_PART(
      REGEXP_REPLACE(fq.contact_name, '[0-9]', '', 'g'),
      ' ', 1
    ))
  END as first_name,
  ...
```

**3 nodes atualizados** para usar `first_name` em vez de `full_name`:
- Formatacao (`e7a511e5`)
- Informacoes Relevantes - FUP (`f6c59ef8`)
- Assistente de follow up eterno (`52876071`)

---

### 4. Cadencia por Canal (WhatsApp vs Instagram)

**Tabela:** `fuu_cadences` | **Coluna:** `channel` (varchar)

A query "Sem Resposta" agora filtra por canal:

```sql
AND channel = CASE
  WHEN fq.canal_origem ILIKE '%whatsapp%' THEN 'whatsapp'
  ELSE 'instagram'
END
```

**Cadencias WhatsApp** (mais agressivas que Instagram):

| Tentativa | Intervalo | Mensagem |
|-----------|-----------|----------|
| 1 | 2h | Retomada casual |
| 2 | 6h | Valor adicional |
| 3 | 24h | Prova social |
| 4 | 48h | Escassez |
| 5 | 72h | Ultimo contato |

---

## Checklist de Verificacao

Apos aplicar as correcoes, verificar com execucoes reais:

1. **Buscar execucao recente** via API n8n:
   ```
   GET /api/v1/executions?workflowId={id}&limit=3&status=success
   ```

2. **Verificar output do node** com `includeData=true`:
   ```
   GET /api/v1/executions/{id}?includeData=true
   ```

3. **Checar nos dados:**
   - [ ] Nomes grudados estao separados? (`MARCELORAMOS` → `Marcelo Ramos`)
   - [ ] Numeros removidos? (`MARCELO123` → `Marcelo`)
   - [ ] Title Case correto? (`maria da silva` → `Maria da Silva`)
   - [ ] Telefones como nome tratados? (`18005550521` → nome omitido)
   - [ ] Follow-up usa primeiro nome? (nao nome completo)
   - [ ] Cadencia WhatsApp diferente de Instagram?

---

## Troubleshooting

### Nome ainda vem errado

1. Verificar se o node "Normalizar Nome1" esta ativo no workflow
2. Verificar se o nome esta no dicionario `nomesBR` — adicionar se necessario
3. Para nomes compostos raros, o fallback vogal-consoante pode errar — adicionar ao dicionario

### Follow-up chama por nome completo

1. Verificar node "Sem Resposta" — query deve ter `SPLIT_PART(..., ' ', 1)`
2. Verificar nodes downstream — devem usar `{{ $json.first_name }}` e nao `{{ $json.contact_name }}`

### Cadencia identica nos 2 canais

1. Verificar coluna `channel` na tabela `fuu_cadences`
2. Query deve ter `AND channel = CASE WHEN ... END`
3. Verificar se existem registros com `channel = 'whatsapp'` na tabela

---

## Skill Relacionada

Manual completo disponivel como skill Claude Code:

```
~/.claude/skills/n8n-name-normalization.md
```

Invocar com: `/sl n8n-name-normalization`

---

## Relacionados

- [Voltar para Processos](/processos/)
