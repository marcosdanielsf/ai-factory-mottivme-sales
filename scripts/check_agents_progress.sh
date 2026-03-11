#!/bin/bash

echo "🤖 MONITORAMENTO DOS AGENTES - DISSECAÇÃO FLUXO GHL"
echo "=================================================="
echo ""

AGENTS=(
  "ad5be37:Database (Postgres):01_POSTGRES_V2"
  "a68cf3f:HTTP/API:02_HTTP_API"
  "a2888fc:Data Transform:03_DATA_TRANSFORM"
  "a7b300c:AI/LLM:04_AI_LLM"
  "a55e76a:Control Flow:05_CONTROL_FLOW"
  "ad3478d:LangChain Tools:06_LANGCHAIN_TOOLS"
  "a0399c9:Utilities:07_UTILITIES"
  "aa5d3ca:Others/Notes:08_OTHERS"
)

OUTPUT_DIR="/Users/marcosdaniels/Documents/Projetos/MOTTIVME SALES TOTAL/projects/n8n-workspace/Fluxos n8n/AI-Factory- Mottivme Sales/Analise dos nós do fluxo GHL principal por tipo"

for agent_info in "${AGENTS[@]}"; do
  IFS=':' read -r agent_id agent_name file_prefix <<< "$agent_info"
  
  echo "📋 $agent_name (ID: $agent_id)"
  
  # Verificar se arquivo foi criado
  if ls "$OUTPUT_DIR"/${file_prefix}*.md 2>/dev/null | grep -q .; then
    file=$(ls "$OUTPUT_DIR"/${file_prefix}*.md | head -1)
    size=$(wc -c < "$file" | tr -d ' ')
    lines=$(wc -l < "$file" | tr -d ' ')
    echo "   ✅ Arquivo criado: $(basename "$file")"
    echo "   📊 Tamanho: $size bytes | $lines linhas"
  else
    echo "   ⏳ Aguardando conclusão..."
  fi
  echo ""
done

echo "=================================================="
echo "✅ Para ver output completo de um agente:"
echo "   cat /tmp/claude/.../tasks/<agent_id>.output"
echo ""
