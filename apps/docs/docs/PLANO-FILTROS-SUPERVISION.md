# 📋 Plano de Implementação - Filtros do Supervision Panel

**Data:** 2025-01-27  
**Autor:** Planejamento Automatizado  
**Status:** Em Análise

---

## 📊 Análise do Estado Atual

### ✅ O Que Já Existe

| Componente | Status | Observações |
|------------|--------|-------------|
| `SupervisionFilters.tsx` | ✅ Completo | UI pronta com FilterDropdown, DateRangePicker |
| `useFilterOptions.ts` | ✅ Funcional | Busca de `vw_filter_options`, tem fallback mock |
| `useSupervisionPanel.ts` | ✅ Funcional | Aplica filtros na query, polling 30s |
| `vw_supervision_conversations_v2` | ⚠️ Parcial | Campos `etapa_funil` e `usuario_responsavel` são NULL |
| `vw_filter_options` | ⚠️ Parcial | Só retorna `location` e `channel` |

### 🔴 O Que Falta

1. **SQL:** View `vw_filter_options` não retorna `etapa_funil` e `responsavel`
2. **SQL:** Campos `etapa_funil` e `usuario_responsavel` são hardcoded NULL na view
3. **Integração:** Conectar com dados reais de CRM/GHL (futuro)
4. **Filtro hasQualityIssues:** Não tem lógica no backend

---

## 🎯 Filtros a Implementar

| Filtro | Campo SQL | UI Component | Status |
|--------|-----------|--------------|--------|
| Cliente | `location_id` | FilterDropdown | ✅ Pronto |
| Canal | `channel` | FilterDropdown | ✅ Pronto |
| Etapa Funil | `etapa_funil` | FilterDropdown | ⚠️ SQL pendente |
| Responsável | `usuario_responsavel` | FilterDropdown | ⚠️ SQL pendente |
| Período | `last_message_at` | DateRangePicker | ✅ Pronto |
| Com Problemas | `has_quality_issues` | Toggle Button | ⚠️ Lógica pendente |
| Busca | `contact_name`, `phone`, `last_message` | (futuro) | 🔲 Não implementado |

---

## 📝 Plano de Implementação

### Fase 1: Completar SQL (Backend)

#### Tarefa 1.1: Expandir `vw_filter_options`
**Arquivo:** `sql/014_filter_options_complete.sql`

```sql
-- Adicionar etapas do funil e responsaveis a view de filtros
DROP VIEW IF EXISTS public.vw_filter_options;

CREATE OR REPLACE VIEW public.vw_filter_options AS

-- Clientes (locations) - mantém existente
SELECT
    'location' as filter_type,
    location_id as value,
    location_name as label,
    COUNT(DISTINCT session_id)::integer as count
FROM vw_supervision_conversations_v2
WHERE location_id IS NOT NULL
GROUP BY location_id, client_name

UNION ALL

-- Canais - mantém existente
SELECT
    'channel' as filter_type,
    channel as value,
    CASE
        WHEN channel = 'instagram' THEN 'Instagram'
        WHEN channel = 'whatsapp' THEN 'WhatsApp'
        WHEN channel = 'sms' THEN 'SMS'
        WHEN channel = 'facebook' THEN 'Facebook'
        WHEN channel = 'email' THEN 'Email'
        ELSE INITCAP(COALESCE(channel, 'Outro'))
    END as label,
    COUNT(*)::integer as count
FROM vw_supervision_conversations_v2
WHERE channel IS NOT NULL
GROUP BY channel

UNION ALL

-- Etapas do Funil (quando disponível via integração)
-- Por enquanto: valores estáticos do CRM
SELECT
    'etapa_funil' as filter_type,
    stage_id as value,
    stage_name as label,
    COUNT(*)::integer as count
FROM (
    -- Placeholder: integrar com tabela de pipelines/stages do GHL
    SELECT 
        NULL::text as stage_id,
        NULL::text as stage_name
    WHERE false
) stages
GROUP BY stage_id, stage_name

UNION ALL

-- Responsáveis (usuários do sistema)
SELECT
    'responsavel' as filter_type,
    user_id as value,
    user_name as label,
    COUNT(*)::integer as count
FROM (
    -- Placeholder: integrar com tabela de usuários
    SELECT 
        NULL::text as user_id,
        NULL::text as user_name
    WHERE false
) users
GROUP BY user_id, user_name;
```

#### Tarefa 1.2: Adicionar campo `has_quality_issues`
**Arquivo:** `sql/015_quality_issues_flag.sql`

```sql
-- Adicionar coluna para marcar problemas de qualidade
ALTER TABLE public.supervision_states 
ADD COLUMN IF NOT EXISTS has_quality_issues BOOLEAN DEFAULT false;

ALTER TABLE public.supervision_states 
ADD COLUMN IF NOT EXISTS quality_issue_reason TEXT;

-- Atualizar view para incluir o campo
-- ... (adicionar na vw_supervision_conversations_v2)
```

---

### Fase 2: Integração com CRM/GHL (Futuro)

#### Tarefa 2.1: Criar tabela de mapeamento
**Arquivo:** `sql/016_crm_mapping.sql`

```sql
-- Tabela para sincronizar dados do GHL
CREATE TABLE IF NOT EXISTS public.crm_contact_sync (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL,
    location_id TEXT,
    
    -- Dados do CRM
    crm_contact_id TEXT,
    pipeline_id TEXT,
    pipeline_name TEXT,
    stage_id TEXT,
    stage_name TEXT,
    assigned_user_id TEXT,
    assigned_user_name TEXT,
    
    -- Sync metadata
    last_synced_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(session_id)
);

CREATE INDEX idx_crm_sync_session ON public.crm_contact_sync(session_id);
CREATE INDEX idx_crm_sync_stage ON public.crm_contact_sync(stage_id);
```

#### Tarefa 2.2: Atualizar view com JOIN do CRM
**Arquivo:** Atualizar `sql/013_supervision_filters.sql`

```sql
-- Modificar vw_supervision_conversations_v2 para usar dados do CRM
...
    -- Campos do CRM
    COALESCE(crm.stage_name, NULL) as etapa_funil,
    COALESCE(crm.assigned_user_name, NULL) as usuario_responsavel,
...
LEFT JOIN public.crm_contact_sync crm ON m.session_id = crm.session_id
```

---

### Fase 3: Frontend (Ajustes Menores)

#### Tarefa 3.1: Adicionar filtro de busca textual
**Arquivo:** `src/components/supervision/SupervisionFilters.tsx`

```tsx
// Adicionar componente de busca
interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const SearchInput: React.FC<SearchInputProps> = ({ value, onChange, placeholder }) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Debounce para não sobrecarregar
  useEffect(() => {
    const timer = setTimeout(() => onChange(localValue), 300);
    return () => clearTimeout(timer);
  }, [localValue, onChange]);

  return (
    <div className="relative">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
      <input
        type="text"
        value={localValue}
        onChange={(e) => setLocalValue(e.target.value)}
        placeholder={placeholder || "Buscar..."}
        className="pl-9 pr-3 py-2 w-48 bg-bg-hover border border-transparent rounded-lg text-sm 
                   text-text-primary placeholder:text-text-muted focus:border-accent-primary focus:outline-none"
      />
    </div>
  );
};
```

#### Tarefa 3.2: Melhorar tratamento de loading
**Arquivo:** `src/hooks/useFilterOptions.ts`

```tsx
// Adicionar cache local para evitar flicker
const [cachedOptions, setCachedOptions] = useState<FilterOptionsState | null>(null);

// Usar cached enquanto carrega novos
const displayOptions = loading && cachedOptions ? cachedOptions : options;
```

---

## 📅 Cronograma Sugerido

| Fase | Tarefas | Prioridade | Estimativa |
|------|---------|------------|------------|
| **1** | SQL: Completar views | 🔴 Alta | 2h |
| **2** | Integração CRM/GHL | 🟡 Média | 4-8h |
| **3** | Frontend: Busca + Polish | 🟢 Baixa | 2h |

---

## 🔧 Arquivos a Modificar

### Novos Arquivos
```
sql/
├── 014_filter_options_complete.sql   # View completa de opções
├── 015_quality_issues_flag.sql       # Campo de problemas
└── 016_crm_mapping.sql               # Tabela de sync CRM
```

### Arquivos Existentes a Modificar
```
sql/
└── 013_supervision_filters.sql       # Adicionar JOIN com CRM

src/components/supervision/
└── SupervisionFilters.tsx            # Adicionar SearchInput

src/hooks/
├── useFilterOptions.ts               # Cache + loading melhorado
└── useSupervisionPanel.ts            # Adicionar filtro hasQualityIssues
```

---

## ✅ Checklist de Implementação

### SQL (Prioridade Alta)
- [ ] Criar `014_filter_options_complete.sql`
- [ ] Executar no Supabase
- [ ] Validar que `vw_filter_options` retorna dados reais
- [ ] Adicionar campo `has_quality_issues` na tabela

### Integração (Prioridade Média)
- [ ] Definir estrutura de sync com GHL
- [ ] Criar workflow n8n para sincronizar pipelines/stages
- [ ] Criar workflow n8n para sincronizar responsáveis
- [ ] Atualizar view com dados do CRM

### Frontend (Prioridade Baixa)
- [ ] Adicionar SearchInput com debounce
- [ ] Implementar cache em useFilterOptions
- [ ] Testar todos os filtros combinados
- [ ] Adicionar skeleton loading nos dropdowns

---

## 🎯 Critérios de Aceite

1. **Filtros funcionando:** Todos os 6 filtros aplicam corretamente na listagem
2. **Performance:** Filtragem responde em < 500ms
3. **UX:** Dropdowns mostram contagem correta de itens
4. **Fallback:** Sistema funciona mesmo sem dados do CRM (mostra filtros vazios)
5. **Persistência:** Filtros mantidos ao navegar (via URL params - futuro)

---

## 📌 Notas Importantes

### Dependências Externas
- **GHL API:** Necessária para popular etapas do funil e responsáveis
- **Workflow n8n:** Precisa de job periódico para sync do CRM

### Decisões Técnicas
1. **Filtros server-side:** Todos os filtros são aplicados no Supabase (não no frontend)
2. **Opções dinâmicas:** View `vw_filter_options` atualiza automaticamente
3. **Fallback graceful:** UI funciona mesmo com views incompletas

### Riscos
- Se GHL não tiver pipelines configurados, filtros ficam vazios
- Sync do CRM pode ficar desatualizado (mitigar com polling)
