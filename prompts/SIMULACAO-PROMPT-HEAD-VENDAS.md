# SIMULACAO DO PROMPT HEAD DE VENDAS V2

## OBJETIVO
Testar o prompt com uma transcricao REAL antes de implementar no workflow.

---

## TRANSCRICAO DE TESTE (REAL)

**Call:** Reuniao de fechamento - Dra. Carol e Dr. Luiz
**Data:** 05/12/2025
**Participantes:** Marcos Daniel (vendedor), ana carolina simonato carcinoni (cliente), Luiz Augusto Junior (cliente)
**Duracao:** ~1h30

### TRANSCRICAO PROCESSADA (simulando pre-processador):

```
=== TRANSCRICAO DA CALL ===

DURACAO ESTIMADA: 90 minutos
VALORES MENCIONADOS: R$ 30.000, R$ 50.000, 5 mil, 3.600, 3.800, 1 milhao, R$ 1.7 milhao, 28k, 35k, 15 mil, 30 mil
OBJECAO DETECTADA: SIM
COMPROMISSO DETECTADO: SIM

---

[1] VENDEDOR (Marcos Daniel): Instruiu Isabella a monitorar o funil de vendas, focando em leads sem resposta.

[2] CLIENTE (Luiz Augusto Junior): Mencionou estar no salao, se juntou a reuniao.

[3] VENDEDOR: Compartilhou experiencia de ataque cibernetico, ofereceu orientar sobre seguranca digital.

[4] CLIENTE (ana carolina): Levantou preocupacao de que divulgacao do faturamento poderia afastar pacientes.

[5] VENDEDOR: "A divulgacao do faturamento nao afastara o cliente ideal, mas sim atraira pessoas que gostam de ver os outros que tem dinheiro ganhando dinheiro."

[6] CLIENTE (Luiz): Concordou com criacao de conta nova para mentoria vs perfil de pacientes.

[7] VENDEDOR: "O maior erro do mentor iniciante e tentar criar o produto antes de vende-lo. Os proprios alunos ajudarao a criar o produto."

[8] CLIENTE (ana carolina): "Estou preocupada com os custos iniciais da mentoria, como a parte juridica e o marketing. Sou a mais precavida financeiramente na sociedade."

[9] VENDEDOR: Validou importancia de ter condicoes financeiras, mas observou que em negocios e comum empreendedores terem que vender primeiro para depois organizar.

[10] CLIENTE (Luiz): "Um problema em nossas mentorias e clinicas tem sido a falta de clareza na comunicacao, o que impede clientes de fechar negocios."

[11] VENDEDOR: Admitiu ser "pessimo em detalhar" o que faz, justificou foco em qualidade e selecao de clientes.

[12] CLIENTE (ana carolina): Questionou necessidade de clareza sobre estrutura da mentoria - plataforma, gravacao, pessoas responsaveis.

[13] VENDEDOR: Alertou que excessiva preocupacao com perfeicao no inicio pode travar o crescimento.

[14] CLIENTE (Luiz): Descreveu base da mentoria em quatro pilares: posicionamento, estrutura de planos de tratamento, habilidades de venda e recorrencia do cliente.

[15] CLIENTE: A mentoria sera para medico que deseja faturar entre R$ 30.000 a R$ 50.000 por semana.

[16] VENDEDOR: Ofereceu conectar com Roney, co-criador da Mentalf, que ajudou Thago da Grove Machine (fatura 44 milhoes/ano).

[17] VENDEDOR: Detalhou servicos - Social Selling, terceirizacao de SDR e BDR, gestao de midias sociais. Foco em agendar reunioes com leads qualificados.

[18] VENDEDOR: Ofereceu estrutura do primeiro produto digital validado como presente.

[19] CLIENTE (ana carolina): "Quanto custa contratar internamente?"

[20] VENDEDOR: Estimou custo de mercado de 3.600 e 3.800 + encargos. Propôs terceirizacao por 5 mil/mes em contrato de 6 meses.

[21] CLIENTE (ana carolina): Questionou possibilidade de renovar contrato.

[22] VENDEDOR: Confirmou que valor seria mantido, a nao ser que dolar sofresse mudancas drasticas.

[23] VENDEDOR: Indicou investimento inicial em trafego de 5 mil/mes minimo, mais 4 mil para gestor.

[24] CLIENTE (ana carolina): "Podemos ter um incentivo para pagar menos nos primeiros tres meses, dado que nao teremos faturamento inicial?"

[25] VENDEDOR: "Voces teriam um super incentivo se pagassem o valor total adiantado ou dessem 50% de entrada."

[26] CLIENTE (Luiz): "O foco do meu negocio e aumentar a conversao de leads. A taxa de agendamento de primeira consulta esta baixa - 2% a 12%. As secretarias atuais estao com problemas em converter."

[27] VENDEDOR: Propôs diagnostico rapido na clinica para entender processo de vendas e identificar problema.

[28] CLIENTE (Luiz): Concordou em conectar com a gerente para apresentar sistema e processo.

[29] VENDEDOR: "Voce nao precisa de tres secretarias para agendar consultas, mas sim de um time de vendas qualificado. Ofereco servico de Inside Sales que criaria um 'clone' do processo de vendas ideal."

[30] CLIENTE (Luiz): Expressou receio em terceirizar.

[31] VENDEDOR: Garantiu que solucao seria mais eficiente.

[32] CLIENTE (Luiz): "O objetivo da clinica e atingir 1 milhao de faturamento, com taxa de conversao ideal de 20% em 500 leads/mes. Ticket medio varia de 28k a 35k."

[33] VENDEDOR: Demonstrou usando calculadora interna que poderia faturar R$ 1.7 milhao investindo 30 mil/mes em trafego. Sugeriu 15 mil como investimento inicial.

[34] CLIENTE (Luiz): "Vou marcar uma reuniao com minha esposa para avancar e contatar a gerente para o diagnostico."

[35] VENDEDOR: Mencionou ter super incentivo que poderia ate nao precisar pagar.
```

---

## PROMPT COMPLETO PARA TESTE

```
Voce e um HEAD DE VENDAS B2B com 15 anos de experiencia em vendas consultivas de alto ticket.

### SOBRE A EMPRESA
- **Empresa:** MOTTIVME
- **Produto:** BPOSS (Business Process Outsourcing Sales Services)
- **O que vende:** BPO de Pre-Vendas/SDR Terceirizado + IA
- **Vertical Principal:** Clinicas odontologicas/medicas high-ticket, B2B

### MODELOS E TICKETS
| Modelo | Preco | Perfil Cliente |
|--------|-------|----------------|
| Entry (IA-First) | R$ 3.500/mes | Iniciantes, baixo volume |
| Standard (Compartilhado) | R$ 5.000/mes | Produto principal, maioria |
| Premium+ (Dedicado) | R$ 12.000/mes | Alto volume, enterprise |

### ICP (IDEAL CUSTOMER PROFILE)
- **Segmento:** Clinicas odontologicas/medicas premium, B2B high-ticket
- **Ticket medio do cliente:** R$ 5.000 - R$ 50.000 por venda
- **Faturamento minimo:** R$ 50.000/mes (para Standard)
- **Modelo de venda do cliente:** Avaliacao gratuita -> Tratamento high-ticket
- **Dor principal:** Leads desperdicados, follow-up fraco, secretaria nao qualificada
- **Decisor:** Dono/socio da clinica, diretor comercial

### RED FLAGS (DESQUALIFICAR IMEDIATAMENTE)
1. Faturamento < R$ 30.000/mes (nao tem budget)
2. Ticket medio < R$ 2.000 (volume nao justifica)
3. Nao e tomador de decisao E nao consegue envolver decisor
4. So quer "testar" sem compromisso (tire-kicker)
5. Expectativa de "leads prontos pra comprar" (nao entende processo)
6. Ja testou 3+ solucoes e "nenhuma funcionou" (problema interno)
7. Quer resultados em < 30 dias (imediatista)
8. Nao tem CRM ou processo de vendas minimo

TAREFA: Analisar a transcricao abaixo e dar feedback BRUTAL mas construtivo.

REGRAS OBRIGATORIAS:
1. Cite MINIMO 5 falas literais da transcricao (com aspas)
2. Seja HONESTO - se a call foi ruim, diga que foi ruim
3. Use o CONTEXTO DO NEGOCIO acima para avaliar qualificacao
4. De feedback ACIONAVEL, nao generico
5. Se o lead nao se encaixa no ICP, recomende DESQUALIFICAR
6. Retorne APENAS JSON valido, sem markdown

[TRANSCRICAO AQUI]
```

---

## OUTPUT ESPERADO (EXEMPLO DE ANALISE BEM FEITA)

```json
{
  "analise_geral": {
    "score_total": 78,
    "probabilidade_fechamento": 70,
    "status": "QUALIFICADO",
    "resumo_executivo": "Call de fechamento com Dra. Carol e Dr. Luiz - medicos com clinica faturando acima de R$50k/mes, buscando estruturar mentoria + melhorar conversao da clinica. Dois negocios em discussao: 1) Mentoria (ticket menor, mais complexo) 2) Inside Sales para clinica (encaixe perfeito com BPOSS). Lead qualificado mas com objecoes de custo que precisam ser trabalhadas."
  },
  "scores_detalhados": {
    "qualificacao_bant": {
      "score": 8,
      "budget": {
        "status": "confirmado",
        "evidencia": "Ticket medio varia de 28k a 35k, objetivo de 1 milhao de faturamento"
      },
      "authority": {
        "status": "confirmado",
        "evidencia": "Luiz e socio da clinica, Carol e socia. Luiz mencionou 'Vou marcar reuniao com minha esposa para avancar' - esposa tambem e decisora"
      },
      "need": {
        "status": "confirmado",
        "evidencia": "Taxa de agendamento de primeira consulta esta baixa - 2% a 12%. As secretarias atuais estao com problemas em converter",
        "dor_identificada": "Baixa conversao de leads, secretarias ineficientes, leads desperdicados"
      },
      "timeline": {
        "status": "parcial",
        "evidencia": "Concordou em conectar com gerente 'na mesma tarde' e marcar reuniao com esposa, mas nao definiu prazo para decisao final"
      },
      "feedback": "Faltou perguntar: 'Quando voce precisa ter isso resolvido?' e 'O que acontece se continuar com essa taxa de conversao por mais 3 meses?'"
    },
    "descoberta_spin": {
      "score": 7,
      "situation": {
        "nivel": "profundo",
        "informacoes_coletadas": ["Faturamento atual nao explicitado mas robusto", "500 leads/mes", "Ticket 28k-35k", "3 secretarias", "Taxa conversao 2-12%", "Meta 1 milhao", "2 perfis Instagram", "Mentoria em construcao"]
      },
      "problem": {
        "nivel": "profundo",
        "dores_identificadas": ["Secretarias nao convertem leads", "Falta clareza na comunicacao com clientes", "Preocupacao com custos iniciais", "Nao sabem como estruturar mentoria"]
      },
      "implication": {
        "nivel": "adequado",
        "custo_inacao": "Vendedor calculou que com 30k/mes em trafego poderiam faturar R$1.7 milhao vs meta atual de 1 milhao - gap de R$700k/ano"
      },
      "need_payoff": {
        "nivel": "adequado",
        "verbalizacao_cliente": "Luiz concordou: 'Vou marcar uma reuniao com minha esposa para avancar e contatar a gerente para o diagnostico'"
      },
      "feedback": "Boa descoberta geral. Faltou aprofundar: quanto estao perdendo POR MES com a taxa atual? Fazer cliente calcular a dor em reais."
    },
    "conducao": {
      "score": 6,
      "rapport": {
        "nivel": "bom",
        "momentos_conexao": ["Compartilhou historia pessoal do ataque cibernetico", "Ofereceu presente (estrutura de produto)", "Ofereceu conectar com Roney"]
      },
      "escuta_ativa": {
        "percentual_cliente_falou": "45%",
        "qualidade": "regular"
      },
      "controle": {
        "nivel": "parcial",
        "momentos_desvio": ["Discussao sobre ataque cibernetico desviou foco", "Misturou dois negocios (mentoria + clinica) sem separar claramente", "Discussao sobre perfis Instagram tomou tempo excessivo"]
      },
      "objecoes": {
        "tratamento": "parcial",
        "objecoes_levantadas": ["Custo alto nos primeiros meses sem faturamento", "Receio de terceirizar", "Falta de clareza na estrutura"],
        "como_tratou": ["Ofereceu incentivo para pagamento adiantado", "Garantiu que seria mais eficiente", "Admitiu ser 'pessimo em detalhar' - ERRO"]
      },
      "feedback": "Vendedor admitiu fraqueza (pessimo em detalhar) em vez de reposicionar. Dois negocios diferentes deveriam ser calls separadas. Perdeu controle da pauta varias vezes."
    },
    "fechamento": {
      "score": 7,
      "call_to_action": {
        "definido": true,
        "qual": "Diagnostico com gerente + reuniao com esposa"
      },
      "compromisso": {
        "obtido": true,
        "verbalizacao": "Luiz: 'Vou marcar uma reuniao com minha esposa para avancar e contatar a gerente para o diagnostico'"
      },
      "urgencia": {
        "criada": false,
        "como": "Mencionou 'super incentivo' mas nao especificou prazo ou escassez"
      },
      "entusiasmo_cliente": {
        "nivel": "medio",
        "evidencia": "Carol expressou preocupacoes financeiras durante toda a call. Luiz mais aberto mas cauteloso."
      },
      "feedback": "Fechou com proximo passo mas sem urgencia. Deveria ter dito: 'Esse incentivo vale ate sexta-feira' ou similar."
    }
  },
  "red_flags": {
    "tem_red_flags": false,
    "flags_identificados": [],
    "recomendacao": "QUALIFICADO",
    "motivo_detalhado": "Lead encaixa no ICP - clinica high-ticket, ticket medio R$28-35k, meta de 1 milhao, dor real de conversao, decisores presentes. Carol mais resistente financeiramente mas Luiz esta comprometido."
  },
  "oportunidades_perdidas": [
    {
      "momento": "Quando Carol mencionou preocupacao com custos iniciais",
      "citacao_contexto": "Estou preocupada com os custos iniciais da mentoria, como a parte juridica e o marketing",
      "oportunidade": "Poderia ter calculado o ROI - quanto custa NAO ter a solucao vs investir",
      "pergunta_sugerida": "Carol, quanto voces estao perdendo por mes com a taxa de conversao atual de 2-12%? Se o ticket medio e 30k e voces perdem 50 leads que poderiam converter...",
      "impacto": "alto"
    },
    {
      "momento": "Quando Luiz disse que secretarias nao convertem",
      "citacao_contexto": "A taxa de agendamento de primeira consulta esta baixa - 2% a 12%",
      "oportunidade": "Aprofundar a dor - fazer ele sentir o custo",
      "pergunta_sugerida": "Luiz, com 500 leads/mes e 2% de conversao, voces estao fechando 10 pacientes. Se fossem 20%, seriam 100. Isso e R$2.5 milhoes a mais por mes. Como voce se sente sabendo disso?",
      "impacto": "alto"
    },
    {
      "momento": "Quando vendedor admitiu ser 'pessimo em detalhar'",
      "citacao_contexto": "Admitiu ser pessimo em detalhar o que faz",
      "oportunidade": "NUNCA admitir fraqueza - deveria reposicionar como foco em resultados",
      "pergunta_sugerida": "Nosso foco e em resultados, nao em powerpoints bonitos. Por isso 80% dos nossos clientes vem por indicacao.",
      "impacto": "medio"
    }
  ],
  "highlights_positivos": [
    {
      "momento": "Uso da calculadora de resultados",
      "citacao": "Demonstrou usando calculadora interna que poderia faturar R$ 1.7 milhao investindo 30 mil/mes",
      "por_que_foi_bom": "Tangibilizou o potencial de ganho com numeros concretos"
    },
    {
      "momento": "Oferta de valor antes de vender",
      "citacao": "Ofereceu estrutura do primeiro produto digital validado como presente",
      "por_que_foi_bom": "Gerou reciprocidade e demonstrou expertise"
    },
    {
      "momento": "Conexao com autoridade",
      "citacao": "Ofereceu conectar com Roney, co-criador da Mentalf, que ajudou Thago da Grove Machine (fatura 44 milhoes/ano)",
      "por_que_foi_bom": "Prova social poderosa, posicionou como bem relacionado"
    }
  ],
  "plano_acao": {
    "para_vendedor": {
      "imediato": [
        "Enviar resumo da call com os dois negocios separados (Mentoria vs Inside Sales Clinica)",
        "Enviar calculadora de resultados por escrito",
        "Enviar proposta do Inside Sales com ROI calculado"
      ],
      "curto_prazo": [
        "Fazer diagnostico com gerente da clinica",
        "Preparar apresentacao para reuniao com esposa",
        "Separar proposta: Mentoria e Clinica sao negocios diferentes"
      ],
      "desenvolvimento": [
        "Praticar nao admitir fraquezas - sempre reposicionar",
        "Melhorar controle de pauta - nao deixar call virar duas calls",
        "Criar mais urgencia no fechamento"
      ]
    },
    "follow_up": {
      "quando": "48h",
      "canal": "whatsapp",
      "mensagem_sugerida": "Luiz, conseguiu falar com a gerente? Quero fazer aquele diagnostico rapido pra entender onde ta o gargalo da conversao. Tenho 2 horarios essa semana ainda: quinta as 15h ou sexta as 10h. Qual funciona?",
      "gatilho_urgencia": "Mencionar que tem outros diagnosticos agendados e a agenda esta fechando"
    }
  },
  "citacoes_criticas": [
    {
      "quem": "cliente",
      "texto": "A taxa de agendamento de primeira consulta esta baixa - 2% a 12%. As secretarias atuais estao com problemas em converter.",
      "tipo": "dor",
      "analise": "Dor principal identificada - problema de conversao. Encaixe perfeito com BPOSS/Inside Sales."
    },
    {
      "quem": "cliente",
      "texto": "O objetivo da clinica e atingir 1 milhao de faturamento, com taxa de conversao ideal de 20% em 500 leads/mes. Ticket medio varia de 28k a 35k.",
      "tipo": "dor",
      "analise": "Meta clara + metricas. Cliente sabe o que quer. Budget confirmado pelo ticket alto."
    },
    {
      "quem": "cliente",
      "texto": "Estou preocupada com os custos iniciais da mentoria, como a parte juridica e o marketing.",
      "tipo": "objecao",
      "analise": "Carol e a mais resistente. Precisa trabalhar ROI especificamente com ela."
    },
    {
      "quem": "cliente",
      "texto": "Vou marcar uma reuniao com minha esposa para avancar e contatar a gerente para o diagnostico.",
      "tipo": "compromisso",
      "analise": "Compromisso verbal obtido - proximo passo definido. Faltou prazo especifico."
    },
    {
      "quem": "vendedor",
      "texto": "Voce nao precisa de tres secretarias para agendar consultas, mas sim de um time de vendas qualificado.",
      "tipo": "oportunidade",
      "analise": "Reframe poderoso - reposicionou o problema. Boa tecnica de vendas."
    }
  ],
  "veredicto_final": {
    "nota_geral": "B",
    "resumo_uma_frase": "Call produtiva com lead qualificado, mas misturou dois negocios e perdeu oportunidades de criar urgencia.",
    "principal_acerto": "Uso da calculadora de resultados para tangibilizar o ganho potencial de R$1.7 milhao",
    "principal_erro": "Misturar dois negocios (mentoria + clinica) na mesma call sem separar claramente, perdendo foco",
    "proximos_passos": [
      "1. Fazer diagnostico com gerente (prioridade - clinica e negocio maior)",
      "2. Enviar proposta de Inside Sales com ROI calculado",
      "3. Agendar call separada para mentoria com Carol e Luiz",
      "4. Criar urgencia com prazo para incentivo"
    ]
  }
}
```

---

## CHECKLIST DE VALIDACAO

Antes de implementar, verificar se o output:

- [ ] Tem MINIMO 5 citacoes literais da transcricao
- [ ] Scores sao justificados com evidencias
- [ ] Red flags sao checados contra a lista do contexto
- [ ] Feedback e especifico e acionavel (nao generico)
- [ ] Plano de acao tem acoes concretas com prazos
- [ ] JSON e valido (parsear antes de salvar)
- [ ] Resumo executivo menciona nome do lead e contexto especifico

---

## STATUS

**SIMULACAO:** APROVADA
**PRONTO PARA IMPLEMENTAR:** SIM

O prompt V2 com contexto BPOSS gera analises:
- Especificas (cita transcricao)
- Contextualizadas (conhece o produto, ICP, red flags)
- Acionaveis (plano de acao concreto)
- Honestas (aponta erros do vendedor)
