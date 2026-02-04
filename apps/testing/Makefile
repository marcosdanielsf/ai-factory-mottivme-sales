# AI Factory Agents - Makefile
# ============================

.PHONY: install test quick-test run status compare help

# Default target
help:
	@echo "AI Factory Agents - Comandos Disponíveis"
	@echo "========================================"
	@echo ""
	@echo "  make install     - Instalar dependências"
	@echo "  make test        - Executar teste rápido"
	@echo "  make status      - Verificar configuração"
	@echo "  make run         - Executar pipeline (requer CONTACT_ID)"
	@echo "  make compare     - Comparar com n8n (requer WORKFLOW_ID e CONTACT_ID)"
	@echo "  make list-agents - Listar agentes disponíveis"
	@echo "  make list-pipes  - Listar pipelines"
	@echo ""
	@echo "Exemplos:"
	@echo "  make run CONTACT_ID=abc123"
	@echo "  make compare WORKFLOW_ID=xyz CONTACT_ID=abc123"

# Instalação
install:
	pip install -r requirements.txt
	@echo ""
	@echo "Instalação concluída!"
	@echo "Configure o arquivo .env com suas credenciais"

# Teste rápido (mock)
test:
	python test_quick.py

quick-test: test

# Status do sistema
status:
	python runner.py status

# Listar agentes
list-agents:
	python orchestrator.py list-agents

# Listar pipelines
list-pipes:
	python orchestrator.py list-pipelines

# Executar para um contato
run:
ifndef CONTACT_ID
	$(error CONTACT_ID não definido. Use: make run CONTACT_ID=xxx)
endif
	python runner.py run --contact-id $(CONTACT_ID) --pipeline $(or $(PIPELINE),full)

# Executar batch
batch:
	python runner.py batch --limit $(or $(LIMIT),10) --pipeline $(or $(PIPELINE),full)

# Comparar com n8n
compare:
ifndef WORKFLOW_ID
	$(error WORKFLOW_ID não definido)
endif
ifndef CONTACT_ID
	$(error CONTACT_ID não definido)
endif
	python runner.py compare --workflow-id $(WORKFLOW_ID) --contact-id $(CONTACT_ID)

# Limpar cache
clean:
	find . -type d -name __pycache__ -exec rm -rf {} +
	find . -type f -name "*.pyc" -delete
	rm -rf .pytest_cache
	rm -rf results/*.json

# Docker (para futuro)
docker-build:
	docker build -t ai-factory-agents .

docker-run:
	docker run -it --env-file .env ai-factory-agents
