#!/bin/bash
# RAG to VitePress - Converte entrada do RAG em documento VitePress
# Uso: ./rag-to-vitepress.sh "categoria" "titulo" "conteudo" "project_key"

set -e

DOCS_PATH="$HOME/Projects/mottivme/ai-factory-mottivme-sales/docs"
PROCESSOS_PATH="$DOCS_PATH/processos"
CONFIG_PATH="$DOCS_PATH/.vitepress/config.js"

# Parametros
CATEGORY="${1:-workflow}"
TITLE="${2:-Novo Processo}"
CONTENT="${3:-Conteudo do processo}"
PROJECT_KEY="${4:-mottivme-geral}"

# Gerar slug a partir do titulo
SLUG=$(echo "$TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | sed 's/--*/-/g' | sed 's/^-//' | sed 's/-$//')
FILENAME="${SLUG}.md"
FILEPATH="${PROCESSOS_PATH}/${FILENAME}"

# Data atual
DATE=$(date +"%Y-%m-%d")

# Emoji por categoria
case $CATEGORY in
  workflow) EMOJI="🔄" ;;
  pattern) EMOJI="🧩" ;;
  error_fix) EMOJI="🔧" ;;
  decision) EMOJI="📋" ;;
  schema) EMOJI="📊" ;;
  rule) EMOJI="📏" ;;
  api) EMOJI="🔌" ;;
  *) EMOJI="📝" ;;
esac

# Criar arquivo .md
cat > "$FILEPATH" << EOF
# ${EMOJI} ${TITLE}

> Documentado em ${DATE} | Projeto: **${PROJECT_KEY}** | Categoria: \`${CATEGORY}\`

## Resumo

${CONTENT}

## Informacoes

| Campo | Valor |
|-------|-------|
| **Categoria** | ${CATEGORY} |
| **Projeto** | ${PROJECT_KEY} |
| **Data** | ${DATE} |
| **Status** | Ativo |

## Relacionados

- [Voltar para Processos](/processos/)
EOF

echo "✅ Criado: $FILEPATH"

# Verificar se ja existe no config.js
if grep -q "link: '/processos/${SLUG}'" "$CONFIG_PATH"; then
  echo "⚠️  Ja existe no sidebar"
else
  # Adicionar ao config.js (antes do fechamento do array de Processos)
  # Primeiro, verificar se a secao Processos existe
  if grep -q "text: 'Processos'" "$CONFIG_PATH"; then
    # Secao existe, adicionar item
    sed -i '' "/text: 'Processos'/,/\]/ {
      /items: \[/a\\
\\            { text: '${TITLE}', link: '/processos/${SLUG}' },
    }" "$CONFIG_PATH" 2>/dev/null || echo "⚠️  Adicione manualmente ao config.js"
  else
    echo "⚠️  Secao Processos nao existe no config.js - sera criada no proximo passo"
  fi
fi

echo "📁 Arquivo: $FILEPATH"
echo "🔗 Link: /processos/${SLUG}"
