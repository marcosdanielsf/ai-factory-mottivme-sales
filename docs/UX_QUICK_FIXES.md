# 🛠️ Quick Fixes de UX - Implementação Rápida

Correções que podem ser aplicadas em < 30min cada.

---

## 1. Aria-labels em botões de ícone

### Arquivo: `src/components/Layout.tsx`

```tsx
// Linha ~98 - Botão de notificações
<button 
  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
  className="..."
  aria-label="Abrir notificações"  // ← ADICIONAR
  aria-expanded={isNotificationsOpen}  // ← ADICIONAR
>
  <Bell size={18} />
  ...
</button>

// Linha ~158 - Botão de fechar modal
<button 
  onClick={() => setIsSearchOpen(false)}
  className="..."
  aria-label="Fechar busca"  // ← ADICIONAR
>
  <X size={20} />
</button>
```

### Arquivo: `src/pages/Dashboard.tsx`

```tsx
// Linha ~148 - Botão refresh
<button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className="..."
  aria-label="Atualizar indicadores"  // ← ADICIONAR
>
  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
</button>
```

---

## 2. Limitar toasts a 3 simultâneos

### Arquivo: `src/hooks/useToast.tsx`

```tsx
const showToast = useCallback((message: string, type: ToastType = 'info') => {
  const id = Math.random().toString(36).substring(2, 9);
  
  setToasts((prev) => {
    // ADICIONAR: Limitar a 3 toasts
    const newToasts = [...prev, { id, message, type }];
    if (newToasts.length > 3) {
      return newToasts.slice(-3); // Mantém apenas os 3 mais recentes
    }
    return newToasts;
  });

  setTimeout(() => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, 4000);
}, []);
```

---

## 3. Focus-visible global

### Arquivo: `src/index.css`

```css
/* ADICIONAR no final */

/* Focus visible para acessibilidade */
:focus {
  outline: none;
}

:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Remove focus ring em elementos não interativos */
[tabindex="-1"]:focus-visible {
  outline: none;
}
```

---

## 4. Touch targets mínimos

### Arquivo: `src/components/supervision/ConversationList.tsx`

```tsx
// Linha ~120 - Link do Instagram
<a
  href={...}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()}
  className="text-pink-400 hover:text-pink-300 transition-colors flex-shrink-0 p-1 -m-1"  // ← ADICIONAR p-1 -m-1 para área clicável maior
  title={`@${conversation.instagram_username}`}
>
  <Instagram size={12} />
</a>
```

### Regra geral para botões de ícone

```tsx
// Padrão mínimo para touch targets
className="p-2 min-h-11 min-w-11 flex items-center justify-center"
// min-h-11 = 44px (mínimo recomendado para touch)
```

---

## 5. Indicador de clicável nos MetricCards

### Arquivo: `src/components/MetricCard.tsx`

```tsx
// Linha ~40 - Adicionar indicador visual
{isClickable && (
  <span className="text-[10px] text-accent-primary mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
    Clique para detalhes →
  </span>
)}

// Também adicionar 'group' na div principal:
<div 
  className={`group bg-bg-secondary ... ${isClickable ? 'cursor-pointer hover:...' : ''}`}
>
```

---

## 6. Estado vazio com CTA na Supervisão

### Arquivo: `src/components/supervision/ConversationList.tsx`

```tsx
// Linha ~60 - Melhorar empty state
if (conversations.length === 0) {
  return (
    <div className="flex-1 flex items-center justify-center p-6 md:p-8 text-center">
      <div>
        <MessageSquare size={40} className="mx-auto text-text-muted mb-4" />
        <p className="text-text-secondary text-sm md:text-base">Nenhuma conversa encontrada</p>
        <p className="text-xs md:text-sm text-text-muted mt-1 mb-4">
          Ajuste os filtros ou aguarde novas conversas
        </p>
        {/* ADICIONAR CTAs */}
        <div className="flex gap-2 justify-center">
          <button 
            onClick={() => {/* limpar filtros */}}
            className="px-3 py-1.5 text-xs bg-bg-hover hover:bg-border-default rounded-lg text-text-secondary"
          >
            Limpar filtros
          </button>
          <button 
            onClick={() => {/* refresh */}}
            className="px-3 py-1.5 text-xs bg-accent-primary/10 hover:bg-accent-primary/20 rounded-lg text-accent-primary"
          >
            Atualizar lista
          </button>
        </div>
      </div>
    </div>
  );
}
```

---

## 7. Toast position no mobile

### Arquivo: `src/hooks/useToast.tsx`

```tsx
// Linha ~30 - Container do toast
<div className="fixed bottom-4 right-4 md:bottom-4 md:right-4 top-4 left-4 right-4 md:top-auto md:left-auto z-[9999] flex flex-col gap-2 pointer-events-none items-center md:items-end">
```

Ou usar media query:

```tsx
<div className={`fixed z-[9999] flex flex-col gap-2 pointer-events-none ${
  isMobile 
    ? 'top-4 left-4 right-4 items-center' 
    : 'bottom-4 right-4 items-end'
}`}>
```

---

## 8. Atalho Cmd+Enter no MessageComposer

### Arquivo: `src/components/supervision/MessageComposer.tsx`

Se ainda não existir, adicionar:

```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
    e.preventDefault();
    handleSend();
  }
};

// No textarea:
<textarea
  onKeyDown={handleKeyDown}
  ...
/>

// Adicionar hint visual:
<span className="text-[10px] text-text-muted">
  {isMac ? '⌘' : 'Ctrl'}+Enter para enviar
</span>
```

---

## Checklist de Implementação

- [ ] Aria-labels em Layout.tsx
- [ ] Aria-labels em Dashboard.tsx  
- [ ] Limite de 3 toasts
- [ ] Focus-visible no CSS
- [ ] Touch targets na ConversationList
- [ ] Indicador clicável no MetricCard
- [ ] Empty state com CTAs
- [ ] Toast position mobile (opcional)
- [ ] Atalho Cmd+Enter (opcional)

**Tempo estimado total:** ~2-3 horas

---

*Estas são correções rápidas que melhoram significativamente a experiência do usuário com mínimo esforço.*
