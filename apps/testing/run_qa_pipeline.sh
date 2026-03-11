#!/bin/bash
# Run QA Pipeline com ANTHROPIC_API_KEY

# Verificar se a chave foi passada
if [ -z "$ANTHROPIC_API_KEY" ]; then
    echo "Uso: ANTHROPIC_API_KEY=sk-xxx ./run_qa_pipeline.sh"
    echo ""
    echo "Ou exporte a chave antes:"
    echo "  export ANTHROPIC_API_KEY=sk-xxx"
    echo "  ./run_qa_pipeline.sh"
    exit 1
fi

# Desabilitar proxy se houver
unset ALL_PROXY
unset all_proxy

# Rodar o teste
cd "$(dirname "$0")"
python3 test_qa_pipeline.py
