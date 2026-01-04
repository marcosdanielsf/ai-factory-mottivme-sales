# PATCH: Adicionar ao System Message do Nó 1.7

## ONDE ADICIONAR
No nó **1.7 AI - Analisar Kickoff (GHL Architect V2)**
Na seção **Options > System Message**
Adicionar NO INÍCIO do prompt existente

---

## TEXTO PARA ADICIONAR (COPIAR E COLAR)

```
## ⚠️ REGRAS CRÍTICAS ANTI-ALUCINAÇÃO (LER PRIMEIRO!)

### CLIENTE ATUAL
VOCÊ ESTÁ ANALISANDO O CLIENTE: {{ $json.nome_lead }}
TELEFONE: {{ $json.telefone_lead }}

### REGRA ABSOLUTA
O campo "nome_negocio" no seu output JSON DEVE ser:
- O nome "{{ $json.nome_lead }}" OU
- Um nome extraído DIRETAMENTE da transcrição abaixo

### PROIBIÇÕES
❌ NUNCA use nomes de outros clientes que você possa ter visto
❌ NUNCA invente nomes como "Dra. Eline Lobo", "Dr. João", etc. que NÃO estão na transcrição
❌ NUNCA use dados de exemplos anteriores para este cliente

### VERIFICAÇÃO OBRIGATÓRIA
Antes de gerar o output, verifique:
1. O nome_negocio que você vai usar aparece na transcrição? ✓
2. O nome_negocio corresponde a "{{ $json.nome_lead }}"? ✓
3. Você NÃO está usando dados de outro cliente? ✓

Se QUALQUER verificação falhar, use "{{ $json.nome_lead }}" como nome_negocio.

---

```

---

## TEXTO PARA O USER MESSAGE (INÍCIO)

```
## 🎯 DADOS DO CLIENTE - USE EXATAMENTE ESTES

| Campo | Valor |
|-------|-------|
| **NOME DO CLIENTE** | {{ $json.nome_lead }} |
| **TELEFONE** | {{ $json.telefone_lead }} |
| **CONTACT ID** | {{ $json.contact_id }} |

⚠️ ATENÇÃO: O agente que você criar é para "{{ $json.nome_lead }}", NÃO para qualquer outro cliente.

---

## TRANSCRIÇÃO DA CALL DE KICKOFF

{{ $json.texto_transcricao }}

---

## DADOS DO CLIENTE (repetindo para ancoragem)
- Nome: {{ $json.nome_lead }}

```

---

## CONFIGURAÇÃO ADICIONAL

### Reduzir Temperature
No nó Groq Llama 3.3 70B, mudar:
- **De:** `temperature: 0.3`
- **Para:** `temperature: 0.1`

Isso reduz criatividade/alucinações.

---

## FLUXO ATUALIZADO

```
1.6 Preparar Dados
      ↓
1.7 AI - Analisar Kickoff (COM PATCH)
      ↓
[NOVO] 1.8 Validar Alucinação
      ↓
2.1 Processar Análise
```

---

## COMO TESTAR

1. **Reexecutar** o workflow com a transcrição do "Dr Luiz e Mariana"
2. **Verificar** se output contém "Dr Luiz" e NÃO "Dra. Eline"
3. **Verificar logs** do nó 1.8 para ver se validação passou

### Resultado Esperado:
```json
{
  "business_context": {
    "nome_negocio": "Dr Luiz e Mariana Carvalho Giareta",  // ✅ CORRETO
    ...
  }
}
```

### Resultado ERRADO (alucinação):
```json
{
  "business_context": {
    "nome_negocio": "Clínica da Dra. Eline Lobo",  // ❌ ERRADO
    ...
  }
}
```
