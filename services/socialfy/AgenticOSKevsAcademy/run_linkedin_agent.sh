#!/bin/bash
# ============================================
# LinkedIn DM Agent - Runner Script
# ============================================

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_PATH="$SCRIPT_DIR/.venv"
IMPLEMENTATION_PATH="$SCRIPT_DIR/implementation/linkedin_dm_agent.py"

# Check virtual environment
if [ ! -d "$VENV_PATH" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python3 -m venv "$VENV_PATH"
fi

# Activate venv
source "$VENV_PATH/bin/activate"

# Install dependencies if needed
if ! python -c "import playwright" 2>/dev/null; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    pip install playwright python-dotenv requests playwright-stealth
    playwright install chromium
fi

# Menu
echo ""
echo -e "${BLUE}╔══════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     LinkedIn DM Agent - AgenticOS        ║${NC}"
echo -e "${BLUE}╠══════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  1) Login apenas (salvar sessão)         ║${NC}"
echo -e "${BLUE}║  2) Enviar Connection Requests           ║${NC}"
echo -e "${BLUE}║  3) Enviar Mensagens (para conexões)     ║${NC}"
echo -e "${BLUE}║  4) Modo Híbrido (connections + msgs)    ║${NC}"
echo -e "${BLUE}║  5) Ver estatísticas do dia              ║${NC}"
echo -e "${BLUE}║  6) Rodar em headless                    ║${NC}"
echo -e "${BLUE}║  7) Sair                                 ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════╝${NC}"
echo ""

read -p "Escolha uma opção [1-7]: " choice

case $choice in
    1)
        echo -e "${GREEN}🔐 Iniciando login...${NC}"
        python "$IMPLEMENTATION_PATH" --login-only
        ;;
    2)
        read -p "Quantas connections? [20]: " limit
        limit=${limit:-20}
        echo -e "${GREEN}🔗 Enviando $limit connection requests...${NC}"
        python "$IMPLEMENTATION_PATH" --mode connection --limit "$limit"
        ;;
    3)
        read -p "Quantas mensagens? [30]: " limit
        limit=${limit:-30}
        echo -e "${GREEN}💬 Enviando $limit mensagens...${NC}"
        python "$IMPLEMENTATION_PATH" --mode message --limit "$limit"
        ;;
    4)
        read -p "Total de ações? [40]: " limit
        limit=${limit:-40}
        echo -e "${GREEN}🔄 Modo híbrido com $limit ações...${NC}"
        python "$IMPLEMENTATION_PATH" --mode hybrid --limit "$limit"
        ;;
    5)
        echo -e "${GREEN}📊 Estatísticas do dia:${NC}"
        # Query Supabase diretamente
        source "$SCRIPT_DIR/.env" 2>/dev/null || true
        if [ -n "$SUPABASE_URL" ] && [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
            TODAY=$(date +%Y-%m-%d)
            
            echo ""
            echo "📅 Data: $TODAY"
            echo ""
            
            # Connections today
            CONN=$(curl -s "${SUPABASE_URL}/rest/v1/linkedin_connections_sent?select=id&sent_at=gte.${TODAY}T00:00:00" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Prefer: count=exact" \
                -I 2>/dev/null | grep -i content-range | cut -d'/' -f2 | tr -d '\r')
            echo "   🔗 Connections enviadas hoje: ${CONN:-0}"
            
            # Messages today
            MSG=$(curl -s "${SUPABASE_URL}/rest/v1/linkedin_messages_sent?select=id&sent_at=gte.${TODAY}T00:00:00" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Prefer: count=exact" \
                -I 2>/dev/null | grep -i content-range | cut -d'/' -f2 | tr -d '\r')
            echo "   💬 Mensagens enviadas hoje: ${MSG:-0}"
            
            # Pending connections
            PENDING=$(curl -s "${SUPABASE_URL}/rest/v1/linkedin_connections_sent?select=id&status=eq.pending" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Prefer: count=exact" \
                -I 2>/dev/null | grep -i content-range | cut -d'/' -f2 | tr -d '\r')
            echo "   ⏳ Connections pendentes: ${PENDING:-0}"
            
            # Total leads
            LEADS=$(curl -s "${SUPABASE_URL}/rest/v1/linkedin_leads?select=id" \
                -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
                -H "Prefer: count=exact" \
                -I 2>/dev/null | grep -i content-range | cut -d'/' -f2 | tr -d '\r')
            echo "   📋 Total de leads: ${LEADS:-0}"
            echo ""
        else
            echo -e "${RED}❌ Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env${NC}"
        fi
        ;;
    6)
        read -p "Modo [connection/message/hybrid]: " mode
        mode=${mode:-connection}
        read -p "Limite? [20]: " limit
        limit=${limit:-20}
        echo -e "${GREEN}🤖 Rodando em headless...${NC}"
        python "$IMPLEMENTATION_PATH" --mode "$mode" --limit "$limit" --headless
        ;;
    7)
        echo -e "${YELLOW}👋 Até mais!${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Opção inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Concluído!${NC}"
