# Como Documentar Processos

> Documentado em 2026-02-10 | Projeto: **mottivme-geral** | Categoria: `pattern`

## Resumo

Guia completo de como criar, buildar e deployar paginas de documentacao no site VitePress da AI Factory. Inclui a estrutura de arquivos, regras de nomeacao, armadilhas conhecidas e o fluxo de deploy.

## Informacoes

| Campo | Valor |
|-------|-------|
| **Categoria** | pattern |
| **Projeto** | mottivme-geral |
| **Data** | 2026-02-10 |
| **Status** | Ativo |
| **URL do Site** | [docs-jet-delta.vercel.app](https://docs-jet-delta.vercel.app) |
| **Repo** | `marcosdanielsf/ai-factory-mottivme-sales` |
| **Pasta docs** | `packages/ai-factory/docs/` |

---

## Estrutura do Projeto

```
packages/ai-factory/docs/
├── .vitepress/
│   ├── config.js          ← Sidebar, nav, srcExclude
│   ├── cache/             ← Ignorar (gitignore)
│   └── dist/              ← Output do build (nao commitar)
├── processos/
│   ├── index.md           ← Catalogo de processos
│   ├── backup-supabase-automatico.md
│   ├── normalizacao-nomes-n8n.md
│   └── como-documentar-processos.md  ← Este arquivo
├── arquitetura/
├── workflows/
├── guias/
├── integracoes/
├── analises/
├── relatorios/
├── planos/
├── index.md               ← Homepage
├── package.json
└── vercel.json
```

---

## Passo a Passo: Criar Nova Pagina

### 1. Criar o arquivo .md

Criar na pasta correspondente a secao. Para processos:

```
packages/ai-factory/docs/processos/nome-do-processo.md
```

**Regras de nomeacao:**
- Usar kebab-case: `normalizacao-nomes-n8n.md`
- SEM espacos no nome do arquivo
- SEM parenteses no nome do arquivo
- SEM caracteres especiais ou acentos

**Template basico:**

```markdown
# Titulo do Processo

> Documentado em YYYY-MM-DD | Projeto: **nome** | Categoria: `tipo`

## Resumo
Descricao curta do que o processo faz.

## Informacoes
| Campo | Valor |
|-------|-------|
| **Categoria** | workflow / pattern / error_fix / decision |
| **Projeto** | nome-do-projeto |
| **Data** | YYYY-MM-DD |
| **Status** | Ativo |

---

## Problema
O que motivou a criacao deste processo.

## Solucao Aplicada
Detalhes tecnicos da solucao.

## Checklist de Verificacao
- [ ] Item 1
- [ ] Item 2

## Troubleshooting
### Cenario X
1. Passo 1
2. Passo 2

---

## Relacionados
- [Voltar para Processos](/processos/)
```

### 2. Registrar no Sidebar

Editar `docs/.vitepress/config.js`, secao Processos:

```javascript
{
  text: 'Processos',
  collapsed: false,
  items: [
    { text: 'Backup Supabase Automatico', link: '/processos/backup-supabase-automatico' },
    { text: 'Normalizacao de Nomes', link: '/processos/normalizacao-nomes-n8n' },
    { text: 'Novo Processo Aqui', link: '/processos/nome-do-arquivo' },  // ← adicionar
    { text: 'Catalogo', link: '/processos/' }  // ← sempre por ultimo
  ]
}
```

### 3. Build local (testar)

```bash
cd packages/ai-factory/docs
npm install       # so na primeira vez
npx vitepress build
```

Se o build falhar, ver secao Armadilhas abaixo.

### 4. Deploy

```bash
cd packages/ai-factory/docs
vercel --prod
```

::: warning IMPORTANTE
O deploy e feito com `vercel --prod` **de dentro da pasta docs**.
O projeto Vercel correto e `docs` (alias `docs-jet-delta.vercel.app`).

Se der erro de projeto errado, re-linkar:
```bash
vercel link --project docs --yes
```
:::

---

## Armadilhas Conhecidas

### Parenteses no nome de arquivo

Arquivos com `(` ou `)` no nome **quebram o build** do VitePress. Exemplo:

```
analise-head-vendas (no claude - projeto growth-os).md  ← QUEBRA
analise-head-vendas.md                                   ← OK
```

**Protecao:** O `config.js` tem `srcExclude` que ignora esses arquivos:

```javascript
srcExclude: ['**/*no claude*', '**/_archive/**']
```

### Templates Vue em Markdown

VitePress interpreta <code v-pre>{{ qualquer_coisa }}</code> como template Vue. Isso causa erro de build quando voce documenta expressoes n8n.

**Errado** (quebra o build):

```markdown
O node usa `{{ $json.first_name }}` para acessar o campo.
```

**Correto** (escapado com `v-pre`):

```html
O node usa <code v-pre>{{ $json.first_name }}</code> para acessar o campo.
```

Dentro de blocos de codigo fenced (` ``` `), o Vue NAO interpreta. So precisa escapar em texto inline com backtick simples.

### Dois projetos Vercel

Existem 2 projetos separados no Vercel para este repo:

| Projeto | URL | Uso |
|---------|-----|-----|
| `docs` | `docs-jet-delta.vercel.app` | Site live (deploy manual) |
| `mottivme-ai-docs` | `mottivme-ai-docs-...vercel.app` | Conectado ao GitHub (builds falham) |

**Sempre usar o projeto `docs`** com `vercel --prod` local.

O projeto `mottivme-ai-docs` esta conectado ao GitHub e tenta buildar a cada push, mas o root directory esta errado — por isso falha. Pode ser ignorado ou corrigido no dashboard do Vercel.

### Cache CDN

Apos deploy, a pagina pode demorar ~1 minuto pra propagar. Use Cmd+Shift+R para hard refresh.

---

## Fluxo Completo (Resumo)

```
1. Criar arquivo .md na pasta correta
   └─ kebab-case, sem espacos/parenteses

2. Registrar no sidebar (config.js)
   └─ Manter "Catalogo" como ultimo item

3. Testar build local
   └─ npx vitepress build

4. Deploy
   └─ vercel --prod (de dentro de docs/)

5. Verificar no browser
   └─ Cmd+Shift+R se necessario
```

---

## Relacionados

- [Catalogo de Processos](/processos/)
- [Normalizacao de Nomes](/processos/normalizacao-nomes-n8n) — exemplo de processo documentado
- [Backup Supabase](/processos/backup-supabase-automatico) — outro exemplo
