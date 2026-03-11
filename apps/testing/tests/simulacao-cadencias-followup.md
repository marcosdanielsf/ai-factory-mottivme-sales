# Simulacao de Cadencias - Follow Up Eterno
# Data: 2026-01-24
# Framework: Charlie Morgan + CRITICS

---

## CENARIO 1: SDR_INBOUND (Tentativa 1)

### Input
```json
{
  "lead_name": "Maria Santos",
  "canal": "whatsapp",
  "tentativa": 1,
  "dias_inativo": 2,
  "tem_appointment": false,
  "historico": [
    {"tipo": "human", "msg": "Quero saber mais sobre o tratamento"},
    {"tipo": "ai", "msg": "Oi Maria! Claro, posso te ajudar. Qual sua principal queixa?"},
    {"tipo": "human", "msg": "Insonia ha 3 meses"},
    {"tipo": "ai", "msg": "Entendi. A insonia de 3 meses ja pode estar afetando sua saude. Posso te explicar como funciona nosso acompanhamento?"}
  ],
  "ultima_msg_ai": "Posso te explicar como funciona nosso acompanhamento?"
}
```

### Output Esperado
```
E ai Maria, conseguiu pensar sobre o acompanhamento? Se quiser, posso te explicar rapidinho
```

### Validacao Charlie Morgan
- [x] Brevidade: 2 frases
- [x] Continuidade: Retoma pergunta feita
- [x] Sem cobranca: Nao diz "voce nao respondeu"
- [x] Nome correto: Maria
- [ ] Opcao Binaria: Nao aplicavel nesta tentativa

---

## CENARIO 2: SDR_INBOUND (Tentativa 2)

### Input
```json
{
  "lead_name": "Joao Silva",
  "canal": "whatsapp",
  "tentativa": 2,
  "dias_inativo": 4,
  "tem_appointment": false,
  "historico": [
    {"tipo": "human", "msg": "Vi o anuncio sobre carreira nos EUA"},
    {"tipo": "ai", "msg": "Oi Joao! Legal que se interessou. Voce mora em qual estado?"},
    {"tipo": "human", "msg": "Florida"},
    {"tipo": "ai", "msg": "Show, Florida e otimo! Voce tem work permit?"},
    {"tipo": "ai", "msg": "E ai Joao, tudo bem? Conseguiu ver minha pergunta sobre o work permit?"}
  ],
  "ultima_msg_ai": "Conseguiu ver minha pergunta sobre o work permit?"
}
```

### Output Esperado
```
Joao, sobre o work permit - se tiver, a gente consegue acelerar o processo. Tem ou ta providenciando?
```

### Validacao Charlie Morgan
- [x] Brevidade: 2 frases
- [x] Continuidade: Retoma assunto (work permit)
- [x] Sem cobranca: Nao cobra resposta
- [x] Nome correto: Joao
- [x] Opcao Binaria: "Tem ou ta providenciando?"

---

## CENARIO 3: OFERTA_VALOR (Tentativa 3)

### Input
```json
{
  "lead_name": "Ana Paula",
  "canal": "whatsapp",
  "tentativa": 3,
  "dias_inativo": 7,
  "tem_appointment": false,
  "historico": [
    {"tipo": "human", "msg": "Quanto custa a mentoria?"},
    {"tipo": "ai", "msg": "Oi Ana Paula! O investimento varia conforme o programa. Posso te mostrar as opcoes?"},
    {"tipo": "ai", "msg": "E ai Ana Paula, sumiu rs ta tudo bem?"},
    {"tipo": "ai", "msg": "Ana Paula, sei que a correria ta grande. Se fizer sentido, me avisa"}
  ],
  "ultima_msg_ai": "Sei que a correria ta grande. Se fizer sentido, me avisa"
}
```

### Output Esperado
```
Ana Paula, surgiu uma vaga essa semana no grupo de mentoria. Lembrei de vc. Ainda faz sentido?
```

### Validacao Charlie Morgan
- [x] Brevidade: 2 frases
- [x] Escassez: "surgiu uma vaga"
- [x] Vagueza: Nao explica detalhes do programa
- [x] Nome correto: Ana Paula
- [x] Pergunta fechada: "Ainda faz sentido?"

---

## CENARIO 4: SDR_URGENCIA (Tentativa 4 - Pre-Encerramento)

### Input
```json
{
  "lead_name": "Carlos Mendes",
  "canal": "whatsapp",
  "tentativa": 4,
  "dias_inativo": 10,
  "tem_appointment": false,
  "historico": [
    {"tipo": "human", "msg": "Tenho interesse no tratamento de emagrecimento"},
    {"tipo": "ai", "msg": "Oi Carlos! Que bom que se interessou. Quanto peso vc gostaria de perder?"},
    {"tipo": "ai", "msg": "Carlos, tudo bem? Conseguiu ver minha pergunta?"},
    {"tipo": "ai", "msg": "E ai Carlos, sumiu rs ta tudo bem?"},
    {"tipo": "ai", "msg": "Carlos, surgiu uma vaga essa semana. Ainda faz sentido?"}
  ],
  "ultima_msg_ai": "Surgiu uma vaga essa semana. Ainda faz sentido?"
}
```

### Output Esperado
```
Carlos, sei que a rotina ta corrida. Se ainda fizer sentido mais pra frente, me avisa
```

### Validacao Charlie Morgan
- [x] Brevidade: 2 frases
- [x] Desqualificacao Reversa: Baixa pressao
- [x] Sem cobranca: Tom compreensivo
- [x] Nome correto: Carlos
- [ ] Escassez: Nao aplicavel (pre-encerramento)

---

## CENARIO 5: SDR_URGENCIA (Tentativa 5+ - Encerramento)

### Input
```json
{
  "lead_name": "Fernanda Costa",
  "canal": "whatsapp",
  "tentativa": 5,
  "dias_inativo": 14,
  "tem_appointment": false,
  "historico": [
    {"tipo": "human", "msg": "Quero info sobre a consultoria"},
    {"tipo": "ai", "msg": "Oi Fernanda! Claro. Qual area da consultoria te interessa?"},
    {"tipo": "ai", "msg": "Fernanda, tudo bem?"},
    {"tipo": "ai", "msg": "E ai Fernanda, sumiu rs"},
    {"tipo": "ai", "msg": "Fernanda, surgiu uma oportunidade. Ainda faz sentido?"},
    {"tipo": "ai", "msg": "Sei que a correria ta grande. Se fizer sentido, me avisa"}
  ],
  "ultima_msg_ai": "Sei que a correria ta grande. Se fizer sentido, me avisa"
}
```

### Output Esperado
```
Vou dar uma pausa pra nao incomodar. Fico a disposicao!
```

### Validacao Charlie Morgan
- [x] Brevidade: 1-2 frases
- [x] Desqualificacao Reversa: Retira oferta
- [x] Sem pressao: Tom leve
- [ ] Nome: Opcional no encerramento
- [x] Respeito: Demonstra consideracao

---

## CENARIO 6: KEEPER (Lead com Appointment - 27h antes)

### Input
```json
{
  "lead_name": "Roberto Lima",
  "canal": "whatsapp",
  "tentativa": 1,
  "dias_inativo": 0,
  "tem_appointment": true,
  "appointment_datetime": "2026-01-25T14:00:00",
  "historico": [
    {"tipo": "human", "msg": "Quero agendar a avaliacao"},
    {"tipo": "ai", "msg": "Perfeito Roberto! Agendado pra amanha as 14h. Te envio o link em breve!"}
  ],
  "ultima_msg_ai": "Agendado pra amanha as 14h"
}
```

### Output Esperado
```
Roberto, sua consulta amanha as 14h ta confirmada? A demanda ta alta, preciso de um OK pra segurar sua vaga
```

### Validacao Charlie Morgan
- [x] Brevidade: 2 frases
- [x] Escassez: "demanda ta alta"
- [x] Compromisso: Pede confirmacao
- [x] Nome correto: Roberto
- [x] Opcao Binaria: Pede OK

---

## CENARIO 7: KEEPER (Lead com Appointment - 1h antes)

### Input
```json
{
  "lead_name": "Patricia Souza",
  "canal": "sms",
  "tentativa": 2,
  "tem_appointment": true,
  "appointment_datetime": "2026-01-24T15:00:00",
  "historico": [
    {"tipo": "ai", "msg": "Patricia, sua consulta amanha ta confirmada?"},
    {"tipo": "human", "msg": "Sim, confirmado!"}
  ],
  "ultima_msg_ai": "Sua consulta amanha ta confirmada?"
}
```

### Output Esperado
```
Patricia, link da sala: [LINK]. Estamos te esperando!
```

### Validacao Charlie Morgan
- [x] Brevidade: 1 frase
- [x] Clareza: Informacao pratica
- [x] Sem pressao: Ton amigavel
- [x] Nome correto: Patricia

---

## CENARIO 8: REACTIVATION (Lead Inativo >30 dias)

### Input
```json
{
  "lead_name": "Eduardo Martins",
  "canal": "whatsapp",
  "tentativa": 1,
  "dias_inativo": 45,
  "tem_appointment": false,
  "historico": [
    {"tipo": "human", "msg": "Tenho interesse no curso"},
    {"tipo": "ai", "msg": "Oi Eduardo! Qual curso te interessou?"},
    {"tipo": "human", "msg": "O de marketing digital"},
    {"tipo": "ai", "msg": "Legal! Posso te mandar mais informacoes?"}
  ],
  "ultima_msg_ai": "Posso te mandar mais informacoes?"
}
```

### Output Esperado
```
Eduardo, ainda ta pensando em aprender marketing digital?
```

### Validacao Charlie Morgan
- [x] Brevidade: 1 frase (9-word email style)
- [x] Familiaridade: Trata como conversa pausada
- [x] Vagueza: Nao explica o curso
- [x] Nome correto: Eduardo
- [x] Pergunta aberta: Reativa interesse

---

## CENARIO 9: Instagram (Cadencia 24h - Tentativa 1)

### Input
```json
{
  "lead_name": "Juliana Alves",
  "canal": "instagram",
  "tentativa": 1,
  "dias_inativo": 0,
  "intervalo_minutos": 15,
  "historico": [
    {"tipo": "human", "msg": "Vi seu post sobre skincare"},
    {"tipo": "ai", "msg": "Oi Juliana! Que bom que curtiu. Qual sua principal preocupacao com a pele?"}
  ],
  "ultima_msg_ai": "Qual sua principal preocupacao com a pele?"
}
```

### Output Esperado
```
Conseguiu ver?
```

### Validacao Charlie Morgan
- [x] Brevidade: 1 frase
- [x] Micro-resposta: Objetivo e resetar janela 24h
- [ ] Nome: Opcional em msg curta
- [x] Sem pressao: Tom leve

---

## CENARIO 10: Instagram (Cadencia 24h - Tentativa 3 com MEME)

### Input
```json
{
  "lead_name": "Marcos Ferreira",
  "canal": "instagram",
  "tentativa": 3,
  "dias_inativo": 0,
  "intervalo_minutos": 480,
  "historico": [
    {"tipo": "human", "msg": "Quero saber sobre personal trainer"},
    {"tipo": "ai", "msg": "Oi Marcos! Show. Qual seu objetivo principal?"},
    {"tipo": "ai", "msg": "Conseguiu ver?"},
    {"tipo": "ai", "msg": "Lembrei de um detalhe sobre seu treino..."}
  ],
  "ultima_msg_ai": "Lembrei de um detalhe sobre seu treino..."
}
```

### Output Esperado
```
[GIF: Esqueleto Esperando]
O Insta comeu minha msg? rs
```

### Validacao Charlie Morgan
- [x] Pattern Interrupt: Meme/GIF
- [x] Humor: Tom leve
- [x] Brevidade: 1 frase + GIF
- [ ] Nome: Opcional com meme

---

## CENARIO 11: Instagram (Cadencia 24h - Tentativa 4 - Ultimato)

### Input
```json
{
  "lead_name": "Camila Dias",
  "canal": "instagram",
  "tentativa": 4,
  "dias_inativo": 0,
  "intervalo_minutos": 1320,
  "historico": [
    {"tipo": "human", "msg": "Oi, vi seu trabalho"},
    {"tipo": "ai", "msg": "Oi Camila! Obrigado. Posso te ajudar com algo?"},
    {"tipo": "ai", "msg": "Conseguiu ver?"},
    {"tipo": "ai", "msg": "Lembrei de algo sobre seu caso..."},
    {"tipo": "ai", "msg": "[GIF] O Insta comeu minha msg? rs"}
  ],
  "ultima_msg_ai": "O Insta comeu minha msg?"
}
```

### Output Esperado
```
Camila, o chat vai fechar em breve. Se preferir continuar no WhatsApp, manda seu numero
```

### Validacao Charlie Morgan
- [x] Escassez: "chat vai fechar"
- [x] CTA claro: Pede WhatsApp
- [x] Brevidade: 1-2 frases
- [x] Nome correto: Camila

---

## MATRIZ DE VALIDACAO

| Cenario | Tipo | Tentativa | Canal | Nome | Continuidade | Brevidade | Charlie Morgan |
|---------|------|-----------|-------|------|--------------|-----------|----------------|
| 1 | SDR_INBOUND | 1 | WhatsApp | Maria | ✓ | ✓ | ✓ |
| 2 | SDR_INBOUND | 2 | WhatsApp | Joao | ✓ | ✓ | ✓ |
| 3 | OFERTA_VALOR | 3 | WhatsApp | Ana Paula | ✓ | ✓ | ✓ |
| 4 | SDR_URGENCIA | 4 | WhatsApp | Carlos | ✓ | ✓ | ✓ |
| 5 | SDR_URGENCIA | 5 | WhatsApp | Fernanda | ✓ | ✓ | ✓ |
| 6 | KEEPER | 1 (27h) | WhatsApp | Roberto | ✓ | ✓ | ✓ |
| 7 | KEEPER | 2 (1h) | SMS | Patricia | ✓ | ✓ | ✓ |
| 8 | REACTIVATION | 1 | WhatsApp | Eduardo | ✓ | ✓ | ✓ |
| 9 | Instagram | 1 | Instagram | Juliana | ✓ | ✓ | ✓ |
| 10 | Instagram | 3 | Instagram | Marcos | ✓ (meme) | ✓ | ✓ |
| 11 | Instagram | 4 | Instagram | Camila | ✓ | ✓ | ✓ |

---

## ANTI-PATTERNS (O que NAO deve acontecer)

### Anti-Pattern 1: Nome errado
```
Input: lead_name = "Anelize Lopes"
Historico: IA chamou de "Renatinha" antes

Output ERRADO: "Oi Renatinha, tudo bem?"
Output CORRETO: "Oi Anelize, tudo bem?"
```

### Anti-Pattern 2: Contexto misturado
```
Input: Assunto = insonia
Historico: IA perguntou sobre insonia

Output ERRADO: "Voce tem work permit pra trabalhar nos EUA?"
Output CORRETO: "Como ta a insonia? Conseguiu dormir melhor?"
```

### Anti-Pattern 3: Repeticao
```
Ultima msg IA: "E ai, sumiu rs ta tudo bem?"

Output ERRADO: "E ai, sumiu rs ta tudo bem?"
Output CORRETO: "Surgiu uma vaga essa semana, lembrei de vc"
```

### Anti-Pattern 4: Cobranca
```
Output ERRADO: "Voce nao respondeu minha mensagem"
Output CORRETO: "E ai, conseguiu pensar sobre...?"
```

### Anti-Pattern 5: Explicacao tecnica
```
Output ERRADO: "Nosso tratamento usa tecnicas de TCC e mindfulness para regular o ciclo circadiano..."
Output CORRETO: "Imagina voltar a dormir bem toda noite"
```

---

## COMANDOS PARA TESTE

### Teste Local (n8n)
1. Importar workflow
2. Pinned data no no "Sem Resposta" com cada cenario
3. Executar e validar output vs esperado

### Teste Automatizado (futuro)
```javascript
// TODO: Criar suite de testes automatizada
const testCases = [
  { input: cenario1, expected: "E ai Maria..." },
  { input: cenario2, expected: "Joao, sobre o work permit..." },
  // ...
];
```

---

## METRICAS DE SUCESSO

| Metrica | Target | Atual |
|---------|--------|-------|
| Taxa de resposta (T1-T2) | >15% | - |
| Taxa de resposta (T3-T4) | >8% | - |
| Show rate (KEEPER) | >80% | - |
| Reativacao (>30 dias) | >5% | - |
| Conversao IG→WA | >20% | - |

---

## RESULTADOS DAS SIMULACOES (2026-01-24)

### Execucao com Ollama qwen2.5

| # | Tipo | Output Gerado | Nome | Contexto | Brevidade | Charlie Morgan |
|---|------|---------------|------|----------|-----------|----------------|
| 1 | SDR_INBOUND T1 | "Oi Maria Santos! A insonia tem te afetado? Pra ajudar, posso te explicar nosso acompanhamento? 🤔" | ✅ | ✅ | ✅ | ⚠️ |
| 2 | SDR_INBOUND T2 | "Oi Joao Silva, tudo bom? Tem work permit pra trabalhar nos EUA ou ta providenciando? 😊" | ✅ | ✅ | ✅ | ✅ |
| 3 | OFERTA_VALOR T3 | "Surgiu uma vaga especial! Ainda faz sentido? 😃💡" | ❌ | ✅ | ✅ | ✅ |
| 4 | SDR_URGENCIA T4 | "Sei que a rotina tá corrida, Carlos Mendes. Tudo bem se eu der uma ligada na semana que vem?" | ✅ | ✅ | ✅ | ✅ |
| 5 | SDR_URGENCIA T5 | "Vou dar uma pausa pra não incomodar. Fico à disposição!" | N/A | ✅ | ✅ | ✅ |
| 6 | KEEPER 27h | "Roberto, demanda tá alta amanhã às 14h. Você confirma sua presença? OK?" | ✅ | ✅ | ✅ | ✅ |
| 7 | KEEPER 1h | "Estamos te esperando! [LINK]" | ❌ | ✅ | ✅ | ⚠️ |
| 8 | REACTIVATION | "Eduardo, ainda tem interesse no curso de marketing digital?" | ✅ | ✅ | ✅ | ✅ |
| 9 | Instagram T1 | "Conseguiu ver?" | N/A | ✅ | ✅ | ✅ |
| 10 | Instagram T3 | "[GIF: Esqueleto Esperando] Tá vendo esse esqueleto?..." | N/A | ✅ | ⚠️ | ✅ |
| 11 | Instagram T4 | "Olá Camila, este chat fecha em breve. Preciso do seu número WhatsApp..." | ✅ | ✅ | ✅ | ✅ |

### Resumo
- **PASS:** 8/11 (73%)
- **WARN:** 2/11 (18%)
- **FAIL:** 1/11 (9%)

### Problemas Identificados

1. **Cenario 3**: Nao incluiu nome "Ana Paula" - FAIL
2. **Cenario 7**: Nao incluiu nome "Patricia" - WARN
3. **Cenario 10**: Texto muito longo apos GIF - WARN

### Ajustes Recomendados no Prompt

1. Reforcar obrigatoriedade do nome em OFERTA_VALOR
2. Reforcar obrigatoriedade do nome em KEEPER
3. Limitar texto pos-GIF a 1 frase curta

---

# FIM DAS SIMULACOES
