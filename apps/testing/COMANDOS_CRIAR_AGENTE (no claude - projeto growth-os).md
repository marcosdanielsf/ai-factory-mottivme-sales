# Comandos para Criar Agentes - AI Factory

---

## 🚀 COMANDO MASTER (COLE NO CLAUDE)

```
/criar-agente-completo

Quero criar um agente Growth OS COMPLETO para um novo cliente usando TODO o sistema:

Perfil do cliente: [COLE O ARQUIVO OU CAMINHO]
Location ID: [ID DO GHL]
Calendar ID: [ID DA AGENDA]

Execute o PIPELINE COMPLETO com todos os 12 agentes:

1. PromptFactoryAgent → Criar os 7 prompts modulares
2. ValidatorAgent → Testar cada modo (5 dimensões)
3. Sistema de Debate:
   - CriticSalesAgent → Encontrar falhas
   - AdvocatePersuasionAgent → Propor melhorias
   - ExpertEmotionsAgent → Gatilhos emocionais
   - ExpertObjectionsAgent → Tratamento de objeções
   - ExpertRapportAgent → Conexão e rapport
   - JudgeConversionAgent → Decidir versão final
4. ScriptWriterAgent → Gerar roteiros de áudio/vídeo para follow-up
5. Salvar em sql/[nome]_v1_prompts_modulares.sql
6. Rodar testes E2E com Groq

Comando de terminal:
python create_agent_full_pipeline.py --profile "[CAMINHO]" --location "[ID]" --calendar "[ID]"
```

---

## Comando Rápido para o Claude

Cole isso no início da conversa para criar um novo agente:

```
/criar-agente

Quero criar um agente Growth OS completo para um novo cliente.

Perfil do cliente: [COLE O ARQUIVO DE PERFIL AQUI OU INFORME O CAMINHO]
Location ID: [ID DO GHL]
Calendar ID: [ID DA AGENDA]

Rode o sistema completo:
1. PromptFactoryAgent - gerar os 7 prompts por modo
2. ValidatorAgent - testar os prompts
3. ScriptWriterAgent - gerar roteiros de follow-up
4. Salvar SQL em sql/[nome_agente]_v1_prompts_modulares.sql
5. Rodar testes E2E com Groq
```

---

## Comandos de Terminal

### Criar Agente Simples (só prompts)
```bash
cd ~/Projects/mottivme/ai-factory-agents

python create_agent.py \
  --profile "/caminho/do/perfil.txt" \
  --location "LOCATION_ID" \
  --calendar "CALENDAR_ID"
```

### Criar Agente Completo (prompts + validação + scripts)
```bash
cd ~/Projects/mottivme/ai-factory-agents

python create_agent.py --full \
  --profile "/caminho/do/perfil.txt" \
  --location "LOCATION_ID" \
  --calendar "CALENDAR_ID" \
  --output "sql/"
```

### Testar Agente com Groq (barato)
```bash
cd ~/Projects/mottivme/ai-factory-agents

# Testes rápidos (7 cenários)
python run_groq_e2e_tests.py --agent "Nome do Agente" --no-save

# Testes completos INBOUND (5 cenários, 20 turnos cada)
python run_groq_e2e_tests.py --full --flow inbound --agent "Nome do Agente" --no-save
```

### Listar Agentes Disponíveis
```bash
python run_groq_e2e_tests.py --list-agents
```

---

## Exemplo Completo (Dra. Eline)

```bash
cd ~/Projects/mottivme/ai-factory-agents

# 1. Criar agente
python create_agent.py --full \
  --profile "/Users/marcosdaniels/Downloads/Dra Eliane.txt" \
  --location "pFHwENFUxjtiON94jn2k" \
  --calendar "yYjQWSpdlGorTcy3sLGj"

# 2. Executar SQL no Supabase (copiar e colar no SQL Editor)

# 3. Testar
python run_groq_e2e_tests.py --agent "Luna Eline" --no-save
```

---

## Variáveis de Ambiente Necessárias

```bash
# Claude (para criar agentes)
export ANTHROPIC_API_KEY="sk-ant-..."

# Groq (para testar barato)
export GROQ_API_KEY="gsk_..."

# Supabase (para salvar)
export SUPABASE_URL="https://bfumywvwubvernvhjehk.supabase.co"
export SUPABASE_KEY="eyJ..."
```

---

## Arquivos Gerados

Após rodar `--full`, o sistema gera:

| Arquivo | Conteúdo |
|---------|----------|
| `sql/[agente]_v1_prompts_modulares.sql` | SQL para inserir no Supabase |
| `sql/[agente]_scripts_followup.json` | Roteiros de áudio para WhatsApp |

---

## Pipeline Completo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Arquivo de     │────▶│ PromptFactory   │────▶│  ValidatorAgent │
│  Perfil (.txt)  │     │  Agent (Claude) │     │  (testa prompts)│
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                │                        │
                                ▼                        │
                        ┌─────────────────┐              │
                        │ ScriptWriter    │              │
                        │ (roteiros áudio)│              │
                        └─────────────────┘              │
                                │                        │
                                ▼                        ▼
                        ┌─────────────────────────────────────┐
                        │         Arquivos Gerados            │
                        │  • SQL (prompts_modulares.sql)      │
                        │  • Scripts (scripts_followup.json)  │
                        └─────────────────────────────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────────────┐
                        │      Supabase (agent_versions)      │
                        └─────────────────────────────────────┘
                                        │
                                        ▼
                        ┌─────────────────────────────────────┐
                        │     Testes E2E com Groq (barato)    │
                        └─────────────────────────────────────┘
```

---

## Custo Estimado

| Etapa | Modelo | Custo |
|-------|--------|-------|
| Criar agente | Claude Opus | ~$0.50-1.00 |
| Validar | Claude Sonnet | ~$0.10-0.20 |
| Scripts | Claude Sonnet | ~$0.10-0.20 |
| Testar (7 cenários) | Groq Llama | ~$0.30 |
| Testar FULL (17 cenários) | Groq Llama | ~$1.00 |

**Total por agente novo: ~$1.50-2.50**

---

## 🔄 MODO BATCH (Múltiplos Clientes)

### Opção 1: Pasta com arquivos separados
```bash
# Cada .txt na pasta vira um agente
python create_agents_batch.py \
  --folder "/pasta/com/perfis/" \
  --location "LOCATION_PADRAO" \
  --calendar "CALENDAR_PADRAO"
```

### Opção 2: Arquivo único com múltiplos clientes
```bash
# Separa pelo delimitador --- e cria um agente por seção
python create_agents_batch.py \
  --file "transcricao_call.txt" \
  --split
```

**Formato do arquivo com separador:**
```
CLIENTE: Dra. Fulana
LOCATION: location_id_1
CALENDAR: calendar_id_1

[transcrição/perfil da Dra. Fulana]

---

CLIENTE: Dr. Beltrano
LOCATION: location_id_2
CALENDAR: calendar_id_2

[transcrição/perfil do Dr. Beltrano]

---
```

### Opção 3: CSV com dados
```bash
python create_agents_batch.py --csv "clientes.csv"
```

**Formato do CSV:**
```csv
nome,location_id,calendar_id,perfil_path
Dra. Fulana,loc123,cal123,/path/perfil_fulana.txt
Dr. Beltrano,loc456,cal456,/path/perfil_beltrano.txt
```
