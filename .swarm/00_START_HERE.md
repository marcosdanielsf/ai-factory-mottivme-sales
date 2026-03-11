# 🎯 COMECE AQUI - AI Factory Multi-Agent System

**Última atualização:** 31 de Dezembro de 2025
**Status:** ✅ 100% Completo e Pronto para Produção

---

## 📚 Guia de Navegação

Escolha o documento certo para o que você precisa:

| Documento | Quando Usar | Tempo |
|-----------|-------------|-------|
| **[QUICKSTART.md](QUICKSTART.md)** | Quero configurar e rodar AGORA | 5-10 min |
| **[COMMANDS.md](COMMANDS.md)** | Preciso de comandos rápidos | 1 min |
| **[README.md](README.md)** | Entender a arquitetura técnica | 10 min |
| **[INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md)** | Integrar com o Dashboard | 15 min |
| **[STATUS.md](STATUS.md)** | Ver o que foi feito e próximos passos | 5 min |

---

## ⚡ Quick Start (3 Passos)

### 1️⃣ Teste de Estrutura (SEM credenciais)
```bash
cd .swarm
./test-structure.sh
```
**Resultado:** ✅ STRUCTURE TEST PASSED

### 2️⃣ Configure Credenciais
```bash
cp .env.example .env
nano .env  # Adicione suas keys
```

### 3️⃣ Inicie os Agentes
```bash
./orchestrator.sh
```

**Pronto!** Seus agentes estão rodando 24/7 🚀

---

## 🤖 O Que Este Sistema Faz

### Torre de Controle (Dashboard Frontend)
- ✅ Visualiza métricas em tempo real
- ✅ Gráficos de evolução e performance
- ✅ Radar de dimensões de qualidade
- ✅ Aprovação de versões

### Operários do Backend (Agentes)

1. **🧪 AI Quality Judge**
   - Monitora versões pendentes automaticamente
   - Testa usando Claude Opus 4.5
   - Gera scores 0-10 em 6 dimensões
   - Salva resultados no Supabase

2. **📊 Analytics Engine**
   - Calcula taxa de conversão
   - Média de interações até goal
   - Atualiza métricas automaticamente

3. **🔗 Dashboard Sync Agent**
   - API REST (porta 5000)
   - Endpoints para Dashboard
   - Logs de conversas em tempo real
   - Health checks

---

## 🎯 Arquitetura Simplificada

```
Dashboard (Frontend)
       ↓ ↑
   Supabase DB
       ↓ ↑
API Server (Flask)
       ↓ ↑
┌──────┴──────┐
│  AI Judge   │  Analytics  │  Knowledge
└─────────────┘
```

---

## 📁 Arquivos Importantes

### Scripts Executáveis
- `orchestrator.sh` - Inicia/para todos os agentes
- `test-structure.sh` - Testa estrutura (sem credenciais)
- `test-integration.sh` - Teste end-to-end completo

### Agentes Python
- `agents/ai_judge_agent.py` - Testes automáticos
- `agents/analytics_agent.py` - Métricas
- `agents/webhook_sync_agent.py` - API Server

### Configuração
- `.env.example` - Template de credenciais
- `requirements.txt` - Dependências Python
- `agent-orchestrator-config.json` - Config do swarm

### Documentação
- `README.md` - Docs técnicas completas
- `QUICKSTART.md` - Setup rápido
- `COMMANDS.md` - Referência de comandos
- `INTEGRATION_GUIDE.md` - Integração com Dashboard
- `STATUS.md` - Status e roadmap

---

## 🚀 Comandos Mais Usados

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

## ✅ Checklist de Setup

- [ ] Clonar repositório
- [ ] Navegar para `.swarm/`
- [ ] Rodar `./test-structure.sh`
- [ ] Copiar `.env.example` → `.env`
- [ ] Adicionar credenciais no `.env`
- [ ] Instalar deps: `pip3 install -r requirements.txt`
- [ ] Rodar `./test-integration.sh` (opcional)
- [ ] Iniciar: `./orchestrator.sh`
- [ ] Verificar logs: `tail -f logs/*.log`
- [ ] Abrir Dashboard: `http://localhost:3000`

---

## 🆘 Ajuda Rápida

### Não funciona?
1. Leia o **QUICKSTART.md**
2. Rode `./test-structure.sh` para diagnosticar
3. Verifique os logs em `logs/`

### Dúvidas técnicas?
1. Consulte **README.md** para arquitetura
2. Veja **INTEGRATION_GUIDE.md** para API
3. Use **COMMANDS.md** para referência rápida

### Quer entender o que foi feito?
Leia **STATUS.md** para ver:
- ✅ O que está completo (100%)
- 📋 Próximos passos opcionais
- 🎯 Roadmap futuro

---

## 🎉 Você Tem Agora

✅ **3 agentes especializados** rodando em paralelo
✅ **API REST completa** (5 endpoints)
✅ **Automação 24/7** de testes e métricas
✅ **Scores 0-10** em 6 dimensões de qualidade
✅ **Integração automática** com Dashboard via Supabase
✅ **Template n8n** para workflows avançados
✅ **850+ linhas** de documentação

---

## 📞 Suporte

**Projeto:** AI Factory - Assembly Line
**Empresa:** MOTTIVME
**Desenvolvido para:** Marcos Daniels

---

**🚀 COMECE AGORA:** Abra [QUICKSTART.md](QUICKSTART.md) e siga os passos!
