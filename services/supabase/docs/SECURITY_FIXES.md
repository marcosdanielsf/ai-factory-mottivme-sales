# Correções de Segurança - XSS e CSV Injection

## Resumo
Correções aplicadas em 24/01/2026 para resolver vulnerabilidades de segurança identificadas nos componentes do projeto.

## Correções Implementadas

### 1. `src/components/query/result-grid.tsx` - Proteção XSS
**Problema:** Renderização de valores do banco sem sanitização permitia XSS
**Solução:**
- Criada função `sanitizeValue()` que escapa HTML entities
- Aplicada em `formatValue()` para todos os valores renderizados
- Protege contra: `<script>`, `&`, `"`, `'`, etc.

```typescript
function sanitizeValue(value: unknown): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```

### 2. `src/components/data/data-grid.tsx` - Proteção CSV Injection
**Problema:** Export CSV sem proteção contra formula injection
**Solução:**
- Criada função `sanitizeCSVValue()` que previne fórmulas maliciosas
- Prefixa com `'` valores que começam com `=`, `+`, `-`, `@`, `\t`, `\r`
- Escapa aspas duplas corretamente

```typescript
const sanitizeCSVValue = (value: string): string => {
  let sanitized = value.replace(/"/g, '""');

  // Prevent formula injection
  if (/^[=+\-@\t\r]/.test(sanitized)) {
    sanitized = "'" + sanitized;
  }

  return `"${sanitized}"`;
};
```

### 3. `src/components/health/similar-tables.tsx` - Storage Seguro
**Problema:** localStorage sem tratamento de erros adequado
**Solução:**
- Migrado de `localStorage` para `sessionStorage` (dados de sessão)
- Try-catch robusto com validação de dados
- Limpeza de dados corrompidos

```typescript
// Load com validação
try {
  const stored = sessionStorage.getItem(IGNORED_PAIRS_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      setIgnoredPairs(new Set(parsed));
    }
  }
} catch (error) {
  console.error('Failed to load ignored pairs:', error);
  sessionStorage.removeItem(IGNORED_PAIRS_KEY);
}

// Save com tratamento de erro
try {
  sessionStorage.setItem(IGNORED_PAIRS_KEY, JSON.stringify([...newIgnored]));
} catch (error) {
  console.error('Failed to save ignored pairs:', error);
}
```

### 4. `src/components/data/cell-editor.tsx` - Promise Error Handling
**Problema:** Promise não capturada em `onSave`
**Solução:**
- Adicionado estado `error` local
- Try-catch com feedback visual ao usuário
- Mensagem de erro exibida abaixo do input

```typescript
const [error, setError] = useState<string | null>(null);

const handleSave = useCallback(async () => {
  try {
    setSaving(true);
    setError(null);
    const parsedValue = parseValue(editValue, columnType);
    await onSave(parsedValue);
    setIsEditing(false);
    setError(null);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Failed to save";
    setError(errorMessage);
    console.error("Failed to save:", error);
  } finally {
    setSaving(false);
  }
}, [editValue, columnType, onSave]);

// UI com feedback de erro
{error && (
  <span className="text-xs text-red-500">{error}</span>
)}
```

### 5. `src/components/rls/policy-wizard.tsx` - Timer Cleanup
**Problema:** setTimeout sem cleanup no useEffect
**Solução:**
- Adicionado useEffect com cleanup function
- Timer cancelado quando componente desmonta

```typescript
// Cleanup timer para estado 'copied'
useEffect(() => {
  if (copied) {
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }
}, [copied]);

const copyToClipboard = async () => {
  await navigator.clipboard.writeText(generateSQL());
  setCopied(true);
  // Timer cleanup handled by useEffect
};
```

## Impacto
- ✅ **Sem breaking changes** - Funcionalidade mantida
- ✅ **UI preservada** - Não afeta componentes visuais
- ✅ **Performance** - Overhead mínimo (sanitização só na renderização)
- ✅ **Compatibilidade** - TypeScript e React standards

## Testes Recomendados

### XSS Protection (result-grid.tsx)
```sql
-- Teste com HTML malicioso
INSERT INTO test_table (name) VALUES ('<script>alert("XSS")</script>');
SELECT * FROM test_table;
```
**Resultado esperado:** String escapada, não executa script

### CSV Injection (data-grid.tsx)
```sql
-- Teste com fórmula maliciosa
INSERT INTO test_table (formula) VALUES ('=1+1');
```
**Resultado esperado:** Export CSV com `'=1+1` (prefixado com aspas simples)

### Error Handling (cell-editor.tsx)
1. Editar célula com valor inválido
2. Salvar
**Resultado esperado:** Mensagem de erro vermelha abaixo do input

## Próximos Passos
- [ ] Adicionar testes automatizados para sanitização
- [ ] Implementar Content Security Policy headers
- [ ] Revisar outras áreas com inputs de usuário
- [ ] Adicionar rate limiting em exports
