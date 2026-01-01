#!/bin/bash
# Teste de estrutura e validação sem necessidade de credenciais

set -e

echo "🧪 Testing AI Factory Structure (No Credentials Required)"
echo ""

# Teste 1: Verificar estrutura de arquivos
echo "📁 Test 1: File Structure"
echo ""

required_files=(
    "agents/ai_judge_agent.py"
    "agents/analytics_agent.py"
    "agents/webhook_sync_agent.py"
    "orchestrator.sh"
    "test-integration.sh"
    "requirements.txt"
    ".env.example"
    "README.md"
    "INTEGRATION_GUIDE.md"
    "STATUS.md"
    "n8n-workflow-template.json"
    "agent-orchestrator-config.json"
)

all_files_ok=true

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        size=$(ls -lh "$file" | awk '{print $5}')
        echo "  ✅ $file ($size)"
    else
        echo "  ❌ $file - MISSING"
        all_files_ok=false
    fi
done

echo ""

# Teste 2: Verificar diretórios
echo "📂 Test 2: Directory Structure"
echo ""

required_dirs=(
    "agents"
    "logs"
    "pids"
)

for dir in "${required_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "  ✅ $dir/"
    else
        echo "  ❌ $dir/ - MISSING"
        all_files_ok=false
    fi
done

echo ""

# Teste 3: Verificar permissões de execução
echo "🔐 Test 3: Execute Permissions"
echo ""

executable_files=(
    "orchestrator.sh"
    "test-integration.sh"
    "test-structure.sh"
)

for file in "${executable_files[@]}"; do
    if [ -x "$file" ]; then
        echo "  ✅ $file (executable)"
    else
        echo "  ⚠️  $file (not executable)"
        chmod +x "$file"
        echo "     → Fixed: made executable"
    fi
done

echo ""

# Teste 4: Validar sintaxe Python
echo "🐍 Test 4: Python Syntax Validation"
echo ""

for agent in agents/*.py; do
    if python3 -m py_compile "$agent" 2>/dev/null; then
        echo "  ✅ $(basename $agent) - Valid Python syntax"
    else
        echo "  ❌ $(basename $agent) - Syntax errors"
        all_files_ok=false
    fi
done

echo ""

# Teste 5: Validar JSON
echo "📋 Test 5: JSON Validation"
echo ""

json_files=(
    "n8n-workflow-template.json"
    "agent-orchestrator-config.json"
)

for json_file in "${json_files[@]}"; do
    if python3 -c "import json; json.load(open('$json_file'))" 2>/dev/null; then
        echo "  ✅ $json_file - Valid JSON"
    else
        echo "  ❌ $json_file - Invalid JSON"
        all_files_ok=false
    fi
done

echo ""

# Teste 6: Verificar dependências Python
echo "📦 Test 6: Python Dependencies"
echo ""

if [ -f "requirements.txt" ]; then
    echo "  📄 requirements.txt contents:"
    cat requirements.txt | sed 's/^/     /'
    echo ""

    echo "  🔍 Checking installed packages..."
    while IFS= read -r package; do
        package_name=$(echo "$package" | cut -d'>' -f1 | cut -d'=' -f1 | cut -d'<' -f1)
        if python3 -c "import ${package_name//-/_}" 2>/dev/null; then
            echo "     ✅ $package_name - Installed"
        else
            echo "     ⚠️  $package_name - Not installed"
        fi
    done < requirements.txt
fi

echo ""

# Teste 7: Verificar configuração .env
echo "⚙️  Test 7: Environment Configuration"
echo ""

if [ -f ".env" ]; then
    echo "  ✅ .env file exists"
    echo "  📝 Variables configured:"
    grep -v '^#' .env | grep -v '^$' | cut -d'=' -f1 | sed 's/^/     ✓ /'
else
    echo "  ⚠️  .env file not found"
    echo "  📝 To configure, run:"
    echo "     cp .env.example .env"
    echo "     # Then edit .env with your credentials"
fi

echo ""

# Teste 8: Verificar documentação
echo "📚 Test 8: Documentation"
echo ""

docs=(
    "README.md"
    "INTEGRATION_GUIDE.md"
    "STATUS.md"
)

for doc in "${docs[@]}"; do
    if [ -f "$doc" ]; then
        lines=$(wc -l < "$doc")
        echo "  ✅ $doc ($lines lines)"
    fi
done

echo ""

# Resumo final
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$all_files_ok" = true ]; then
    echo "✅ STRUCTURE TEST PASSED"
    echo ""
    echo "🎯 Next Steps:"
    echo "  1. Configure .env file:"
    echo "     cp .env.example .env"
    echo "     # Edit with your Supabase + Anthropic credentials"
    echo ""
    echo "  2. Install dependencies:"
    echo "     pip3 install -r requirements.txt"
    echo ""
    echo "  3. Run integration test:"
    echo "     ./test-integration.sh"
    echo ""
    echo "  4. Start production:"
    echo "     ./orchestrator.sh"
    echo ""
    exit 0
else
    echo "❌ STRUCTURE TEST FAILED"
    echo ""
    echo "Please fix the issues above and run again."
    echo ""
    exit 1
fi
