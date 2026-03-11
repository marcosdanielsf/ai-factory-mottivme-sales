# Integração Facebook Ads → Supabase

## Objetivo
Substituir o Airtable pelo Supabase no workflow de Facebook Ads para ter dados 100% precisos de ROI.

## Fluxo de Dados
```
Facebook Ads API
      ↓
  n8n Workflow
      ↓
  Supabase (fb_ads_performance)
      ↓
  JOIN com n8n_schedule_tracking (via ad_id)
      ↓
  Dashboard mostra ROI real
```

## 1. Aplicar Migration SQL

Execute no Supabase SQL Editor:
```sql
-- Arquivo: sql/025_fb_ads_integration.sql
```

## 2. Modificar Workflow n8n

### Substituir nó "Salvar no Airtable" por HTTP Request:

**Configuração do nó:**
- **Method:** POST
- **URL:** `https://bfumywvwubvernvhjehk.supabase.co/rest/v1/fb_ads_performance`
- **Authentication:** Generic Credential Type → Header Auth
  - Name: `apikey`
  - Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmdW15d3Z3dWJ2ZXJudmhqZWhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE0MDM3OTksImV4cCI6MjA2Njk3OTc5OX0.60VyeZ8XaD6kz7Eh5Ov_nEeDtu5woMwMJYgUM-Sruao`

**Headers adicionais:**
- `Authorization`: `Bearer {mesma key acima}`
- `Content-Type`: `application/json`
- `Prefer`: `resolution=merge-duplicates` (para UPSERT)

**Body (JSON):**
```json
{
  "ad_id": "{{ $json['Ad ID'] }}",
  "ad_name": "{{ $json['Ad Name'] }}",
  "campaign_name": "{{ $json['Campaign Name'] }}",
  "adset_name": "{{ $json['AdSet Name'] }}",
  "effective_status": "{{ $json['Active Status'] }}",
  "impressions": {{ $json['Impressions'] || 0 }},
  "clicks": {{ $json['Clicks'] || 0 }},
  "spend": {{ $json['Spend'] || 0 }},
  "cpc": {{ $json['CPC'] || 0 }},
  "cpm": {{ $json['CPM'] || 0 }},
  "conversas_iniciadas": {{ $json['Conversas Iniciadas'] || 0 }},
  "custo_por_conversa": {{ $json['Custo por Conversa'] || 0 }},
  "mensagens_profundidade_2": {{ $json['Mensagens com Profundidade 2 (usuário enviou 2+ mensagens)'] || 0 }},
  "primeira_resposta": {{ $json['Primeira Resposta (você respondeu)'] || 0 }},
  "custo_primeira_resposta": {{ $json['Custo por Primeira Resposta'] || 0 }},
  "custo_msg_profundidade_2": {{ $json['Custo por Mensagem Profundidade 2'] || 0 }},
  "video_id": "{{ $json['Video ID'] }}",
  "data_relatorio": "{{ $json['Date'] }}",
  "account_name": "{{ $json['Account Name'] }}"
}
```

## 3. Alternativamente: Usar RPC Function

Se preferir usar a função de UPSERT criada:

**URL:** `https://bfumywvwubvernvhjehk.supabase.co/rest/v1/rpc/upsert_fb_ad_performance`

**Body:**
```json
{
  "p_ad_id": "{{ $json['Ad ID'] }}",
  "p_ad_name": "{{ $json['Ad Name'] }}",
  "p_campaign_name": "{{ $json['Campaign Name'] }}",
  "p_adset_name": "{{ $json['AdSet Name'] }}",
  ...
}
```

## 4. Views Disponíveis

Após aplicar a migration, você terá:

| View | Descrição |
|------|-----------|
| `vw_ads_with_leads` | JOIN de FB Ads com leads por ad_id |
| `vw_criativo_roi` | ROI agregado por criativo |
| `vw_ads_summary_by_date` | Resumo diário de gastos |

## 5. Exemplo de Query para Dashboard

```sql
-- ROI por criativo com leads e agendamentos
SELECT
  criativo,
  campanha,
  gasto,
  conversas_fb,
  leads_gerados,
  leads_agendaram,
  leads_fecharam,
  custo_por_lead,
  custo_por_agendamento,
  custo_por_venda
FROM vw_ads_with_leads
WHERE data_relatorio >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY gasto DESC;
```

## 6. Benefícios

1. **Dados 100% precisos** - direto da API do Facebook
2. **JOIN com leads** - conecta ad_id do FB com ad_id do tracking
3. **ROI real** - Gasto / Agendamentos / Vendas
4. **Histórico** - dados salvos para análise temporal
5. **Multi-tenancy** - campo location_id para filtrar por cliente

## 7. Próximos Passos

1. [ ] Aplicar migration 025 no Supabase
2. [ ] Modificar workflow n8n (trocar Airtable → Supabase)
3. [ ] Testar com um ad_id conhecido
4. [ ] Criar hook `useFacebookAdsPerformance` no frontend
5. [ ] Adicionar widget de ROI no dashboard
