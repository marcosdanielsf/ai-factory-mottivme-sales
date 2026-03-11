# 🚀 Multi-Agent Orchestration System

**Status:** ✅ 100% Implementado e Testado
**Versão:** 1.0.0
**Data:** 31/12/2025

---

## 📖 Navegação Rápida

👉 **[00_START_HERE.md](00_START_HERE.md)** - **COMECE AQUI!**

Outros documentos:
- [QUICKSTART.md](QUICKSTART.md) - Setup em 5 minutos
- [COMMANDS.md](COMMANDS.md) - Referência de comandos
- [README.md](README.md) - Arquitetura técnica
- [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) - Integração com Dashboard
- [STATUS.md](STATUS.md) - Status completo e roadmap

---

## ⚡ Quick Start (30 segundos)

```bash
cd .swarm

# Testar estrutura (sem credenciais)
./test-structure.sh

# Configurar (com credenciais)
cp .env.example .env
nano .env  # Adicione SUPABASE_URL, SUPABASE_SERVICE_KEY, ANTHROPIC_API_KEY

# Rodar
./orchestrator.sh
```

---

## 🎯 O Que É Isso?

Sistema de **múltiplos agentes especializados** que trabalham 24/7 para:

✅ **Testar automaticamente** novas versões de prompts usando Claude Opus 4.5
✅ **Calcular métricas** de conversão e performance
✅ **Sincronizar dados** com o Dashboard via API REST
✅ **Logar conversas** em tempo real
✅ **Gerar scores 0-10** em 6 dimensões de qualidade

---

## 🤖 Agentes Disponíveis

### 1. AI Quality Judge (`ai_judge_agent.py`)
- **Função:** Testes automáticos de qualidade
- **Trigger:** Versões com `status = 'pending_approval'`
- **Output:** Scores 0-10 em 6 dimensões
- **Modelo:** Claude Opus 4.5

### 2. Analytics Engine (`analytics_agent.py`)
- **Função:** Cálculo de métricas de negócio
- **Métricas:** Conversion rate, avg interactions
- **Atualiza:** `agent_versions` com dados calculados

### 3. Dashboard Sync Agent (`webhook_sync_agent.py`)
- **Função:** API REST para comunicação
- **Porta:** 5000
- **Endpoints:** 5 (test, scores, status, logs, metrics)

---

## 📊 Contrato de Dados

### Scores Gerados (0-10)
```json
{
  "score_overall": 8.5,
  "score_dimensions": {
    "tone": 9.0,
    "engagement": 8.5,
    "compliance": 7.5,
    "accuracy": 10.0,
    "empathy": 8.0,
    "efficiency": 7.0
  }
}
```

### Tabelas Usadas
- `agent_versions` - Write: scores, status, métricas
- `agenttest_runs` - Write: resultados de testes
- `ai_factory_conversations` - Write: logs de conversas
- `ai_factory_leads` - Read: cálculo de conversão

---

## 🔗 API Endpoints

Base URL: `http://localhost:5000`

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/agents/test-version` | Triggerar teste manual |
| GET | `/api/agents/<id>/scores` | Buscar scores |
| PATCH | `/api/agents/<id>/status` | Aprovar versão |
| POST | `/api/conversations/log` | Logar conversa |
| GET | `/api/dashboard/metrics` | Métricas agregadas |
| GET | `/health` | Health check |

---

## 📁 Estrutura

```
.swarm/
├── agents/                      # Agentes Python
│   ├── ai_judge_agent.py
│   ├── analytics_agent.py
│   └── webhook_sync_agent.py
│
├── orchestrator.sh              # Script principal
├── test-structure.sh            # Teste estrutura
├── test-integration.sh          # Teste end-to-end
│
├── requirements.txt             # Dependencies
├── .env.example                 # Config template
│
└── docs/                        # Documentação
    ├── 00_START_HERE.md
    ├── QUICKSTART.md
    ├── COMMANDS.md
    ├── README.md
    ├── INTEGRATION_GUIDE.md
    └── STATUS.md
```

---

## 🚀 Comandos Principais

```bash
# Iniciar tudo
./orchestrator.sh

# Parar tudo
./orchestrator.sh stop

# Ver logs
tail -f logs/*.log

# Health check
curl http://localhost:5000/health

# Teste estrutura
./test-structure.sh
```

---

## ✅ Validação

Execute para verificar que tudo está correto:

```bash
./test-structure.sh
```

**Resultado esperado:**
```
✅ STRUCTURE TEST PASSED
```

---

## 🎯 Integração com Dashboard

O Dashboard **JÁ FUNCIONA** automaticamente! Ele consome via hooks do Supabase:

- `useDashboardMetrics()` → `vw_dashboard_metrics`
- `useTestResults()` → `agenttest_runs`
- `useAgentPerformance()` → `vw_agent_performance_summary`

**Nenhum código adicional necessário no frontend!**

---

## 📚 Mais Informações

Para documentação completa, leia:

1. **[00_START_HERE.md](00_START_HERE.md)** - Navegação e overview
2. **[QUICKSTART.md](QUICKSTART.md)** - Setup detalhado
3. **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** - Como integrar

---

## 🆘 Problemas?

1. Rode `./test-structure.sh` para diagnosticar
2. Verifique logs em `logs/`
3. Consulte **[QUICKSTART.md](QUICKSTART.md)** seção Troubleshooting

---

**Desenvolvido para MOTTIVME - AI Factory Project** 🚀
