#!/bin/bash
# =============================================================================
# MAC ORGANIZER MAPPER - MOTTIVME
# =============================================================================
# Este script APENAS MAPEIA e gera relatorios. NAO MOVE NADA.
# Autor: Claude Code para Marcos Daniels
# Data: 2026-01-09
# =============================================================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Diretorio de output
REPORT_DIR="$HOME/Projects/mottivme/docs/mac-organization"
mkdir -p "$REPORT_DIR"

TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$REPORT_DIR/organization-report-$TIMESTAMP.md"

echo -e "${BLUE}=== MAC ORGANIZER MAPPER ===${NC}"
echo -e "${YELLOW}Gerando relatorio em: $REPORT_FILE${NC}"
echo ""

# Iniciar relatorio
cat > "$REPORT_FILE" << 'HEADER'
# Relatorio de Organizacao Mac - MOTTIVME

**Gerado em:** $(date)
**IMPORTANTE:** Este relatorio APENAS MAPEIA. Nenhum arquivo foi movido.

---

HEADER

# Substituir data no header
sed -i '' "s/\$(date)/$(date)/" "$REPORT_FILE"

# =============================================================================
# 1. ARQUIVOS SOLTOS NA RAIZ ~/
# =============================================================================
echo -e "${BLUE}[1/6] Mapeando arquivos soltos em ~/...${NC}"

cat >> "$REPORT_FILE" << 'EOF'
## 1. Arquivos Soltos em ~/

Arquivos que NAO deveriam estar na raiz do usuario:

| Arquivo | Tamanho | Ultima Modificacao | Sugestao |
|---------|---------|-------------------|----------|
EOF

# Listar arquivos soltos (nao ocultos, nao symlinks)
find ~ -maxdepth 1 -type f ! -name ".*" 2>/dev/null | while read file; do
    filename=$(basename "$file")
    size=$(ls -lh "$file" 2>/dev/null | awk '{print $5}')
    modified=$(stat -f "%Sm" -t "%Y-%m-%d" "$file" 2>/dev/null)

    # Determinar sugestao baseado na extensao
    case "$filename" in
        *.md) suggestion="~/Docs/guias/ ou ~/Projects/mottivme/docs/" ;;
        *.numbers|*.xlsx) suggestion="~/Docs/planilhas/" ;;
        *.pdf) suggestion="~/Docs/propostas/ ou ~/Docs/clientes/" ;;
        *.js) suggestion="~/Projects/scripts/" ;;
        *.json) suggestion="~/Projects/mottivme/" ;;
        *.sh) suggestion="~/Projects/scripts/utils/" ;;
        *.py) suggestion="~/Projects/scripts/python/" ;;
        *.log) suggestion="Deletar ou ~/Projects/temp/" ;;
        *) suggestion="Verificar manualmente" ;;
    esac

    echo "| \`$filename\` | $size | $modified | $suggestion |" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"

# =============================================================================
# 2. PASTAS SOLTAS NA RAIZ ~/
# =============================================================================
echo -e "${BLUE}[2/6] Mapeando pastas soltas em ~/...${NC}"

cat >> "$REPORT_FILE" << 'EOF'
## 2. Pastas Soltas em ~/

Pastas que NAO sao do sistema e podem precisar de organizacao:

| Pasta | Tipo | Conteudo | Sugestao |
|-------|------|----------|----------|
EOF

# Pastas do sistema que devemos ignorar
SYSTEM_DIRS="Applications|Desktop|Documents|Downloads|Library|Movies|Music|Pictures|Public|Sites|Projects|Docs|bin|Google Drive"

# Listar pastas soltas
ls -la ~ | grep "^d" | grep -v "^\." | awk '{print $NF}' | grep -vE "^($SYSTEM_DIRS)$" | while read dir; do
    if [ -d "$HOME/$dir" ]; then
        # Verificar se e symlink
        if [ -L "$HOME/$dir" ]; then
            tipo="Symlink"
            target=$(readlink "$HOME/$dir")
            suggestion="Manter (retrocompatibilidade) ou remover se nao usar"
        else
            tipo="Pasta real"
            # Contar arquivos
            count=$(find "$HOME/$dir" -maxdepth 2 -type f 2>/dev/null | wc -l | tr -d ' ')
            suggestion="Mover para ~/Projects/ ou deletar se orfao"
        fi

        echo "| \`$dir\` | $tipo | ${count:-N/A} arquivos | $suggestion |" >> "$REPORT_FILE"
    fi
done

echo "" >> "$REPORT_FILE"

# =============================================================================
# 3. DUPLICATAS CONHECIDAS
# =============================================================================
echo -e "${BLUE}[3/6] Buscando duplicatas...${NC}"

cat >> "$REPORT_FILE" << 'EOF'
## 3. Duplicatas Identificadas

### ai-factory-mottivme-sales
EOF

echo "Locais encontrados:" >> "$REPORT_FILE"
find ~ -maxdepth 6 -type d -name "ai-factory-mottivme-sales" 2>/dev/null | while read dir; do
    gitdir="Nao"
    [ -d "$dir/.git" ] && gitdir="Sim"
    lastmod=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$dir" 2>/dev/null)
    filecount=$(find "$dir" -maxdepth 1 -type f -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
    echo "- \`$dir\`" >> "$REPORT_FILE"
    echo "  - Git: $gitdir | Ultima mod: $lastmod | JSONs: $filecount" >> "$REPORT_FILE"
done

cat >> "$REPORT_FILE" << 'EOF'

### front-factorai-mottivme-sales
EOF

echo "Locais encontrados:" >> "$REPORT_FILE"
find ~ -maxdepth 6 -type d -name "front-factorai-mottivme-sales" 2>/dev/null | while read dir; do
    gitdir="Nao"
    [ -d "$dir/.git" ] && gitdir="Sim"
    lastmod=$(stat -f "%Sm" -t "%Y-%m-%d %H:%M" "$dir" 2>/dev/null)
    echo "- \`$dir\`" >> "$REPORT_FILE"
    echo "  - Git: $gitdir | Ultima mod: $lastmod" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"

# =============================================================================
# 4. FLUXOS N8N ESPALHADOS
# =============================================================================
echo -e "${BLUE}[4/6] Mapeando fluxos n8n...${NC}"

cat >> "$REPORT_FILE" << 'EOF'
## 4. Fluxos N8N Espalhados

Arquivos JSON que parecem ser fluxos n8n (contem "nodes" e "connections"):

| Arquivo | Local | Tamanho | Ultima Mod |
|---------|-------|---------|------------|
EOF

find ~/Projects/mottivme ~/Documents/Projetos -path "*/node_modules" -prune -o -name "*.json" -size +5k -type f -print 2>/dev/null | while read f; do
    if grep -q '"nodes"' "$f" 2>/dev/null && grep -q '"connections"' "$f" 2>/dev/null; then
        filename=$(basename "$f")
        dirpath=$(dirname "$f" | sed "s|$HOME|~|")
        size=$(ls -lh "$f" 2>/dev/null | awk '{print $5}')
        modified=$(stat -f "%Sm" -t "%Y-%m-%d" "$f" 2>/dev/null)
        echo "| \`$filename\` | $dirpath | $size | $modified |" >> "$REPORT_FILE"
    fi
done

echo "" >> "$REPORT_FILE"

# =============================================================================
# 5. ESTRUTURA ATUAL ~/Projects/mottivme
# =============================================================================
echo -e "${BLUE}[5/6] Mapeando estrutura Projects/mottivme...${NC}"

cat >> "$REPORT_FILE" << 'EOF'
## 5. Estrutura Atual ~/Projects/mottivme

```
EOF

tree -L 2 ~/Projects/mottivme 2>/dev/null >> "$REPORT_FILE" || ls -la ~/Projects/mottivme >> "$REPORT_FILE"

echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# =============================================================================
# 6. RECOMENDACOES
# =============================================================================
echo -e "${BLUE}[6/6] Gerando recomendacoes...${NC}"

cat >> "$REPORT_FILE" << 'EOF'
## 6. Recomendacoes de Acao

### Prioridade ALTA (fazer primeiro)
1. **Resolver duplicatas ai-factory-mottivme-sales**
   - Comparar arquivos entre as versoes
   - Manter a mais atualizada em `~/Projects/mottivme/`
   - Arquivar ou deletar as outras

2. **Limpar arquivos soltos em ~/**
   - Mover .md para ~/Docs/guias/
   - Mover .numbers para ~/Docs/planilhas/
   - Mover .js/.py para ~/Projects/scripts/

### Prioridade MEDIA
3. **Consolidar fluxos n8n**
   - Definir local unico: `~/Projects/mottivme/n8n-workflows/`
   - Organizar por projeto/cliente

4. **Symlinks na raiz**
   - Remover se nao usa no terminal
   - Ou manter para retrocompatibilidade

### Prioridade BAIXA
5. **Limpar pastas orfas**
   - `node_modules` na raiz
   - `untitled folder`
   - Pastas de cache antigas

---

## Proximos Passos

Para executar a reorganizacao:
1. Revise este relatorio
2. Aprove as acoes sugeridas
3. Execute o script de reorganizacao (sera criado apos aprovacao)

**NENHUM ARQUIVO FOI MOVIDO. Este e apenas um relatorio de diagnostico.**
EOF

echo ""
echo -e "${GREEN}=== RELATORIO GERADO COM SUCESSO ===${NC}"
echo -e "Arquivo: ${YELLOW}$REPORT_FILE${NC}"
echo ""
echo -e "${BLUE}Para visualizar:${NC}"
echo "  cat $REPORT_FILE"
echo "  open $REPORT_FILE"
echo ""
