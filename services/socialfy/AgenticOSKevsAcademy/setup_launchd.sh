#!/bin/bash
# Setup script for Socialfy Campaign Worker LaunchAgent
# Executa: ./setup_launchd.sh

set -e

PLIST_NAME="com.socialfy.campaignworker.plist"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST_SOURCE="$SCRIPT_DIR/$PLIST_NAME"
PLIST_DEST="$HOME/Library/LaunchAgents/$PLIST_NAME"
LOG_DIR="$HOME/Library/Logs/socialfy"

echo "🚀 Configurando Socialfy Campaign Worker..."
echo ""

# 1. Criar pasta de logs
echo "📁 Criando pasta de logs: $LOG_DIR"
mkdir -p "$LOG_DIR"

# 2. Descarregar se já existir
if launchctl list | grep -q "com.socialfy.campaignworker"; then
    echo "⏸️  Descarregando serviço existente..."
    launchctl unload "$PLIST_DEST" 2>/dev/null || true
fi

# 3. Copiar plist para LaunchAgents
echo "📋 Copiando plist para: $PLIST_DEST"
cp "$PLIST_SOURCE" "$PLIST_DEST"

# 4. Carregar o serviço
echo "▶️  Carregando serviço..."
launchctl load "$PLIST_DEST"

# 5. Mostrar status
echo ""
echo "✅ Setup concluído!"
echo ""
echo "📊 Status do serviço:"
if launchctl list | grep -q "com.socialfy.campaignworker"; then
    launchctl list | grep "com.socialfy.campaignworker"
    echo ""
    echo "🟢 Serviço ativo! Rodando a cada 60 segundos."
else
    echo "🔴 Serviço não encontrado. Verifique os logs."
fi

echo ""
echo "📝 Logs disponíveis em:"
echo "   - $LOG_DIR/campaign_worker.log"
echo "   - $LOG_DIR/campaign_worker_error.log"
echo ""
echo "🔧 Comandos úteis:"
echo "   launchctl list | grep socialfy          # Ver status"
echo "   launchctl unload $PLIST_DEST            # Parar"
echo "   launchctl load $PLIST_DEST              # Iniciar"
echo "   tail -f $LOG_DIR/campaign_worker.log    # Ver logs"
