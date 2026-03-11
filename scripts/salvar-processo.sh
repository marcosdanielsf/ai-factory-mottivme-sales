#!/bin/bash
# Salvar Processo - Salva no RAG E gera doc VitePress
# Uso: ./salvar-processo.sh "categoria" "titulo" "conteudo" "project_key"
#
# Exemplo:
# ./salvar-processo.sh "workflow" "Deploy Railway" "Passos para deploy..." "socialfy"

set -e

SCRIPTS_PATH="$HOME/Projects/mottivme/ai-factory-mottivme-sales/scripts"
DOCS_PATH="$HOME/Projects/mottivme/ai-factory-mottivme-sales/docs"

# Parametros
CATEGORY="${1:-workflow}"
TITLE="${2:-Novo Processo}"
CONTENT="${3:-Conteudo do processo}"
PROJECT_KEY="${4:-mottivme-geral}"

echo "🚀 Salvando processo: $TITLE"
echo "   Categoria: $CATEGORY"
echo "   Projeto: $PROJECT_KEY"
echo ""

# 1. Salvar no RAG
echo "📡 Enviando para RAG..."
RAG_RESPONSE=$(curl -s -X POST "https://agenticoskevsacademy-production.up.railway.app/webhook/rag-ingest" \
  -H "Content-Type: application/json" \
  -d "{
    \"category\": \"$CATEGORY\",
    \"title\": \"$TITLE\",
    \"content\": \"$CONTENT\",
    \"project_key\": \"$PROJECT_KEY\"
  }")

echo "   RAG: $RAG_RESPONSE"

# 2. Gerar VitePress doc
echo ""
echo "📝 Gerando documento VitePress..."
"$SCRIPTS_PATH/rag-to-vitepress.sh" "$CATEGORY" "$TITLE" "$CONTENT" "$PROJECT_KEY"

# 3. Git commit (opcional)
echo ""
read -p "🔄 Fazer commit e push? (y/n): " COMMIT_CHOICE
if [ "$COMMIT_CHOICE" = "y" ]; then
  cd "$DOCS_PATH/.."
  git add docs/processos/
  git commit -m "docs: adiciona processo - $TITLE"
  git push
  echo "✅ Commit realizado!"
fi

echo ""
echo "🎉 Processo salvo com sucesso!"
echo "   RAG: Salvo"
echo "   VitePress: Gerado"
echo "   Deploy: Automatico no Vercel"
