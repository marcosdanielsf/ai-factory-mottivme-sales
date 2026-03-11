# Análise de Escalabilidade - MedFlow

> Gerado em: 2026-01-16
> Status: CRÍTICO - Projeto bem posicionado, mas faltam camadas para escalar

---

## SUMÁRIO EXECUTIVO

O MedFlow tem proposta de valor **sólida** (WhatsApp ilimitado + landing pages + pipeline visual) em mercado fragmentado. **PORÉM**, está estruturado como "white-label GHL" quando deveria ser **produto SaaS próprio**.

**Problema central:** Dependência 100% da API do GHL.

Para 1.000 clínicas:
- Custos operacionais impossíveis (GHL não tem preço de volume)
- Limite de 500 sub-accounts no GHL Agency
- Zero customização no frontend
- Sem posse dos dados dos clientes

**Recomendação:** Começar com white-label GHL (ROI rápido), mas construir produto próprio em 6-12 meses.

---

## 1. INFRAESTRUTURA

### 1.1 Multi-Tenancy (CRÍTICO)

**Problema de custos:**
```
100 clínicas = 100 sub-accounts GHL
Custo: 100 x U$50 = U$5.000/mês (~R$25.000)
Receita: 100 x R$397 = R$39.700
Margem: ~37% (esperado > 70%)
```

**Solução:**
- **MVP (agora):** White-label GHL (aceitar margem baixa)
- **6 meses:** Plataforma própria (FastAPI + PostgreSQL + Evolution API)

### 1.2 Automação de Onboarding (CRÍTICO)

**Problema:**
- Tempo atual: 3-4 horas por cliente (manual)
- 50 clientes = 200 horas de setup

**Falta:**
- [ ] Snapshot automation via API
- [ ] Template engine para landing pages
- [ ] Workflow templating
- [ ] Import de base de pacientes

### 1.3 Data Warehouse

**Problema:**
- Todos os dados no GHL (sem backup, sem analytics, risco LGPD)

**Falta:**
- [ ] ETL pipeline GHL → Supabase
- [ ] Backup automático
- [ ] Anonymization para LGPD

---

## 2. PRODUTO

### 2.1 Features Faltantes vs Concorrentes

| Feature | Status | Crítico? |
|---------|--------|----------|
| Anamnese digital pré-consulta | ❌ | SIM |
| Integração com prontuário | ❌ | SIM |
| Histórico de procedimentos | ❌ | SIM |
| Alergias + contraindicações | ❌ | SIM |
| Foto do paciente | ❌ | Médio |
| Receita digital | ❌ | Médio |

### 2.2 Integrações Faltando

- [ ] MEDX/iClinic/Shosp API
- [ ] Google Calendar sync bidirecional
- [ ] Meta CAPI (rastrear ROI de ads)
- [ ] Stripe/PagSeguro

---

## 3. COMERCIAL

### 3.1 Unit Economics

```
STARTER (R$197):
- CAC: ~R$1.000
- Break-even: 5 meses
- Churn esperado: 20-30%
- LTV/CAC: 0.6 ❌

PROFESSIONAL (R$397):
- CAC recovery: 2.5 meses
- LTV/CAC: 3.2 ✅

CLINIC (R$697):
- CAC recovery: 1.4 meses
- LTV/CAC: 8.4 ✅✅
```

**Recomendação:** Eliminar Starter, focar em Professional/Clinic.

### 3.2 Canais de Aquisição

1. **Sales direto** (LinkedIn + cold email + WhatsApp)
2. **Parcerias** (MEDX, iClinic, agências médicas)
3. **Inbound** (Blog SEO, case studies)
4. **Ads** (Google/Facebook para gestores de clínicas)

---

## 4. OPERACIONAL

### 4.1 Suporte (FALTA)

- [ ] Help Center (Intercom/Zendesk)
- [ ] 6-10 vídeos tutoriais
- [ ] SLA por plano:
  - Starter: 48h email
  - Professional: 24h WhatsApp
  - Clinic: 4h prioritário
- [ ] FAQ consolidada

### 4.2 SLAs (FALTA)

- [ ] Uptime mínimo (99.5%)
- [ ] RPO/RTO (backup)
- [ ] Escalation path
- [ ] Política de refund

---

## 5. TÉCNICO

### 5.1 APIs que GHL NÃO Expõe

- ❌ Workflows API
- ❌ Pipeline API
- ❌ Landing page templates API
- ❌ Reports API agregado

**Impacto:** Impossível automatizar 100% do setup

### 5.2 Monitoramento (FALTA)

- [ ] Dashboard de saúde
- [ ] Alertas quando algo quebra
- [ ] Logging de erros
- [ ] Analytics de uso

---

## 6. ROADMAP SUGERIDO

### Fase 0: MVP (Semanas 1-4)
- 5-10 clientes pagando
- Validar product-market-fit
- **Métrica:** 3 clientes Professional, 0% churn, NPS > 50

### Fase 1: Early Growth (Meses 2-3)
- 15-20 clientes
- Automação de snapshot (CLI tool)
- Help center + vídeos
- **Revenue:** R$12-15k MRR

### Fase 2: Produto Próprio (Meses 4-6)
- Backend FastAPI + PostgreSQL
- WhatsApp via Evolution API
- Migração de clientes GHL → próprio
- **Revenue:** R$40-50k MRR

### Fase 3: Scale (Meses 7-12)
- 200+ clientes
- Marketplace de integrações
- **Revenue:** R$200-300k MRR

---

## 7. QUICK WINS (FAZER AGORA)

| Ação | Tempo | Impacto |
|------|-------|---------|
| Landing page com trial | 2 dias | Converte prospects |
| Vídeo setup 3min | 1 dia | Reduz suporte |
| SLA por plano | 1 dia | Aumenta confiança |
| Template email partnership | 2 dias | Abre canal |
| First customer story | 1 dia | Social proof |

---

## 8. INVESTIMENTO NECESSÁRIO (6 MESES)

```
MVP (Mês 1-2):           R$5.000
Product Dev (Mês 3-6):   R$40.000
Sales/Marketing:         R$10.000
─────────────────────────────────
TOTAL:                   ~R$55.000

Break-even: ~30 clientes Professional
```

---

## 9. RISCOS CRÍTICOS

1. **Dependência GHL** → Começar produto próprio AGORA
2. **Onboarding manual** → Automação em 2 semanas
3. **Sem data warehouse** → Supabase ingestion urgente
4. **Diferenciação fraca** → Focar em exclusivos

---

## 10. CONCLUSÃO

**MedFlow TEM potencial:**
- ✅ Mercado validado
- ✅ Proposta forte
- ✅ Materiais prontos
- ✅ Stack certo

**MAS precisa resolver:**
- ❌ Multi-tenancy (custos impossíveis)
- ❌ Automação (horas perdidas)
- ❌ Data warehouse (lock-in)
- ❌ Suporte/SLA (churn alto)

**Se não fizer:** Moat desaparece em 6 meses, vira reseller de GHL.

---

*Relatório gerado por análise de subagente*
*Data: 2026-01-16*
