# Template de Chamada - QA Agent Tester

## Como usar no n8n

### 1. Node: Buscar Dados do Agente (HTTP Request ou Postgres)

```sql
SELECT
  av.id,
  av.location_id,
  av.agent_name,
  av.personality_config->>'vertical' as vertical,
  av.business_config->>'nome_negocio' as nome_negocio,
  av.tools_config as ferramentas,
  av.qualification_config->>'dor_principal' as dor_padrao
FROM agent_versions av
WHERE av.location_id = '{{location_id}}'
  AND av.is_active = true
LIMIT 1;
```

### 2. Node: Montar Perfil do Lead (Code)

```javascript
// Dados do agente
const agente = $input.first().json;

// Mapear vertical para perfil de lead
const perfis = {
  clinica_estetica: {
    nome_lead: "Mariana",
    idade: 38,
    genero: "feminino",
    dor_principal: "Quero melhorar minha aparência",
    dor_detalhada: "Tenho manchas no rosto que me incomodam muito, me sinto velha",
    budget: "R$ 3.000-8.000",
    objecoes: ["preco_alto", "medo_dor", "preciso_pensar"],
    ferramentas_esperadas: ["Busca_disponibilidade", "Criar_cobranca", "Escalar_humano"]
  },
  mentoria_medica: {
    nome_lead: "Dr. Carlos",
    idade: 35,
    genero: "masculino",
    dor_principal: "Quero crescer nas redes sociais",
    dor_detalhada: "Não consigo atrair pacientes pelo Instagram, meus colegas estão na frente",
    budget: "R$ 8.000-20.000",
    objecoes: ["tempo_para_estudar", "valor_alto", "preciso_pensar"],
    ferramentas_esperadas: ["Busca_disponibilidade", "Enviar_material", "Escalar_humano"]
  },
  consultoria_negocios: {
    nome_lead: "Roberto",
    idade: 42,
    genero: "masculino",
    dor_principal: "Minha empresa não tem processo de vendas",
    dor_detalhada: "Perco muitos clientes por falta de follow-up, não sei organizar o comercial",
    budget: "R$ 5.000-15.000",
    objecoes: ["preciso_pensar", "vou_falar_com_socio", "ja_tentei_consultoria"],
    ferramentas_esperadas: ["Busca_disponibilidade", "Escalar_humano"]
  },
  investimentos: {
    nome_lead: "Fernando",
    idade: 40,
    genero: "masculino",
    dor_principal: "Não sei onde investir meu dinheiro",
    dor_detalhada: "Tenho grana parada, inflação comendo, preciso de orientação",
    budget: "R$ 100.000-500.000",
    objecoes: ["preciso_pesquisar", "taxas_altas", "vou_comparar"],
    ferramentas_esperadas: ["Busca_disponibilidade", "Enviar_material", "Escalar_humano"]
  },
  marketing_digital: {
    nome_lead: "Patricia",
    idade: 36,
    genero: "feminino",
    dor_principal: "Minha empresa não aparece no Google",
    dor_detalhada: "Concorrentes estão bombando no Instagram e eu nada",
    budget: "R$ 3.000-8.000",
    objecoes: ["ja_tentei_agencia", "demora_resultado", "preco_alto"],
    ferramentas_esperadas: ["Busca_disponibilidade", "Escalar_humano"]
  }
};

// Pegar perfil baseado na vertical (ou default)
const vertical = agente.vertical || 'clinica_estetica';
const perfil = perfis[vertical] || perfis.clinica_estetica;

return {
  location_id: agente.location_id,
  agent_name: agente.agent_name,
  vertical: vertical,
  ...perfil
};
```

### 3. Node: Montar System Message (Code)

```javascript
const dados = $input.first().json;
const promptBase = $('Buscar Prompt QA').first().json.content; // buscar de onde estiver

const systemMessage = `
${promptBase}

---

## DADOS DO TESTE ATUAL

location_id: ${dados.location_id}
agente_nome: ${dados.agent_name}
vertical: ${dados.vertical}

## PERFIL DO LEAD

nome_lead: ${dados.nome_lead}
idade: ${dados.idade}
genero: ${dados.genero}
dor_principal: ${dados.dor_principal}
dor_detalhada: ${dados.dor_detalhada}
budget: ${dados.budget}
objecoes: ${dados.objecoes.join(', ')}
ferramentas_esperadas: ${dados.ferramentas_esperadas.join(', ')}

## CONTEXTO

fase_atual: 1
ferramentas_ja_usadas: nenhuma
`;

return { systemMessage };
```

### 4. Node: Chamar LLM (AI Agent ou HTTP Request)

```json
{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "system",
      "content": "{{$json.systemMessage}}"
    },
    {
      "role": "user",
      "content": "Mensagem do agente: {{$json.mensagem_agente}}\n\nHistórico: {{$json.historico}}"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 150
}
```

---

## Exemplo Completo de System Message Montado

```
# QA Agent Tester - Simulador de Leads

[... prompt base ...]

---

## DADOS DO TESTE ATUAL

location_id: cd1uyzpJox6XPt4Vct8Y
agente_nome: Diana Beauty School
vertical: clinica_estetica

## PERFIL DO LEAD

nome_lead: Mariana
idade: 38
genero: feminino
dor_principal: Quero melhorar minha aparência
dor_detalhada: Tenho manchas no rosto que me incomodam muito, me sinto velha
budget: R$ 3.000-8.000
objecoes: preco_alto, medo_dor, preciso_pensar
ferramentas_esperadas: Busca_disponibilidade, Criar_cobranca, Escalar_humano

## CONTEXTO

fase_atual: 1
ferramentas_ja_usadas: nenhuma
```

---

## User Message Template

```
Mensagem do agente: "Olá! Tudo bem? Sou a Diana da Beauty School 😊"

Histórico: null
```

---

## Como Controlar a Fase

A cada resposta do QA Agent, salve no histórico qual fase está e quais ferramentas foram usadas:

```javascript
// Após resposta do QA Agent
const respostaQA = $input.first().json.content;
const faseAtual = $('Estado Teste').first().json.fase || 1;
const ferramentasUsadas = $('Estado Teste').first().json.ferramentas || [];

// Detectar se agente usou ferramenta (analisar resposta do agente SDR)
const mensagemAgente = $('Resposta Agente SDR').first().json.content;

if (mensagemAgente.includes('verificando disponibilidade') || mensagemAgente.includes('agenda')) {
  ferramentasUsadas.push('Busca_disponibilidade');
}
if (mensagemAgente.includes('link de pagamento') || mensagemAgente.includes('pix')) {
  ferramentasUsadas.push('Criar_cobranca');
}
if (mensagemAgente.includes('vou transferir') || mensagemAgente.includes('humano')) {
  ferramentasUsadas.push('Escalar_humano');
}

// Avançar fase baseado no conteúdo
let novaFase = faseAtual;
if (respostaQA.includes('quero agendar')) novaFase = 6;
if (respostaQA.includes('falar com') && respostaQA.includes('humano')) novaFase = 7;

return {
  fase: novaFase,
  ferramentas: [...new Set(ferramentasUsadas)],
  historico: [...($('Estado Teste').first().json.historico || []), {
    role: 'qa_agent',
    content: respostaQA
  }]
};
```

---

## Tabela de Perfis por Vertical

| Vertical | nome_lead | dor | objecoes | ferramentas |
|----------|-----------|-----|----------|-------------|
| clinica_estetica | Mariana, 38, F | aparência, manchas | preco, dor, pensar | Busca, Cobranca, Escalar |
| mentoria_medica | Dr. Carlos, 35, M | redes, pacientes | tempo, valor, pensar | Busca, Material, Escalar |
| consultoria_negocios | Roberto, 42, M | vendas, processo | pensar, socio | Busca, Escalar |
| investimentos | Fernando, 40, M | investir, inflacao | pesquisar, taxas | Busca, Material, Escalar |
| marketing_digital | Patricia, 36, F | Google, Instagram | agencia, demora | Busca, Escalar |
