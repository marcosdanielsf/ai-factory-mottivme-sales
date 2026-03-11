# Tool: Atualizar Profissão

## Resumo
Esta tool é responsável por atualizar o campo de profissão/ocupação de um contato (lead) no GoHighLevel (GHL). Ela extrai a informação de profissão da conversa e a armazena no campo customizado `profissao` do contato.

## Tipo de Node
- **Node Type**: `@n8n/n8n-nodes-langchain.toolWorkflow`
- **Type Version**: 2.2
- **Node ID**: `b87b9a93-7da5-47d2-afe3-793d3540701e`

## Descrição Técnica
A tool funciona como um wrapper para um workflow externo no n8n que:
1. Recebe os dados de autenticação (API_KEY, location_id, contact_id)
2. Extrai a profissão informada pelo lead durante a conversa
3. Atualiza o campo customizado de profissão no contato via API do GHL
4. Retorna confirmação da operação

## Integração GHL
- **Campo Customizado**: `profissao`
- **Tipo de Atualização**: custom_field_update
- **Entidade Alvo**: contact (contato/lead)
- **Fonte de Dados**: Extração automatizada pela IA a partir da conversa

## Inputs (Parâmetros)

### 1. API_KEY
- **Tipo**: String
- **Obrigatório**: Não (mapeado automaticamente)
- **Descrição**: Chave da API GHL do usuário
- **Exemplo**: `sk-xxx`
- **Mapeamento**: `$(Info).first().json.api_key`

### 2. location_id
- **Tipo**: String
- **Obrigatório**: Não (mapeado automaticamente)
- **Descrição**: ID da localização/sub-account no GHL
- **Exemplo**: `ABC123`
- **Mapeamento**: `$(Info).first().json.location_id`

### 3. contact_id
- **Tipo**: String
- **Obrigatório**: Não (mapeado automaticamente)
- **Descrição**: ID do contato/lead no GHL
- **Exemplo**: `CONTACT123`
- **Mapeamento**: `$(Info).first().json.lead_id`

### 4. profissaoValue
- **Tipo**: String
- **Obrigatório**: Não (extraído via AI)
- **Descrição**: Profissão informada pelo lead
- **Exemplo**: `Engenheiro de Software`, `Médico - Cardiologia`, `Empresário`
- **Mapeamento**: `$fromAI('profissaoValue', 'Profissão informada pelo lead', 'string')`

## Workflow Associado
- **ID**: `Kq3b79P6v4rTsiaH`
- **Nome**: "Atualizar Campo Profissão GHL (Auto-Config)"
- **Função**: Gerencia a integração com a API do GHL para atualizar campos customizados

## Conexões

### Inbound
Não existe conexão de entrada direta. Esta tool é chamada como resultado da análise do agente SDR.

### Outbound
- **Destinação**: `SDR1`
- **Tipo de Conexão**: `ai_tool`
- **Index**: 0
- **Uso**: Esta ferramenta é disponibilizada para o agente SDR como uma opção para atualizar informações de profissão durante a conversa

## Casos de Uso

### Caso 1: Atualizar Profissão Simples
**Input**:
```json
{
  "API_KEY": "sk-xxx",
  "location_id": "ABC123",
  "contact_id": "CONTACT123",
  "profissaoValue": "Engenheiro de Software"
}
```
**Resultado**: Campo profissao atualizado com "Engenheiro de Software"

### Caso 2: Atualizar Profissão com Especialidade
**Input**:
```json
{
  "API_KEY": "sk-xxx",
  "location_id": "ABC123",
  "contact_id": "CONTACT123",
  "profissaoValue": "Médico - Cardiologia"
}
```
**Resultado**: Campo profissao atualizado com "Médico - Cardiologia"

### Caso 3: Atualizar Profissão de Empresário
**Input**:
```json
{
  "API_KEY": "sk-xxx",
  "location_id": "ABC123",
  "contact_id": "CONTACT123",
  "profissaoValue": "Empresário - Consultoria"
}
```
**Resultado**: Campo profissao atualizado com "Empresário - Consultoria"

## Como Funciona em Contexto

1. **Detecção**: O agente SDR detecta durante a conversa que o lead informou sua profissão
2. **Extração**: A IA extrai automaticamente o valor da profissão usando `$fromAI()`
3. **Chamada**: A tool "Atualizar Profissão" é invocada com os parâmetros necessários
4. **Atualização**: O workflow externo atualiza o campo customizado no GHL via API
5. **Confirmação**: O sistema confirma que o campo foi atualizado com sucesso

## Fluxo no Workflow Principal

No workflow "0.1 - Fluxo Principal de Conversasão - GHL - Versionado":
- A tool está posicionada em coordenadas: X=38272, Y=28000
- É chamada pelo agente `SDR1` como uma das ferramentas disponíveis
- Funciona em conjunto com outras tools de atualização (Estado, Agendamento, etc)

## Integração com Sistema de Leads

Esta tool faz parte do sistema integrado de qualificação e atualização de leads:
- Complementa a ferramenta "Atualizar Estado" (qualificação)
- Trabalha junto com "Atualizar Agendamento" (próximos passos)
- Fornece enriquecimento de dados para relatórios e análises

## Requisitos

- API key válida do GoHighLevel
- Location ID do sub-account
- Contact ID do lead a ser atualizado
- Acesso ao campo customizado "profissao" configurado no GHL

## Tratamento de Erros

Possíveis erros e resoluções:
- **API_KEY inválida**: Verifique as credenciais no nó "Info"
- **Contact_id não encontrado**: Confirme se o lead existe no GHL
- **Location_id incorreto**: Valide o ID do sub-account
- **Campo não existe**: Certifique-se que o campo customizado "profissao" está criado no GHL

## Performance

- **Tipo**: Assíncrono via workflow externo
- **Overhead**: Mínimo (apenas chamada de API)
- **Timeout**: Padrão do n8n (5 minutos)

## Versioning

- **Versão Atual**: 2.2 (TypeVersion do node)
- **Última Atualização**: 26 jan 2026
- **Status**: Ativo e em produção

## Referências

- [GoHighLevel API Docs](https://docs.gohighlevel.com/)
- [n8n Workflow Nodes](https://docs.n8n.io/)
- Workflow Externo: `Kq3b79P6v4rTsiaH`

