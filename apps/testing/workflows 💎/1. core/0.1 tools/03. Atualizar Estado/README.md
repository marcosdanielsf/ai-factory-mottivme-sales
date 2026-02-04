# Atualizar Estado - Tool de AI Agent

## Visão Geral

`Atualizar Estado` é uma **ferramenta (tool) de AI Agent** utilizada pelo agente **SDR1** no fluxo de conversação principal de GHL. Ela permite que o agente atualize automaticamente o campo customizado `estado_onde_mora` de um contato quando este informa em qual estado dos EUA ele reside.

## Metadados

| Propriedade | Valor |
|------------|-------|
| **Nome** | Atualizar Estado |
| **Tipo** | n8n Langchain Tool |
| **Node ID** | `86e12cd6-8080-451c-8d5c-56e375724640` |
| **Versão** | 1.0 |
| **TypeVersion** | 2.2 |

## Descrição

**Do próprio nó:**
> "Atualizar o estado onde o lead mora (estado_onde_mora). Use esta tool quando o lead informar em qual estado dos EUA ele reside. Valores aceitos: nomes dos estados americanos (ex: Florida, California, Texas, New York, etc). Campo ID customizado no GHL."

## Parâmetros de Entrada

| ID | Display Name | Tipo | Descrição |
|-----|----------|------|-----------|
| `API_KEY` | API_KEY | string | Chave da API do GHL (extraída de Info.api_key) |
| `contact_id` | contact_id | string | ID do lead no GHL (extraído de Info.lead_id) |
| `location_id` | location_id | string | ID da location no GHL (extraído de Info.location_id) |
| `estadoValue` | estadoValue | string | Estado informado pelo lead (ex: Florida) |

## Fluxo de Execução

1. **SDR1** detecta menção de estado na conversa
2. IA extrai o nome do estado (ex: "Florida")
3. Chama **Atualizar Estado** como AI Tool
4. Recebe os 4 parâmetros
5. Executa workflow delegado: wsQQYmx8CLNBHoWq
6. Campo `estado_onde_mora` é atualizado no GHL
7. Resultado retorna ao SDR1

## Conexões

### Incoming
- **Origem**: SDR1 (AI Agent)
- **Tipo**: ai_tool
- **Índice**: 0

### Outgoing
- **Destino**: Retorna ao SDR1
- **Tipo**: Resultado da execução

## Workflow Delegado

| Propriedade | Valor |
|------------|-------|
| **Nome** | Atualizar Estado GHL (Otimizado) |
| **ID** | `wsQQYmx8CLNBHoWq` |

## Estados Aceitos

Alabama, Alaska, Arizona, Arkansas, California, Colorado, Connecticut, Delaware, Florida, Georgia, Hawaii, Idaho, Illinois, Indiana, Iowa, Kansas, Kentucky, Louisiana, Maine, Maryland, Massachusetts, Michigan, Minnesota, Mississippi, Missouri, Montana, Nebraska, Nevada, New Hampshire, New Jersey, New Mexico, New York, North Carolina, North Dakota, Ohio, Oklahoma, Oregon, Pennsylvania, Rhode Island, South Carolina, South Dakota, Tennessee, Texas, Utah, Vermont, Virginia, Washington, West Virginia, Wisconsin, Wyoming

## Posição no Canvas

```
Position: [38400, 28000]
Local: Área de tools do fluxo
```

## Troubleshooting

**Erro: Estado inválido**
- Validar que estadoValue tem nome completo em inglês

**Erro: API Key inválida**
- Verificar se Info node está retornando dados corretos

**Erro: Contact ID não encontrado**
- Verificar se lead_id é válido no GHL

## Referências

- Workflow Principal: 0.1 - Fluxo Principal de Conversasão - GHL - Versionado.json
- AI Agent: SDR1 (n8n Langchain Agent v2.2)
- Arquivo Config: tool-config.json

## Histórico

| Versão | Data | Mudanças |
|--------|------|----------|
| 1.0 | 2026-01-26 | Extração inicial e documentação |

---

**Última atualização**: 2026-01-26
**Extraído de**: Fluxo Principal de Conversasão - GHL - Versionado

