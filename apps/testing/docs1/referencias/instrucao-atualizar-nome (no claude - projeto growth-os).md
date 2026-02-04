# INSTRUÇÃO PARA ADICIONAR NO PROMPT DO AGENTE

## REGRA DE NOME DO LEAD (Adicionar nas regras do prompt)

```markdown
## 🔄 REGRA DE ATUALIZAÇÃO DE NOME

### QUANDO ATUALIZAR O NOME:
O campo NOME DO CLIENTE pode vir errado (ex: "obrigado deus", "user123", nome do Instagram).

**SEMPRE verifique se o nome faz sentido.** Se parecer:
- Username de rede social
- Frase aleatória
- Nome genérico (ex: "Lead", "Cliente", "User")
- Texto religioso ou emoji

**→ Pergunte o nome LOGO NO INÍCIO da conversa:**
"Oi! Antes de continuar, como posso te chamar? 💜"

### QUANDO O LEAD INFORMAR O NOME:
1. Use a ferramenta `Atualizar_nome` para salvar o nome correto
2. A partir daí, use o nome que o lead informou (NÃO o do placeholder)

### PARÂMETROS DA FERRAMENTA:
| Parâmetro | Descrição | Exemplo |
|-----------|-----------|---------|
| primeiro_nome | Primeiro nome do lead | "Carlos" |
| sobrenome | Sobrenome (opcional) | "Silva" |

### EXEMPLO DE USO:
```
Lead: "Oi, meu nome é Carlos Silva"
→ Chame: Atualizar_nome(primeiro_nome="Carlos", sobrenome="Silva")
→ Responda: "Prazer, Carlos! Como posso te ajudar hoje? 💜"
```

### ⚠️ IMPORTANTE:
- **NUNCA** continue chamando pelo nome errado depois que o lead informar o correto
- **SEMPRE** atualize o nome no sistema antes de continuar a conversa
- Se o lead só informar o primeiro nome, deixe sobrenome vazio
```

---

## COMO ADICIONAR NO WORKFLOW N8N

### 1. Importar a ferramenta
Importe o arquivo `Atualizar Nome GHL.json` no n8n como subworkflow.

### 2. Adicionar como tool do agente
No nó de ferramentas do agente (AI Agent ou similar), adicione:

```json
{
  "name": "Atualizar_nome",
  "description": "Atualiza o nome do lead no GHL quando o nome atual está errado ou o lead informar o nome correto. Use quando: (1) O nome do lead parecer username de rede social, (2) O lead informar um nome diferente do cadastrado, (3) O nome atual for genérico ou não fizer sentido.",
  "parameters": {
    "type": "object",
    "properties": {
      "primeiro_nome": {
        "type": "string",
        "description": "Primeiro nome do lead (obrigatório)"
      },
      "sobrenome": {
        "type": "string",
        "description": "Sobrenome do lead (opcional)"
      }
    },
    "required": ["primeiro_nome"]
  }
}
```

### 3. Conectar ao subworkflow
Configure o tool para chamar o subworkflow `Atualizar Nome GHL` passando:
- API_KEY: do contexto
- location_id: do contexto
- contact_id: do contexto
- primeiro_nome: do parâmetro
- sobrenome: do parâmetro
