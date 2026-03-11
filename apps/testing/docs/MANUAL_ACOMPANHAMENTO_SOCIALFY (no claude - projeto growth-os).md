# Manual de Acompanhamento - Socialfy IA
## Para Analistas e Operadores

---

## 1. Como a IA Funciona (Visão Geral)

A Isabella (nossa IA) trabalha em **7 modos diferentes**, cada um com uma função específica:

| Modo | O que faz | Quando ativa |
|------|-----------|--------------|
| **SDR Inbound** | Recebe leads novos, qualifica, desperta interesse | Lead entra pelo tráfego/formulário |
| **Scheduler** | Agenda consultas, coleta dados, envia link de pagamento | Lead quer agendar |
| **Objection Handler** | Trata objeções (preço, marido, tempo, etc) | Lead levanta objeção |
| **Concierge** | Prepara pré-consulta, coleta feedback pós | Lead tem consulta marcada |
| **Followuper** | Reengaja leads que sumiram | Lead parou de responder |
| **Reativador** | Reativa base antiga/ex-pacientes | Campanhas de reativação |
| **Social Seller** | Atende DMs do Instagram | Interação via Instagram |

---

## 2. O Funil no Socialfy (FUP 0, 1, 2...)

### O que significa cada etapa:

```
FUP 0 (Follow-up 0) → Lead NOVO, acabou de entrar
         ↓
FUP 1 → Primeiro contato feito, aguardando resposta
         ↓
FUP 2 → Segundo follow-up enviado
         ↓
FUP 3 → Terceiro follow-up
         ↓
QUALIFICADO → Lead demonstrou interesse real
         ↓
AGENDAMENTO → Em processo de agendar
         ↓
FECHAMENTO → Pagamento/Confirmação
```

---

## 3. O que VOCÊ precisa monitorar

### 🔴 Alertas Críticos (Agir Imediato)

| Situação | O que fazer |
|----------|-------------|
| Lead pediu falar com humano | Assumir conversa AGORA |
| Lead reclamou do atendimento | Assumir e resolver |
| Lead mandou comprovante de pagamento | Confirmar e processar |
| Lead com dúvida técnica/médica específica | Escalar pro time |
| Erro da IA (resposta sem sentido) | Assumir e corrigir |

### 🟡 Monitoramento Regular

| Situação | O que fazer |
|----------|-------------|
| Leads acumulando no FUP 0 | Verificar se IA está respondendo |
| Lead não avançando há 2+ dias | Verificar conversa, talvez intervir |
| Muitos leads no mesmo estágio | Pode ser problema no fluxo |

---

## 4. Como Acompanhar no Socialfy

### Passo a Passo:

1. **Acesse o Pipeline de Leads**
   - Menu → Opportunities → Pipeline do Instituto Amare

2. **Filtre por Status**
   - FUP 0: Leads novos (IA deve contatar em até 5 min)
   - FUP 1-3: Em follow-up (IA tentando reengajar)
   - Qualificado: Prontos pra agendar
   - Agendamento: Em processo

3. **Veja as Conversas**
   - Clique no lead → Aba "Conversations"
   - Leia o histórico da IA com o lead
   - Verifique se está fluindo bem

4. **Intervenha Quando Necessário**
   - Botão "Take Over" ou responda manualmente
   - A IA para de responder quando você assume

---

## 5. Sinais de que a IA Está Funcionando Bem

✅ Leads respondem e avançam no funil
✅ Agendamentos sendo criados
✅ Objeções sendo tratadas (não simplesmente ignoradas)
✅ Tom de voz amigável e profissional
✅ Links de pagamento sendo enviados no momento certo

---

## 6. Sinais de Problema

❌ Leads acumulando sem resposta
❌ Mesma mensagem sendo enviada repetidamente
❌ IA não entendendo o que lead perguntou
❌ Lead irritado/reclamando
❌ Agendamentos não sendo criados

---

## 7. Quando VOCÊ Deve Assumir

### Assuma IMEDIATAMENTE se:
- Lead pedir explicitamente falar com humano
- Lead enviar comprovante de pagamento
- Lead reclamar do atendimento
- Lead fizer pergunta médica específica
- Conversa estiver travada há muito tempo

### Monitore de perto se:
- Lead com objeção forte (preço alto, marido não deixa)
- Lead VIP ou indicação importante
- Lead já tentou agendar antes e desistiu

---

## 8. Métricas para Acompanhar

| Métrica | Meta | Onde Ver |
|---------|------|----------|
| Tempo de primeira resposta | < 5 min | Dashboard |
| Taxa de qualificação | > 30% | Pipeline |
| Taxa de agendamento | > 20% | Pipeline |
| Leads no FUP 0 | < 10 por dia | Pipeline |

---

## 9. Fluxo Visual

```
LEAD ENTRA (Tráfego/Instagram/Indicação)
            ↓
    [IA - SDR INBOUND]
    Qualifica e desperta interesse
            ↓
         Interesse?
        /         \
      SIM         NÃO
       ↓           ↓
[IA - SCHEDULER]  [IA - FOLLOWUPER]
  Agenda consulta   Tenta reengajar
       ↓                 ↓
    Objeção?         Respondeu?
      ↓                  ↓
[IA - OBJECTION]    Volta pro fluxo
  Trata objeção          ou
       ↓              Desiste
   Resolveu?
       ↓
  AGENDAMENTO
       ↓
  PAGAMENTO
       ↓
[IA - CONCIERGE]
  Prepara consulta
       ↓
   CONSULTA
       ↓
[IA - CONCIERGE]
  Coleta feedback
```

---

## 10. Dúvidas Frequentes

**P: A IA responde 24h?**
R: Sim, mas você deve monitorar no horário comercial.

**P: Como sei se a IA respondeu?**
R: Veja a conversa do lead. Mensagens da IA aparecem como "Isabella" ou "Bot".

**P: Posso editar o que a IA escreveu?**
R: Não dá pra editar, mas você pode enviar mensagem corrigindo.

**P: O que é "escalar humano"?**
R: É quando a IA identifica que precisa de intervenção humana e te notifica.

---

## Contato para Suporte Técnico

Problemas com a IA ou Socialfy? Fale com:
- **Marcos** - WhatsApp ou Slack

---

*Documento atualizado em: Janeiro/2026*
*Versão: 1.0*
