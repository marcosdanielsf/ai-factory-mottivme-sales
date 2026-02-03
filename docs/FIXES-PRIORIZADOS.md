# 🔧 Plano de Fixes - AI Factory Frontend

**Gerado em:** 2025-02-05
**Baseado em:** Análises de código e UX dos componentes Notifications, SuperAgentRPG, TeamRPG

---

## 📊 Resumo por Componente

| Componente | Code | UX | Status |
|------------|------|----|----|
| Notifications.tsx | 6.5/10 | — | 🔄 Aplicando |
| SuperAgentRPG.tsx | 6.5/10 | 6.2/10 | 🔄 Aplicando |
| TeamRPG.tsx | 6.5/10 | 6.5/10 | 🔄 Aplicando |

---

## 🔴 P0 - BUGS CRÍTICOS (Aplicados)

### 1. ✅ Notifications.tsx - Botão refresh duplicado
- **Problema:** Dois botões de refresh idênticos na interface
- **Fix:** Removido o bloco duplicado (linhas 144-153)

### 2. ✅ SuperAgentRPG.tsx - Level incrementa infinitamente
- **Problema:** useEffect incrementa `level + 1` toda vez que `activeTrainer` muda
- **Fix:** Removido incremento de level, mantendo apenas a mudança de aura

---

## 🟠 P1 - PERFORMANCE (Aplicados)

### 3. ✅ SuperAgentRPG.tsx - getAuraClass fora do componente
- **Problema:** Função pura recriada a cada render
- **Fix:** Movido para constante fora do componente com objeto de lookup

### 4. ✅ SuperAgentRPG.tsx - Console.log removido
- **Problema:** console.log vazando em produção
- **Fix:** Removido do handleAction

### 5. ✅ Notifications.tsx - Debounce no search
- **Problema:** Cada keystroke recalcula o filtro
- **Fix:** Adicionado hook useDebounce com delay de 300ms

---

## 🟡 P2 - ACESSIBILIDADE (Aplicados)

### 6. ✅ SuperAgentRPG.tsx - aria-labels nos trainers
- **Fix:** Adicionado `role="button"` e `aria-label` com nome e especialização

### 7. ✅ TeamRPG.tsx - aria-label no botão voltar
- **Fix:** Adicionado `aria-label="Voltar para lista de clientes"`

### 8. ✅ Notifications.tsx - Memoizar handlers
- **Fix:** handleMarkAllRead, handleDeleteAlert com useCallback

---

## 🟢 P3 - PRÓXIMA SPRINT (Pendentes)

### 9. ⏳ TeamRPG.tsx - Deep clone no handleUpdatePrompt
- **Problema:** Recria TODOS os squads a cada keystroke
- **Solução:** Usar Immer para updates imutáveis eficientes
- **Esforço:** Médio

### 10. ⏳ TeamRPG.tsx - Promise.allSettled
- **Problema:** Uma falha no load cancela todos os squads
- **Solução:** Usar Promise.allSettled para resiliência
- **Esforço:** Baixo

### 11. ⏳ SuperAgentRPG.tsx - Responsividade
- **Problema:** Container fixo 600x600px inutilizável em mobile
- **Solução:** CSS Grid adaptativo ou transformar em lista em mobile
- **Esforço:** Alto

### 12. ⏳ SuperAgentRPG.tsx - Modal acessível
- **Problema:** Modal sem role="dialog", trap de foco
- **Solução:** Adicionar atributos ARIA e useFocusTrap
- **Esforço:** Médio

### 13. ⏳ TeamRPG.tsx - Memoizar filtro de squads
- **Problema:** Recalcula clientSquads todo render
- **Solução:** useMemo com dependências corretas
- **Esforço:** Baixo

### 14. ⏳ Notifications.tsx - Substituir confirm() nativo
- **Problema:** window.confirm() bloqueante e fora do design system
- **Solução:** Componente de modal de confirmação
- **Esforço:** Médio

---

## 📈 Score Estimado Pós-Fixes

| Componente | Antes | Depois (P0-P2) | Meta (P3) |
|------------|-------|----------------|-----------|
| Notifications | 6.5 | 7.5 | 8.5 |
| SuperAgentRPG | 6.2-6.5 | 7.5 | 8.5 |
| TeamRPG | 6.5 | 7.0 | 8.0 |

---

## 🚀 Como Aplicar P3

```bash
# Instalar Immer para TeamRPG
npm install immer

# Componente de Modal acessível (se não existir)
# Verificar se já existe em src/components/ui/Modal.tsx
```
