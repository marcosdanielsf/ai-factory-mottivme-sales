# CONTEXT - Vertical Médico (MedFlow)

> Última atualização: 2026-01-16 18:30
> Ler este arquivo ao iniciar qualquer sessão

---

## OBJETIVO ATUAL

Validar MedFlow com clientes piloto e preparar para escala.

---

## ESTADO DO PROJETO

### Fase: MVP / Prototipagem
### Status: Materiais prontos, aguardando implementação no GHL

---

## O QUE FOI FEITO (2026-01-16)

### Pesquisa
- [x] Análise de 5 concorrentes (MEDX, iClinic, Doctoralia, Shosp, Feegow)
- [x] Identificação de 9 gaps de mercado
- [x] Consolidação em `research/competitors.json` e `research/gaps.md`

### Setup GHL (Manual)
- [x] Pipelines criados: "Jornada do Paciente", "Captação Marketing"
- [x] Calendários criados: Primeira Vez (45min), Retorno (30min), Procedimento (60min)
- [x] Snapshot v1.0 aplicado na location Dr Thauan

### Documentação Técnica
- [x] `docs/INSTRUCOES-WORKFLOWS-GHL.md` - Fase 1 (3 workflows prioritários)
- [x] `docs/INSTRUCOES-WORKFLOWS-GHL-FASE2.md` - Fase 2 (5 workflows restantes)
- [x] `docs/INSTRUCOES-FUNIL-GHL.md` - Como criar landing page no GHL
- [x] `docs/ONBOARDING-CLINICAS.md` - Manual para clínicas
- [x] `docs/ANALISE-ESCALABILIDADE.md` - Roadmap para escalar

### Materiais de Vendas
- [x] `templates/pitch-deck-medflow.html` - Apresentação 10 slides
- [x] `templates/comparativo-medflow.html` - Tabela vs concorrentes
- [x] `templates/calculadora-roi-whatsapp.html` - Calculadora interativa
- [x] `templates/landing-page-clinica.html` - Template LP
- [x] `templates/onboarding-clinicas.html` - Manual interativo
- [x] `templates/index.html` - Portal central de materiais

---

## O QUE FALTA (PRIORIDADES)

### Urgente (Semana 1-2)
1. [ ] Criar workflows no GHL (seguir `docs/INSTRUCOES-WORKFLOWS-GHL.md`)
2. [ ] Criar funil no GHL (seguir `docs/INSTRUCOES-FUNIL-GHL.md`)
3. [ ] Definir SLA de suporte por plano
4. [ ] Landing page de vendas do MedFlow (com trial)
5. [ ] Fechar primeiro cliente piloto

### Curto Prazo (Mês 1-2)
1. [ ] Help center com vídeos
2. [ ] Script de automação de onboarding
3. [ ] Sales playbook documentado
4. [ ] 3-5 clientes pagando

### Médio Prazo (Mês 3-6)
1. [ ] Backend próprio (FastAPI + PostgreSQL)
2. [ ] WhatsApp via Evolution API (não depender GHL)
3. [ ] Data warehouse no Supabase
4. [ ] 50+ clientes

---

## DADOS IMPORTANTES

### Location Piloto
- **Nome:** Dr Thauan
- **ID:** Rre0WqSlmAPmIrURgiMf

### Pricing
| Plano | Preço | Target |
|-------|-------|--------|
| Essencial | R$197/mês | Consultório individual |
| Profissional | R$397/mês | Clínica pequena/média |
| Premium | R$697/mês | Clínica multi-médicos |

### Diferenciais vs Concorrentes
1. WhatsApp ILIMITADO (concorrentes limitam 50-100/mês)
2. Landing pages inclusas (concorrentes cobram extra)
3. Pipeline visual (concorrentes não têm)
4. Integração Meta/Google Ads (nenhum concorrente tem)
5. Preço 30-50% menor

---

## RISCOS IDENTIFICADOS

1. **Dependência GHL** - Sem exit strategy, precisa backend próprio em 6 meses
2. **Onboarding manual** - 3-4h por cliente, não escala
3. **CAC alto** - Starter (R$197) não se paga, focar em Professional+
4. **Churn previsível** - 20-30%, precisa success manager

---

## DECISÕES TOMADAS

| Data | Decisão | Motivo |
|------|---------|--------|
| 2026-01-16 | Não competir com prontuário | Regulação CFM |
| 2026-01-16 | Posicionar como complemento | Reduz fricção |
| 2026-01-16 | Preços: R$197/R$397/R$697 | Competitivo |
| 2026-01-16 | Focar em Professional/Clinic | Starter não se paga |
| 2026-01-16 | Planejar backend próprio | Escalar sem GHL |

---

## PRÓXIMA AÇÃO

Ao retomar, verificar `todos.md` e continuar com:
1. Implementação dos workflows no GHL (funcionário)
2. Criação do funil no GHL (funcionário)
3. Fechar primeiro cliente piloto

---

## ARQUIVOS CHAVE

| Arquivo | Descrição |
|---------|-----------|
| `todos.md` | Lista de tarefas atualizada |
| `insights.md` | Descobertas e decisões |
| `templates/index.html` | Portal de materiais |
| `docs/ANALISE-ESCALABILIDADE.md` | Roadmap para escalar |
