# Templates de Mensagem - Snapshot Universal Mentores

> 14 templates prontos para uso nos workflows GHL
> Versao: 1.0.0 | Janeiro 2026

---

## Indice

1. [Primeiro Contato (Social Selling)](#01---primeiro-contato)
2. [Qualificacao BANT](#02---qualificacao-bant)
3. [Agendamento (Opcoes Binarias)](#03---agendamento)
4. [Confirmacao de Call](#04---confirmacao)
5. [Lembrete 24h (Concierge)](#05---lembrete-24h)
6. [Lembrete 3h (Concierge)](#06---lembrete-3h)
7. [Lembrete 30min (Concierge)](#07---lembrete-30min)
8. [No-Show Toque 1](#08---no-show-toque-1)
9. [No-Show Toque 2 (D+1)](#09---no-show-toque-2)
10. [No-Show Toque 3 (D+3)](#10---no-show-toque-3)
11. [Reativacao 9-Word](#11---reativacao)
12. [Pos-Call Agradecimento](#12---pos-call)
13. [Follow-up Proposta D+2](#13---follow-up-d2)
14. [Follow-up Proposta D+5](#14---follow-up-d5)

---

## 01 - Primeiro Contato

**Uso:** Social Selling / Primeiro contato com lead
**Canal:** WhatsApp
**Gatilho:** WF01 - Novo Lead Inbound

### Template:
```
Oi {{contact.first_name}}!

Vi que voce trabalha com {{custom.profissao_segmento}}, muito bacana!

Estou entrando em contato porque {{motivo_personalizado}}.

Posso te fazer uma pergunta rapida?
```

### Variacoes por Funil:

**Webinario:**
```
Oi {{contact.first_name}}!

Vi que voce se inscreveu no webinario sobre {{tema}}.

Antes de comecar, queria entender melhor sua situacao atual.

O que te levou a se inscrever?
```

**Lead Magnet:**
```
Oi {{contact.first_name}}!

Acabei de liberar seu acesso ao {{nome_material}}.

Enquanto voce le, me conta: qual o maior desafio que voce enfrenta hoje em {{area}}?
```

**Aplicacao High-Ticket:**
```
Oi {{contact.first_name}}, recebi sua aplicacao!

Antes de analisarmos seu perfil, tenho 3 perguntas rapidas.

Pode responder agora?
```

---

## 02 - Qualificacao BANT

**Uso:** Qualificar lead com perguntas estrategicas
**Canal:** WhatsApp
**Gatilho:** WF03 - Apos primeiro reply

### Template:
```
{{contact.first_name}}, para entender melhor como posso te ajudar, 3 perguntas rapidas:

1) Qual seu principal desafio hoje no negocio?

2) Voce ja investiu em alguma solucao para isso?

3) Se encontrarmos a solucao ideal, quando voce gostaria de comecar?

Responde no seu tempo!
```

### Notas de Uso:
- Enviar APOS primeiro engajamento
- Aguardar resposta completa antes de processar
- Usar respostas para calcular BANT score

---

## 03 - Agendamento

**Uso:** Oferecer opcoes de horario (tecnica binaria)
**Canal:** WhatsApp
**Gatilho:** WF03 - Lead qualificado

### Template:
```
Perfeito {{contact.first_name}}!

Que tal uma conversa de 30min para entender melhor seu cenario?

Tenho esses horarios essa semana:
- Terca ou Quinta?

Qual prefere?
```

### Variacao com Link:
```
{{contact.first_name}}, baseado no que voce me contou, acho que faz muito sentido conversarmos!

Agenda aqui o melhor horario pra voce:
{{calendar.discovery_url}}

Qual dia funciona melhor, inicio ou final da semana?
```

---

## 04 - Confirmacao

**Uso:** Confirmar agendamento realizado
**Canal:** WhatsApp
**Gatilho:** WF04 - Appointment Created

### Template:
```
Call Confirmada!

Oi {{contact.first_name}}!

Data: {{appointment.date}}
Horario: {{appointment.time}}
Link: {{appointment.meeting_link}}

Importante:
- Teste o audio/video antes
- Esteja em local silencioso
- Anote suas principais duvidas

Ate la!
```

### Notas:
- Enviar IMEDIATAMENTE apos agendamento
- Incluir link de acesso
- Reforcar instrucoes de preparacao

---

## 05 - Lembrete 24h

**Uso:** Concierge Protocol - Toque 1
**Canal:** WhatsApp
**Gatilho:** WF04 - 24h antes da call

### Template:
```
Oi {{contact.first_name}}!

Lembrete: nossa conversa e *amanha*!

{{appointment.date}} as {{appointment.time}}
{{appointment.meeting_link}}

Pode confirmar sua presenca?
- SIM, estarei la
- Preciso reagendar
```

### Notas:
- Pedir confirmacao explicita
- Processar resposta para atualizar status

---

## 06 - Lembrete 3h

**Uso:** Concierge Protocol - Toque 2
**Canal:** WhatsApp
**Gatilho:** WF04 - 3h antes da call

### Template:
```
{{contact.first_name}}, faltam 3 horas!

Nossa conversa e as {{appointment.time}}.

Link de acesso: {{appointment.meeting_link}}

Nos vemos em breve!
```

---

## 07 - Lembrete 30min

**Uso:** Concierge Protocol - Toque 3
**Canal:** WhatsApp
**Gatilho:** WF04 - 30min antes da call

### Template:
```
{{contact.first_name}}, comecaremos em 30 min!

{{appointment.meeting_link}}

Ja estou te esperando!
```

---

## 08 - No-Show Toque 1

**Uso:** Recuperacao imediata de no-show
**Canal:** WhatsApp
**Gatilho:** WF05 - No Show detectado

### Template:
```
Oi {{contact.first_name}},

Estou no horario da nossa call mas nao te vi entrar...

Aconteceu alguma coisa?

Posso aguardar mais uns 5 min ou prefere remarcar?
```

### Notas:
- Tom compreensivo, NAO acusatorio
- Oferecer alternativa imediata
- Enviar nos primeiros 5-10 min apos no-show

---

## 09 - No-Show Toque 2

**Uso:** Follow-up D+1 apos no-show
**Canal:** WhatsApp
**Gatilho:** WF05 - 24h apos no-show

### Template:
```
Oi {{contact.first_name}}, tudo bem?

Ontem nao conseguimos nos conectar. Espero que esteja tudo bem!

Posso reagendar para essa semana?

Qual dia funciona melhor?
```

---

## 10 - No-Show Toque 3

**Uso:** Ultima tentativa antes de esfriar lead
**Canal:** WhatsApp
**Gatilho:** WF05 - 72h apos no-show

### Template:
```
{{contact.first_name}}, ultima tentativa!

Ainda tenho interesse em conversar sobre {{custom.dor_principal}}.

Se nao fizer sentido agora, sem problemas! Me avisa?

Assim posso liberar o espaco para outras pessoas.
```

### Notas:
- Tom final mas respeitoso
- Usar "escassez" sutil (liberar espaco)
- Se nao responder, marcar como cold lead

---

## 11 - Reativacao

**Uso:** 9-Word Message (Dean Jackson)
**Canal:** WhatsApp
**Gatilho:** WF07 - Leads inativos 7+ dias

### Template:
```
Oi {{contact.first_name}}, voce ainda quer ajuda com {{custom.dor_principal}}?
```

### Variacoes:
```
{{contact.first_name}}, voce ainda ta buscando {{objetivo}}?
```

```
Oi {{contact.first_name}}, ainda faz sentido conversarmos?
```

### Notas:
- Mensagem CURTA propositalmente
- Provoca resposta (sim ou nao)
- Alta taxa de resposta em leads mortos

---

## 12 - Pos-Call

**Uso:** Agradecimento apos call realizada
**Canal:** WhatsApp
**Gatilho:** WF06 - Appointment Showed

### Template:
```
{{contact.first_name}}, muito obrigado pela conversa!

Foi otimo conhecer mais sobre seu negocio e seus desafios.

Conforme conversamos, vou te enviar {{proximo_passo}}.

Qualquer duvida, estou por aqui!
```

### Variacoes por Contexto:

**Pos-Discovery:**
```
{{contact.first_name}}, adorei nossa conversa!

Ficou claro pra mim que {{insight_principal}}.

Vou preparar uma proposta personalizada e te envio ate {{prazo}}.

Enquanto isso, alguma duvida?
```

**Pos-Sessao Estrategica:**
```
{{contact.first_name}}, que sessao incrivel!

Seu diagnostico ficou pronto - vou enviar agora junto com a proposta.

Analisa com calma e me fala qualquer duvida!
```

---

## 13 - Follow-up D+2

**Uso:** Primeiro follow-up de proposta
**Canal:** WhatsApp
**Gatilho:** WF06 - 48h apos envio de proposta

### Template:
```
Oi {{contact.first_name}}!

Passando para saber se conseguiu analisar a proposta que enviei.

Alguma duvida que posso esclarecer?

Fico no aguardo!
```

---

## 14 - Follow-up D+5

**Uso:** Segundo follow-up + descoberta de objecao
**Canal:** WhatsApp
**Gatilho:** WF06 - 5 dias apos envio de proposta

### Template:
```
{{contact.first_name}}, ja faz alguns dias que conversamos.

Sei que a decisao e importante e respeito seu tempo.

Me conta: o que falta para voce decidir?

A) Preco
B) Prazo
C) Preciso de mais informacoes
D) Nao vou seguir agora
```

### Notas:
- Opcoes ajudam a identificar objecao
- Tom respeitoso, sem pressao
- Se responder D, agradecer e mover para nurturing

---

## Boas Praticas

### 1. Personalizacao
- SEMPRE usar {{contact.first_name}}
- Incluir dados especificos quando disponivel
- Evitar mensagens genericas

### 2. Timing
- Respeitar horarios comerciais
- Nao enviar em feriados
- Delay minimo de 1h entre mensagens automaticas

### 3. Tom de Voz
- Consultivo, nao vendedor
- Profissional mas humano
- Sem CAPS LOCK ou excesso de emojis

### 4. Call to Action
- Sempre ter uma pergunta ou acao clara
- Evitar mensagens que nao pedem resposta
- Facilitar a resposta (opcoes, sim/nao)

### 5. Compliance
- Respeitar LGPD
- Ter opt-out disponivel
- Nao enviar spam

---

## Variaveis Disponiveis no GHL

| Variavel | Descricao |
|----------|-----------|
| `{{contact.first_name}}` | Primeiro nome |
| `{{contact.last_name}}` | Sobrenome |
| `{{contact.phone}}` | Telefone |
| `{{contact.email}}` | Email |
| `{{custom.campo}}` | Custom field |
| `{{appointment.date}}` | Data da call |
| `{{appointment.time}}` | Horario da call |
| `{{appointment.meeting_link}}` | Link Zoom/Meet |
| `{{location.name}}` | Nome da location |
| `{{user.name}}` | Nome do usuario (closer) |

---

## Configuracao no Meta Business

Para usar templates de WhatsApp com botoes ou listas, e necessario aprovar os templates no Meta Business Manager.

### Templates que Precisam de Aprovacao:
- 04 - Confirmacao (com botao de confirmar)
- 05 - Lembrete 24h (com botoes SIM/NAO)

### Processo:
1. Acessar Meta Business Suite
2. Ir em WhatsApp Manager > Ferramentas da Conta > Templates
3. Criar template com categoria "Utility"
4. Aguardar aprovacao (24-48h)
5. Vincular no GHL

---

## Metricas Recomendadas

Acompanhe semanalmente:

| Metrica | Meta |
|---------|------|
| Taxa de Resposta (Primeiro Contato) | > 40% |
| Taxa de Qualificacao | > 30% |
| Taxa de Agendamento | > 60% dos qualificados |
| Taxa de Show | > 80% |
| Taxa de Conversao (Call → Venda) | > 25% |

---

## Suporte

Templates nao estao funcionando? Verifique:
1. Variaveis estao corretas
2. Numero WhatsApp esta conectado
3. Lead tem telefone valido
4. Workflow esta ativo

Duvidas: suporte@mottivme.com
