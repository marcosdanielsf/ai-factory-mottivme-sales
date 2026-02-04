# INSIGHTS - Vertical Médico (MedFlow)

> Descobertas, aprendizados e decisões importantes
> Última atualização: 2026-01-16 12:30

---

## 2026-01-16 - Pesquisa de Mercado Completa

### Resumo dos Concorrentes

| Sistema | Preço médio | WhatsApp | Nota RA | Ponto forte |
|---------|-------------|----------|---------|-------------|
| MEDX | R$350/mês | 50-100 msg (não oficial) | 7.5 | Robô THAIS |
| iClinic | R$250/mês | Pacotes caros | 5.8 | Tags/segmentação |
| Doctoralia | R$529/mês | Ilimitado (Plus+) | 7.1 | Marketplace/captação |
| Shosp | R$149/mês + addon | Add-on R$60/mês | 7.6 | API aberta |
| Feegow | R$199/mês | Via Doctoralia | 7.1 | Integração TISS |

### Campos Padrão do Mercado (interseção)

Todos os sistemas exigem:
- ✅ Nome completo
- ✅ Telefone/Celular
- ✅ Data de nascimento
- ✅ Email (opcional em alguns)
- ✅ CPF (MEDX, Shosp, Feegow)
- ✅ Convênio/Plano de saúde
- ✅ Sexo/Gênero (iClinic)
- ✅ Observações

**Ação:** Nosso snapshot já tem esses campos ✓

### Automações Padrão do Mercado

O que TODOS oferecem:
1. Confirmação/lembrete de consulta (24h antes)
2. Remarcação/cancelamento via link
3. Lembrete de retorno pós-consulta
4. Mensagem de aniversário
5. Pesquisa de satisfação/NPS
6. Campanhas de reativação
7. Lista de espera

**Ação:** Nosso snapshot já tem 8 workflows que cobrem tudo isso ✓

### GAPS IDENTIFICADOS (Nossa Vantagem)

| Gap | Nenhum tem | Nós temos |
|-----|------------|-----------|
| WhatsApp ilimitado | ❌ | ✅ GHL API |
| Integração Google/Meta Ads | ❌ | ✅ CAPI nativo |
| Landing pages | ❌ (só Doctoralia) | ✅ Funnels |
| Pipeline visual | ❌ | ✅ Pipelines GHL |
| Automações avançadas | 🟡 básicas | ✅ Workflows ilimitados |
| Zapier/Make | ❌ | ✅ Nativo |
| Chatbot IA | 🟡 só MEDX | ✅ Conversation AI |
| Segmentação comportamento | 🟡 limitada | ✅ Completa |
| Dashboard marketing | ❌ | ✅ Reports |

### Preço de Mercado

- Pequeno (1 prof): R$150-300/mês
- Médio (5 prof): R$350-600/mês
- Grande (10+ prof): R$550-1.000/mês

**Nossa estratégia:** Posicionar no meio-baixo com muito mais valor
- Starter R$197 (vs iClinic R$250)
- Professional R$397 (vs MEDX R$350, mas WhatsApp ilimitado)
- Clinic R$697 (vs Doctoralia R$679, mas muito mais completo)

### Pontos Fracos dos Concorrentes (Explorar)

1. **iClinic:** Nota 5.8 no RA - instabilidade e suporte péssimo
2. **MEDX:** WhatsApp não oficial pode ser bloqueado
3. **Doctoralia:** Muito caro para o que entrega (foco em marketplace)
4. **Shosp:** WhatsApp é add-on caro (R$60 + R$100 ativação)
5. **Todos:** Nenhum rastreia origem de leads/ROI de ads

---

## 2026-01-16 - Setup Inicial

### Sobre a API do GHL

**Funciona via API:**
- Custom Fields ✅
- Tags ✅

**NÃO funciona via API:**
- Pipelines ❌ (criar manual)
- Calendários ❌ (criar manual)
- Workflows ❌ (criar manual)

**Insight:** Snapshot automatiza ~70% do setup.

### Decisões de Posicionamento

1. **Não competir com prontuário** - Regulação CFM, complexidade alta
2. **Complementar sistema existente** - "Use o prontuário que você já tem"
3. **Focar em captação e relacionamento** - Gap claro no mercado
4. **WhatsApp ilimitado como diferencial** - Dor real dos concorrentes

---

## 2026-01-16 - Análise de Escalabilidade

### Problema Central: Dependência do GHL

O MedFlow está estruturado como white-label GHL, mas isso não escala:

```
100 clínicas = R$25.000/mês custo GHL
100 clínicas = R$39.700/mês receita
Margem: 37% (esperado > 70%)
```

### Unit Economics por Plano

| Plano | LTV/CAC | Viável? |
|-------|---------|---------|
| Starter R$197 | 0.6 | ❌ Não |
| Professional R$397 | 3.2 | ✅ Sim |
| Clinic R$697 | 8.4 | ✅✅ Ótimo |

**Decisão:** Eliminar ou reposicionar Starter. Focar em Professional/Clinic.

### Roadmap para Escalar

1. **Agora:** White-label GHL (aceitar margem baixa, validar PMF)
2. **Mês 4-6:** Backend próprio (FastAPI + PostgreSQL + Evolution API)
3. **Mês 7-12:** Migrar clientes para plataforma própria

### Quick Wins Identificados

- Landing page de vendas com trial (2 dias)
- Vídeo de setup 3min (1 dia)
- SLA por plano documentado (1 dia)
- Template email para parcerias (2 dias)
- Customer story do piloto (1 dia)

### Riscos Críticos

1. **Dependência GHL** - Se aumentar preço ou nerfar API, negócio morre
2. **Onboarding manual** - 3-4h por cliente não escala
3. **Sem data warehouse** - Dados presos no GHL, risco LGPD
4. **Churn previsível** - 20-30% sem success manager

### Investimento Necessário (6 meses)

```
MVP: R$5.000
Dev produto próprio: R$40.000
Sales/Marketing: R$10.000
Total: ~R$55.000
Break-even: 30 clientes Professional
```

---

## PRÓXIMOS INSIGHTS A CAPTURAR

- [ ] Feedback de clínicas piloto
- [ ] Métricas reais de uso
- [ ] Objeções de vendas encontradas
- [ ] Ajustes necessários no snapshot
- [ ] Tempo real de onboarding
- [ ] Taxa de conversão trial → pagante
