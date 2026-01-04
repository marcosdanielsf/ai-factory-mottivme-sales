# TEMPLATE DE ONBOARDING - CONTEXTO DO CLIENTE

## PROPOSITO

Este formulario coleta as informacoes necessarias para configurar o prompt do AI Head de Vendas de forma personalizada para cada cliente que contratar o CRM + IA.

**Sem essas informacoes, a IA fica generica e ineficaz.**

---

## SECAO 1: DADOS DA EMPRESA

### 1.1 Informacoes Basicas
```
empresa_nome: ""
segmento: "" # ex: Clinica odontologica, Consultoria, SaaS, etc
vertical: "" # ex: Saude, Tecnologia, Servicos
site: ""
```

### 1.2 Modelo de Negocio
```
tipo_venda: "" # B2B | B2C | B2B2C
ciclo_venda_medio: "" # ex: 7 dias, 30 dias, 90 dias
modelo_receita: "" # Recorrente | Projeto | Hibrido
```

---

## SECAO 2: PRODUTO/SERVICO

### 2.1 O que Vende
```
produto_principal: "" # Descricao em 1 frase
problema_que_resolve: "" # Qual dor do cliente resolve
diferencial_competitivo: "" # Por que escolher voces
```

### 2.2 Pricing
```
tickets:
  - nome: "Plano Entry"
    preco: 0
    perfil_cliente: ""
  - nome: "Plano Standard"
    preco: 0
    perfil_cliente: ""
  - nome: "Plano Premium"
    preco: 0
    perfil_cliente: ""

ticket_medio: 0
ticket_minimo_viavel: 0 # Abaixo disso nao vale o esforco
```

---

## SECAO 3: ICP (IDEAL CUSTOMER PROFILE)

### 3.1 Perfil Demografico
```
segmento_alvo: "" # ex: Clinicas odontologicas premium
tamanho_empresa: "" # ex: 5-50 funcionarios, faturamento X
cargo_decisor: "" # ex: Dono, Diretor Comercial, CEO
localizacao: "" # ex: Brasil, SP capital, etc
```

### 3.2 Perfil Comportamental
```
dor_principal: "" # A maior frustacao do cliente ideal
dor_secundaria: "" # Outras dores relevantes
motivacao_compra: "" # O que faz ele buscar solucao agora
objecao_mais_comum: "" # O que mais ouvem de objecao
```

### 3.3 Qualificacao Minima
```
faturamento_minimo: 0 # Abaixo disso, desqualificar
funcionarios_minimo: 0 # Se aplicavel
outros_criterios: "" # Outros requisitos para qualificar
```

---

## SECAO 4: RED FLAGS (DESQUALIFICADORES)

### 4.1 Red Flags Criticos (Desqualificar imediatamente)
```
red_flags_criticos:
  - "" # ex: Faturamento abaixo de X
  - "" # ex: Nao e tomador de decisao
  - "" # ex: Ja testou 3+ solucoes sem sucesso
  - "" # ex: Quer resultados em menos de X dias
  - "" # ex: So quer preco, nao valoriza consultoria
```

### 4.2 Red Flags Moderados (Avaliar caso a caso)
```
red_flags_moderados:
  - "" # ex: Empresa muito nova (< 1 ano)
  - "" # ex: Processo de vendas inexistente
  - "" # ex: Equipe comercial desalinhada
```

---

## SECAO 5: PROCESSO DE VENDAS

### 5.1 Etapas do Funil
```
etapas_funil:
  - nome: "Lead Novo"
    criterio_avancar: ""
  - nome: "Diagnostico Realizado"
    criterio_avancar: ""
  - nome: "Proposta Enviada"
    criterio_avancar: ""
  - nome: "Negociacao"
    criterio_avancar: ""
  - nome: "Fechado"
    criterio_avancar: ""
```

### 5.2 Calls de Vendas
```
tipos_call:
  - nome: "Diagnostico"
    objetivo: "" # ex: Qualificar e identificar dores
    duracao_ideal: "" # ex: 30-45min
    proximo_passo: "" # ex: Enviar proposta
  - nome: "Apresentacao"
    objetivo: ""
    duracao_ideal: ""
    proximo_passo: ""
  - nome: "Fechamento"
    objetivo: ""
    duracao_ideal: ""
    proximo_passo: ""
```

### 5.3 Metricas de Sucesso
```
taxa_conversao_meta: 0 # % de leads que fecham
taxa_no_show_aceitavel: 0 # % de no-show toleravel
tempo_resposta_ideal: "" # ex: < 5 minutos
```

---

## SECAO 6: OBJECOES E RESPOSTAS

### 6.1 Mapa de Objecoes
```
objecoes:
  - objecao: "Esta caro"
    resposta_ideal: ""
    resposta_ruim: ""

  - objecao: "Preciso pensar"
    resposta_ideal: ""
    resposta_ruim: ""

  - objecao: "Ja tentei outras solucoes"
    resposta_ideal: ""
    resposta_ruim: ""

  - objecao: "Nao tenho tempo agora"
    resposta_ideal: ""
    resposta_ruim: ""

  - objecao: "[CUSTOMIZADA]"
    resposta_ideal: ""
    resposta_ruim: ""
```

---

## SECAO 7: EQUIPE DE VENDAS

### 7.1 Estrutura
```
vendedores:
  - nome: ""
    cargo: "" # ex: Closer, SDR, Account Executive
    experiencia: "" # ex: Junior, Pleno, Senior
    pontos_fortes: ""
    pontos_fracos: ""
```

### 7.2 Expectativas de Coaching
```
foco_desenvolvimento: "" # ex: Fechamento, Descoberta, Rapport
frequencia_feedback: "" # ex: Diario, Semanal
formato_preferido: "" # ex: Call individual, Relatorio escrito
```

---

## SECAO 8: CONTEXTO ADICIONAL

### 8.1 Concorrencia
```
concorrentes_principais:
  - nome: ""
    diferenca: "" # Por que voces sao melhores
  - nome: ""
    diferenca: ""
```

### 8.2 Historico
```
solucoes_anteriores: "" # O que ja tentaram antes
por_que_nao_funcionou: "" # Aprendizados
expectativas_atuais: "" # O que esperam da IA
```

---

## OUTPUT: CONTEXTO PARA O PROMPT

Apos preencher, gerar o bloco de contexto para inserir no prompt:

```
### SOBRE A EMPRESA
- **Empresa:** {empresa_nome}
- **Produto:** {produto_principal}
- **O que vende:** {problema_que_resolve}
- **Vertical Principal:** {segmento_alvo}

### MODELOS E TICKETS
| Modelo | Preco | Perfil Cliente |
|--------|-------|----------------|
| {ticket_1_nome} | R$ {ticket_1_preco}/mes | {ticket_1_perfil} |
| {ticket_2_nome} | R$ {ticket_2_preco}/mes | {ticket_2_perfil} |
| {ticket_3_nome} | R$ {ticket_3_preco}/mes | {ticket_3_perfil} |

### ICP (IDEAL CUSTOMER PROFILE)
- **Segmento:** {segmento_alvo}
- **Ticket medio do cliente:** R$ {ticket_medio}
- **Faturamento minimo:** R$ {faturamento_minimo}/mes
- **Dor principal:** {dor_principal}
- **Decisor:** {cargo_decisor}

### RED FLAGS (DESQUALIFICAR IMEDIATAMENTE)
{red_flags_criticos_formatado}

### OBJECOES COMUNS E COMO AVALIAR
{objecoes_formatado}
```

---

## NOTAS DE IMPLEMENTACAO

1. Este formulario deve ser preenchido no onboarding de cada cliente
2. Pode ser um formulario no GHL, Typeform, ou dentro do proprio sistema
3. O output deve ser salvo no Supabase vinculado ao location_id
4. O prompt do AI Head de Vendas deve puxar esse contexto dinamicamente
5. Permitir que cliente atualize as informacoes quando processo mudar
