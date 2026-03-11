# SOP 04: Suporte ao Cliente

**Versão:** 1.0
**Data:** 14/01/2026
**SLA:** Definido por plano de serviço

---

## OBJETIVO

Padronizar processo de suporte ao cliente para garantir resolução rápida e satisfação.

---

## NÍVEIS DE SUPORTE

### Nível 1: Suporte Básico (Ticket)

**Cobertura:** Todos os planos
**Canais:** Email, WhatsApp Business
**SLA:** Resposta em 24h
**Escopo:** Dúvidas de uso, problemas básicos

**Responsabilidades:**
- Tirar dúvidas sobre como usar a plataforma
- Resolver problemas de acesso ao dashboard
- Ajudar com configurações simples
- Documentar bugs e solicitações de melhoria

**Exemplos:**
- "Como acesso o CRM?"
- "Esqueci minha senha"
- "Como configuro uma nova tag?"

---

### Nível 2: Suporte Prioritário (WhatsApp)

**Cobertura:** Planos Growth e Scale
**Canais:** WhatsApp dedicado
**SLA:** Resposta em 12h
**Escopo:** Problemas operacionais, ajustes de IA

**Responsabilidades:**
- Ajustes de personalidade da IA
- Correção de bugs em produção
- Alterações de regras de negócio
- Otimização de conversas

**Exemplos:**
- "A IA está muito formal, preciso ajustar"
- "A IA está confundindo homens com mulheres"
- "Preciso adicionar uma nova objeção ao script"

---

### Nível 3: Suporte Dedicado (Gerente)

**Cobertura:** Plano Scale
**Canais:** WhatsApp + Telefone + Email
**SLA:** Resposta em 4h
**Escopo:** Problemas críticos, estratégia, evolução

**Responsabilidades:**
- Gerente de sucesso dedicado
- Reuniões semanais de review
- Proatividade em sugestões de melhoria
- Participação em planejamento estratégico

**Exemplos:**
- "Preciso escalar operação para 10x"
- "Quero adicionar novo canal de captação"
- "Preciso relatório personalizado"

---

## FLUXO DE ATENDIMENTO

### 1. Recebimento da Solicitação

```
Cliente envia mensagem
  ↓
Triagem inicial (Nível 1/2/3?)
  ↓
Categorização (Tipo de problema)
  ↓
Atribuição (Quem resolve?)
  ↓
SLA definido (Quando responder?)
```

### 2. Categorização de Problemas

| Categoria | Subtipo | Prioridade | Nível | Escalonamento |
|-----------|---------|------------|-------|---------------|
| **Acesso** | Login/Senha | Alta | 1 | Imediato |
| | Dashboard lento | Média | 1 | 4h |
| **IA** | Personalidade | Média | 2 | 12h |
| | Não responde | Alta | 2 | 4h |
| | Erro crasso | Alta | 2 | Imediato |
| **CRM** | Campos custom | Baixa | 1 | 24h |
| | Pipeline não move | Alta | 2 | 4h |
| **Integração** | WhatsApp caiu | Crítica | 2/3 | Imediato |
| | Instagram erro | Alta | 2 | 4h |
| **Feature** | Nova funcionalidade | Baixa | 3 | Roadmap |
| | Melhoria existente | Média | 3 | Planning |

### 3. SLA por Prioridade

| Prioridade | Definição | Exemplo | SLA Resposta | SLA Resolução |
|-----------|-----------|---------|---------------|---------------|
| **Crítica** | Sistema parado | WhatsApp caiu | 30 min | 4h |
| **Alta** | Impacto forte | IA não responde | 2h | 8h |
| **Média** | Impacto moderado | Ajuste personalidade | 12h | 48h |
| **Baixa** | Sem impacto | Dúvida de uso | 24h | 72h |

---

## PROCESSO DE RESOLUÇÃO

### Etapa 1: Triagem (5-10 min)

**Coletar informações:**
1. Nome do cliente e plano
2. Descrição detalhada do problema
3. Quando começou?
4. Já aconteceu antes?
5. Prints ou evidências

**Classificar:**
- [ ] É bug ou dúvida?
- [ ] É crítico ou pode esperar?
- [ ] Preciso escalar para técnico?

### Etapa 2: Diagnóstico (15-30 min)

**Problemas Comuns e Soluções Rápidas:**

| Problema | Diagnóstico | Solução |
|---------|-------------|----------|
| Cliente não acessa dashboard | Senha errada / Browser | Resetar senha / Limpar cache |
| IA não responde | Workflow inativo / Webhook quebrou | Verificar n8n / Ativar workflow |
| IA muito formal | Personality config errado | Ajustar formalidade no Supabase |
| IA confunde gênero | Gender detection falhando | Corrigir lista de nomes |
| WhatsApp caiu | API token expirou | Renovar token no Meta |
| Leads não chegam | Webhook GHL desconfigurado | Reconfigurar webhook |

**Se for problema novo:**
1. Documentar detalhadamente
2. Reproduzir o erro
3. Escalar para nível técnico

### Etapa 3: Resolução (Variável)

**Problemas Simples (resolver na hora):**
- Reset de senha
- Reconfiguração webhook
- Ajuste de configuração
- Explicação de uso

**Problemas Complexos (envolver técnico):**
- Escalar para equipe técnica
- Definir prazo de resolução
- Manter cliente informado do progresso

**Problemas Críticos (ação imediata):**
- Mobilizar equipe completa
- Trabalhar em paralelo na solução
- Comunicação constante com cliente
- Compensação se aplicável

---

## COMUNICAÇÃO COM CLIENTE

### Templates de Resposta

#### Resposta Inicial (dentro do SLA)

```
Olá [NOME],

Recebemos sua solicitação sobre [ASSUNTO].

Estamos analisando e voltaremos com uma resposta até [HORÁRIO].

Caso seja urgente, pode nos chamar no [CANAL PRIORITÁRIO].

Atenciosamente,
Equipe Mottivme
```

#### Atualização de Progresso

```
Olá [NOME],

Atualização sobre sua solicitação de [ASSUNTO]:

[✅] Diagnóstico realizado
[🔄] Trabalhando na solução
Estimativa de conclusão: [DATA/HORA]

Qualquer dúvida, estou à disposição.

Atenciosamente,
[NOME ATENDENTE]
```

#### Resolução Concluída

```
Olá [NOME],

Boa notícia! Seu problema de [ASSUNTO] foi resolvido.

[O que foi feito]: [DESCRIÇÃO]

Caso o problema persista ou tenha dúvidas, estamos aqui.

Atenciosamente,
Equipe Mottivme
```

#### Escalonamento Técnico

```
Olá [NOME],

Obrigado por reportar. Analisamos sua solicitação e precisamos escalar para nossa equipe técnica.

[Descrição do problema]: [O QUE CLIENTE RELATOU]
[Impacto]: [COMO AFETA CLIENTE]

Estimativa de resposta: [PRAZO]

Manteremos você informado do progresso.

Atenciosamente,
Equipe Mottivme
```

---

## BASE DE CONHECIMENTO

### Documentar Soluções

Para cada problema resolvido, documentar:

```markdown
# [Nome do Problema]

## Descrição
[O que acontece]

## Sintomas
- [Sintoma 1]
- [Sintoma 2]

## Causa Raiz
[Por que acontece]

## Solução
Passo a passo de como resolver

## Prevenção
Como evitar que aconteça novamente

## Casos Relacionados
[Links para problemas similares]

## Data Resolução
[DD/MM/AAAA]
```

### Exemplos de Documentação

**Problema: IA Não Detecta Gênero Corretamente**

```markdown
# IA Confunde Gênero

## Descrição
A IA usa expressões femininas para homens ou vice-versa.

## Sintomas
- Homens chamados de "minha linda"
- Expressões masculinas para mulheres

## Causa Raiz
Lista de nomes no personality_config incompleta ou gender detection com erro de lógica.

## Solução
1. Atualizar lista de nomes no agent_versions.personality_config
2. Verificar função detectarGenero() no workflow n8n
3. Testar com nomes variados antes de deploy

SQL:
```sql
UPDATE agent_versions
SET personality_config = jsonb_set(
  personality_config,
  '{nomes_masculinos}',
  '["joão", "josé", ...]'::jsonb
)
WHERE agent_name = '[nome-agente]';
```

## Prevenção
- Testar sempre com nomes variados
- Manter lista de nomes atualizada
- Validar com cliente real antes de go-live

## Casos Relacionados
- IA muito formal
- Personalidade incorreta

## Data Resolução
14/01/2026
```

---

## MÉTRICAS DE SUCESSO

### KPIs de Suporte

| Métrica | Meta | Como medir |
|---------|------|------------|
| CSAT (Satisfação) | > 4.5/5 | Pesquisa pós-atendimento |
| FCR (Primeira Resolução) | > 80% | Resolvido no primeiro contato |
| Tempo Resposta | Dentro SLA | Tempo até primeira resposta |
| Tempo Resolução | Dentro SLA | Tempo até resolver completamente |
| Backlog | < 20 tickets | Tickets abertos |

### CSAT (Customer Satisfaction)

**Pesquisa pós-atendimento (enviar após resolução):**

```
Olá [NOME],

Como foi seu atendimento? Por favor, avalie de 1 a 5:

[1] 😞 Muito ruim
[2] 😕 Ruim
[3] 😐 Neutro
[4] 🙂 Bom
[5] 😊 Excelente

Comentários (opcional): [CAMPO LIVRO]

Obrigado pelo feedback!
```

---

## ESCALONAMENTO

### Quando Escalar

**Para Nível Técnico:**
- Bug não documentado
- Problema de infraestrutura
- Performance degradation
- Security issue

**Para Nível Estratégico:**
- Cliente quer cancelar
- Reclamação sobre diretor/executivo
- Oportunidade de upsell
- Risco de churn

### Processo de Escalonamento

```
Identificar necessidade
  ↓
Notificar próximo nível
  ↓
Transferir contexto completo
  ↓
Definir proprietário novo
  ↓
Acompanhar até resolução
```

---

## PROATIVIDADE

### Monitoramento Preventivo

**Diário (5 min):**
- Verificar se workflows críticos estão ativos
- Checar se há alertas de sistema
- Monitorar queue de suporte

**Semanal (30 min):**
- Revisar tickets recorrentes
- Identificar oportunidades de melhoria
- Atualizar base de conhecimento

**Mensal (2h):**
- Analisar tendências de problemas
- Revisar CSAT e identificar gaps
- Propor melhorias no produto

### Contato Proativo

**Quando entrar em contato sem ser solicitado:**
- Mudança importante no sistema
- Manutenção programada
- Nova funcionalidade relevante
- Aniversário do cliente (check-in)

---

## COMPENSAÇÃO

### Quando Compensar

- SLA violado significativamente (> 2x o prazo)
- Problema crítico com impacto financeiro
- Erro da Mottivme que causou perda ao cliente

### Tipos de Compensação

| Impacto | Compensação |
|---------|-------------|
| Leve (< 4h atraso) | Desconto 10% próxima mensalidade |
| Moderado (< 24h atraso) | Desconto 25% próxima mensalidade |
| Severo (> 24h atraso) | Mensalidade grátis |
| Crítico (perda financeira) | Creditar 2-3x o valor |

---

## FERRAMENTAS

### Sistema de Tickets

**Recomendado:** Usar GoHighLevel para internos

**Pipeline de Suporte:**
1. Novo Ticket
2. Em Triagem
3. Em Análise
4. Em Resolução
5. Aguardando Cliente
6. Resolvido
7. Fechado

**Campos obrigatórios:**
- Cliente (lookup)
- Categoria (dropdown)
- Prioridade (dropdown)
- Descrição (texto longo)
- Status (dropdown)

### Comunicação

**Interno (equipe):**
- Slack para comunicação rápida
- Documentação compartilhada (Google Docs)
- Sistema de handoff

**Externo (cliente):**
- WhatsApp Business (resposta rápida)
- Email (documentação e detalhes)
- Dashboard (visualização de status)

---

## TREINAMENTO DE EQUIPE

### Onboarding de Novo Atendente

**Dia 1:**
- [ ] Apresentação da plataforma Mottivme
- [ ] Ferramentas de suporte
- [ ] Processo de triagem
- [ ] Base de conhecimento

**Dia 2:**
- [ ] Simulações de atendimento
- [ ] Shadow de atendentes experientes
- [ ] Primeiros tickets supervisionados

**Semana 1:**
- [ ] Tickets reais com supervisão
- [ ] Feedback diário
- [ ] CSAT monitorado

**Mês 1:**
- [ ] Autonomia completa
- [ ] Meta de CSAT > 4.0
- [ ] Contribuir para base de conhecimento

---

## EVOLUÇÃO CONTÍNUA

### Retroespectiva Mensal

**Discussão:**
- O que funcionou bem?
- O que precisa melhorar?
- Quais foram os top 3 problemas?
- Quais ações tomar?

**Action Items:**
- Atualizar documentação
- Criar automações
- Treinar equipe em gaps identificados

---

*SOP 04 - Suporte ao Cliente*
*Versão 1.0 - Janeiro 2026*
