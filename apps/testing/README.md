# AI Factory - Time de Agentes Claude

Sistema de agentes Claude que replica os workflows do AI Factory (n8n) para comparação de resultados.

## Objetivo

Comparar resultados entre:
- **Workflows n8n**: Execução real dos fluxos no n8n
- **Agentes Claude**: Simulação dos mesmos fluxos com subagentes

## Arquitetura

```
┌─────────────────────────────────────────────────────────────────┐
│                    ORQUESTRADOR PRINCIPAL                       │
│                     (Claude Opus/Sonnet)                        │
└───────────────────────────┬─────────────────────────────────────┘
                            │
            ┌───────────────┼───────────────┐
            ▼               ▼               ▼
    ┌───────────────┐ ┌───────────────┐ ┌───────────────┐
    │   AGENTE 01   │ │   AGENTE 02   │ │   AGENTE 03   │
    │   Extrator    │ │   Analisador  │ │   Gerador     │
    │   de Dados    │ │   de Vendas   │ │   de Prompt   │
    └───────────────┘ └───────────────┘ └───────────────┘
            │               │               │
            ▼               ▼               ▼
    ┌───────────────────────────────────────────────────────────────┐
    │                    MEMÓRIA COMPARTILHADA                       │
    │                      (Supabase / JSON)                         │
    └───────────────────────────────────────────────────────────────┘
```

## Agentes Disponíveis

### Agente 01 - Extrator de Dados GHL
- **Função**: Extrai informações de contatos e conversas do GoHighLevel
- **Equivalente n8n**: Workflow 01 - Buscar Conversa + Analisar Contexto

### Agente 02 - Analisador de Vendas (Head de Vendas)
- **Função**: Analisa conversas e classifica leads usando BANT
- **Equivalente n8n**: Workflow 02 - AI Agent Head Vendas

### Agente 03 - Gerador de Prompts
- **Função**: Cria/otimiza prompts baseado em contexto de negócio
- **Equivalente n8n**: Workflow 03 - Prompt Factory

### Agente 04 - Validador (Testing Framework)
- **Função**: Testa e valida agentes gerados
- **Equivalente n8n**: Workflow 04 - Agent Tester

## Instalação

```bash
cd /Users/marcosdaniels/Projects/mottivme/ai-factory-agents
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

## Uso

### Executar Pipeline Completo
```bash
python orchestrator.py --input contact_id=ABC123 --pipeline full
```

### Executar Agente Individual
```bash
python orchestrator.py --agent agent_02 --input '{"contact_id": "ABC123"}'
```

### Comparar com n8n
```bash
python compare.py --workflow-id JiTZQcq7Tt2c5Xol --contact-id ABC123
```

## Estrutura de Arquivos

```
ai-factory-agents/
├── README.md
├── requirements.txt
├── config.yaml
├── orchestrator.py          # Orquestrador principal
├── compare.py               # Comparador n8n vs agentes
├── agents/
│   ├── __init__.py
│   ├── base_agent.py        # Classe base para agentes
│   ├── agent_01_extractor.py
│   ├── agent_02_analyzer.py
│   ├── agent_03_generator.py
│   └── agent_04_validator.py
├── tools/
│   ├── __init__.py
│   ├── ghl_client.py        # Cliente GoHighLevel
│   ├── supabase_client.py   # Cliente Supabase
│   └── n8n_client.py        # Cliente n8n
└── memory/
    ├── __init__.py
    └── shared_memory.py     # Memória compartilhada entre agentes
```

## Comparação de Resultados

O sistema permite comparar:
1. **Qualidade de análise**: Score do Head de Vendas (n8n vs Claude)
2. **Classificação de leads**: HOT/WARM/COLD/DISQUALIFIED
3. **Prompts gerados**: Similaridade e qualidade
4. **Tempo de execução**: Performance
5. **Custos**: API calls, tokens, etc

## Variáveis de Ambiente

```env
ANTHROPIC_API_KEY=sk-ant-...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
GHL_API_KEY=...
GHL_LOCATION_ID=...
N8N_URL=https://cliente-a1.mentorfy.io
N8N_API_KEY=eyJ...
```
