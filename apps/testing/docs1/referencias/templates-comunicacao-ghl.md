---
---

::: v-pre

# Templates de Comunicacao - MOTTIVME CRM

**Versao:** 1.0
**Data:** 14/01/2026
**Para uso no:** GoHighLevel

---

## 1. WHATSAPP TEMPLATES

### 1.1 Primeiro Contato - Inbound

**Nome:** `primeiro-contato-inbound`
**Trigger:** Novo lead via formulario/site

```
Ola {{ contact.first_name }}!

Aqui e a equipe MOTTIVME. Recebi sua mensagem e fiquei muito feliz com seu interesse!

Para te ajudar da melhor forma, posso fazer uma pergunta rapida?

Qual e o maior desafio que voce enfrenta hoje quando o assunto e crescer seu negocio com tecnologia?

Assim consigo direcionar as melhores solucoes pra voce!
```

---

### 1.2 Primeiro Contato - Outbound (Prospeccao)

**Nome:** `primeiro-contato-outbound`
**Trigger:** DM enviada via prospeccao

```
Oi {{ contact.first_name }}!

Vi seu perfil e achei muito interessante o trabalho que voce faz.

Aqui na MOTTIVME ajudamos empresas a automatizar processos e vender mais usando inteligencia artificial.

Posso te mostrar como funciona? Sem compromisso!
```

---

### 1.3 Follow-up Inicial (Sem Resposta - 24h)

**Nome:** `followup-24h`
**Trigger:** Lead nao respondeu em 24h

```
Oi {{ contact.first_name }}, tudo bem?

Enviei uma mensagem ontem e queria saber se voce teve chance de ver.

Se tiver interesse em saber como podemos ajudar seu negocio a crescer, e so me responder aqui!

Fico no aguardo.
```

---

### 1.4 Follow-up Segundo (Sem Resposta - 72h)

**Nome:** `followup-72h`
**Trigger:** Lead nao respondeu em 72h

```
{{ contact.first_name }}, ultima tentativa por aqui!

Sei que a correria do dia a dia e grande, mas queria compartilhar algo que pode te ajudar:

Temos um case de um cliente que aumentou 40% as vendas em 60 dias usando nossas solucoes.

Se tiver 5 minutos para uma conversa rapida, me avisa!
```

---

### 1.5 Lembrete Reuniao - 24h Antes

**Nome:** `lembrete-reuniao-24h`
**Trigger:** 24h antes da reuniao

```
Oi {{ contact.first_name }}!

Passando pra lembrar da nossa reuniao amanha as {{ appointment.start_time }}.

Link da chamada: {{ appointment.meeting_link }}

Alguma duvida antes da nossa conversa? Estou por aqui!
```

---

### 1.6 Lembrete Reuniao - 1h Antes

**Nome:** `lembrete-reuniao-1h`
**Trigger:** 1h antes da reuniao

```
{{ contact.first_name }}, nos encontramos em 1 hora!

Link: {{ appointment.meeting_link }}

Te espero la! 🚀
```

---

### 1.7 Pos-Reuniao (No-Show)

**Nome:** `pos-reuniao-noshow`
**Trigger:** Lead nao compareceu

```
Oi {{ contact.first_name }}, tudo bem?

Percebi que nao conseguimos nos conectar na reuniao de hoje.

Aconteceu algum imprevisto? Podemos reagendar para um horario melhor?

Me avisa quando ficar bom pra voce!
```

---

### 1.8 Pos-Reuniao (Compareceu)

**Nome:** `pos-reuniao-show`
**Trigger:** Apos reuniao realizada

```
{{ contact.first_name }}, foi otimo conversar com voce!

Conforme combinamos, vou preparar uma proposta personalizada e envio ate amanha.

Enquanto isso, qualquer duvida e so me chamar!

Abracos,
{{ user.name }}
```

---

### 1.9 Follow-up Proposta - 48h

**Nome:** `followup-proposta-48h`
**Trigger:** 48h apos envio da proposta

```
Oi {{ contact.first_name }}!

Conseguiu analisar a proposta que enviei?

Fico a disposicao pra gente conversar sobre ela ou ajustar conforme sua necessidade.

O que acha?
```

---

### 1.10 Follow-up Proposta - Urgente

**Nome:** `followup-proposta-urgente`
**Trigger:** 7 dias apos envio sem resposta

```
{{ contact.first_name }}, tudo bem?

Nao recebi seu retorno sobre a proposta.

Se o timing nao esta bom agora, me avisa que guardamos seu contato pra um momento melhor.

Ou se preferir ajustar algo na proposta, e so falar!
```

---

### 1.11 Fechamento - Parabens

**Nome:** `fechamento-parabens`
**Trigger:** Oportunidade ganha

```
🎉 {{ contact.first_name }}, seja muito bem-vindo(a) a MOTTIVME!

Estamos muito felizes em ter voce como cliente.

Nos proximos dias, nossa equipe de onboarding vai entrar em contato para iniciarmos juntos.

Qualquer duvida, conte comigo!

Abracos,
{{ user.name }}
```

---

### 1.12 Reaquecimento

**Nome:** `reaquecimento-inicial`
**Trigger:** Lead perdido volta ao funil apos 90 dias

```
Oi {{ contact.first_name }}!

Conversamos ha alguns meses atras e queria saber como estao as coisas por ai.

Temos novidades que podem fazer sentido pra voce agora. Posso te contar?
```

---

## 2. EMAIL TEMPLATES

### 2.1 Boas-vindas Inbound

**Nome:** `email-boas-vindas-inbound`
**Assunto:** Bem-vindo(a) a MOTTIVME - Vamos conversar?

```html
<p>Ola {{ contact.first_name }},</p>

<p>Obrigado por entrar em contato com a MOTTIVME!</p>

<p>Vi que voce demonstrou interesse em nossas solucoes de {{ contact.need_principal }}. Ficamos muito felizes em poder ajudar.</p>

<p>Para entender melhor como podemos acelerar os resultados do seu negocio, gostaria de agendar uma conversa rapida de 15 minutos.</p>

<p><strong>Que tal escolher um horario que funcione pra voce?</strong></p>

<p><a href="{{ calendar.link }}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Agendar Conversa</a></p>

<p>Se preferir, pode responder este email e combinamos.</p>

<p>Abracos,<br>
{{ user.name }}<br>
MOTTIVME</p>
```

---

### 2.2 Proposta Comercial

**Nome:** `email-proposta-comercial`
**Assunto:** Sua proposta personalizada - MOTTIVME

```html
<p>Ola {{ contact.first_name }},</p>

<p>Conforme conversamos, segue sua proposta personalizada.</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Solucao</strong></td>
    <td style="padding: 12px; border: 1px solid #dee2e6;">{{ opportunity.produto_interesse }}</td>
  </tr>
  <tr>
    <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Investimento</strong></td>
    <td style="padding: 12px; border: 1px solid #dee2e6;">R$ {{ opportunity.monetary_value }}/mes</td>
  </tr>
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 12px; border: 1px solid #dee2e6;"><strong>Modelo</strong></td>
    <td style="padding: 12px; border: 1px solid #dee2e6;">{{ opportunity.recorrencia }}</td>
  </tr>
</table>

<p><a href="{{ proposal.link }}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Ver Proposta Completa</a></p>

<p>Estou a disposicao para esclarecer qualquer duvida ou ajustar a proposta conforme sua necessidade.</p>

<p>Abracos,<br>
{{ user.name }}<br>
MOTTIVME</p>
```

---

### 2.3 Follow-up Proposta

**Nome:** `email-followup-proposta`
**Assunto:** Re: Sua proposta personalizada - MOTTIVME

```html
<p>Ola {{ contact.first_name }},</p>

<p>Espero que esteja tudo bem!</p>

<p>Enviei sua proposta ha alguns dias e gostaria de saber se teve chance de analisar.</p>

<p><strong>Algumas duvidas comuns que posso esclarecer:</strong></p>

<ul>
  <li>Como funciona o processo de implementacao?</li>
  <li>Quanto tempo leva para ver os primeiros resultados?</li>
  <li>E possivel ajustar o escopo ou valores?</li>
</ul>

<p>Se preferir, podemos marcar uma ligacao rapida para conversarmos.</p>

<p><a href="{{ calendar.link }}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Agendar Conversa</a></p>

<p>Abracos,<br>
{{ user.name }}<br>
MOTTIVME</p>
```

---

### 2.4 Case de Sucesso

**Nome:** `email-case-sucesso`
**Assunto:** Como a [Empresa] aumentou [X]% em [Y] dias

```html
<p>Ola {{ contact.first_name }},</p>

<p>Quero compartilhar com voce um caso que pode te interessar.</p>

<p><strong>O desafio:</strong><br>
Uma empresa do segmento {{ contact.industry }} enfrentava dificuldades semelhantes as suas: {{ contact.pain_point }}.</p>

<p><strong>A solucao:</strong><br>
Implementamos nossa solucao de {{ contact.need_principal }} e os resultados foram:</p>

<ul>
  <li>✅ +40% em vendas nos primeiros 60 dias</li>
  <li>✅ Reducao de 8h/semana em tarefas manuais</li>
  <li>✅ ROI positivo ja no segundo mes</li>
</ul>

<p>Quer saber como podemos replicar esses resultados no seu negocio?</p>

<p><a href="{{ calendar.link }}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Agendar Diagnostico Gratuito</a></p>

<p>Abracos,<br>
{{ user.name }}<br>
MOTTIVME</p>
```

---

### 2.5 Reaquecimento

**Nome:** `email-reaquecimento`
**Assunto:** {{ contact.first_name }}, temos novidades!

```html
<p>Ola {{ contact.first_name }},</p>

<p>Conversamos ha alguns meses e, na epoca, o timing nao estava ideal para avançarmos.</p>

<p>Desde entao, lancamos novidades que podem fazer muito sentido pra voce:</p>

<ul>
  <li>🚀 Nova solucao de IA para atendimento automatizado</li>
  <li>💰 Planos mais flexiveis e acessiveis</li>
  <li>📈 Cases novos com resultados impressionantes</li>
</ul>

<p>Que tal uma conversa rapida pra te atualizar?</p>

<p><a href="{{ calendar.link }}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Quero Saber Mais</a></p>

<p>Abracos,<br>
{{ user.name }}<br>
MOTTIVME</p>
```

---

### 2.6 Confirmacao Reuniao

**Nome:** `email-confirmacao-reuniao`
**Assunto:** Confirmado! Nossa reuniao esta agendada

```html
<p>Ola {{ contact.first_name }},</p>

<p>Sua reuniao esta confirmada! Seguem os detalhes:</p>

<table style="width: 100%; border-collapse: collapse; margin: 20px 0; max-width: 400px;">
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 12px; border: 1px solid #dee2e6;">📅 <strong>Data</strong></td>
    <td style="padding: 12px; border: 1px solid #dee2e6;">{{ appointment.date }}</td>
  </tr>
  <tr>
    <td style="padding: 12px; border: 1px solid #dee2e6;">⏰ <strong>Horario</strong></td>
    <td style="padding: 12px; border: 1px solid #dee2e6;">{{ appointment.start_time }}</td>
  </tr>
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 12px; border: 1px solid #dee2e6;">💻 <strong>Link</strong></td>
    <td style="padding: 12px; border: 1px solid #dee2e6;"><a href="{{ appointment.meeting_link }}">Entrar na Reuniao</a></td>
  </tr>
</table>

<p><strong>O que vamos abordar:</strong></p>
<ul>
  <li>Entender seus desafios atuais</li>
  <li>Apresentar solucoes personalizadas</li>
  <li>Definir proximos passos</li>
</ul>

<p>Ate la!</p>

<p>{{ user.name }}<br>
MOTTIVME</p>
```

---

## 3. SMS TEMPLATES

### 3.1 Lembrete Reuniao

**Nome:** `sms-lembrete-reuniao`

```
MOTTIVME: Oi {{ contact.first_name }}! Lembrete: sua reuniao e amanha as {{ appointment.start_time }}. Link: {{ appointment.meeting_link }}
```

---

### 3.2 Confirmacao Recebimento

**Nome:** `sms-confirmacao-recebimento`

```
MOTTIVME: {{ contact.first_name }}, recebemos sua mensagem! Em breve entraremos em contato. Obrigado!
```

---

## 4. VARIAVEIS DISPONIVEIS

### Contact Fields
- `{{ contact.first_name }}`
- `{{ contact.last_name }}`
- `{{ contact.name }}`
- `{{ contact.email }}`
- `{{ contact.phone }}`
- `{{ contact.company }}`

### Custom Fields
- `{{ contact.lead_score }}`
- `{{ contact.classificacao_ia }}`
- `{{ contact.origem_lead }}`
- `{{ contact.need_principal }}`
- `{{ contact.budget_range }}`
- `{{ contact.pain_point }}`

### Opportunity Fields
- `{{ opportunity.name }}`
- `{{ opportunity.monetary_value }}`
- `{{ opportunity.produto_interesse }}`
- `{{ opportunity.recorrencia }}`

### Appointment Fields
- `{{ appointment.date }}`
- `{{ appointment.start_time }}`
- `{{ appointment.end_time }}`
- `{{ appointment.meeting_link }}`

### User Fields
- `{{ user.name }}`
- `{{ user.email }}`
- `{{ user.phone }}`

---

*Templates criados para MOTTIVME - Janeiro 2026*

:::
