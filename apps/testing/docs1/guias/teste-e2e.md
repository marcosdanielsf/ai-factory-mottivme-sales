# Teste End-to-End do Self-Improving

Guia para validar o ciclo completo de auto-melhoria.

## Pre-requisitos

- Workflows 08, 09, 10, 11, 13 ativos
- Agente de teste criado
- Conversas de teste no banco

## Passo 1: Inserir Conversa de Teste

```sql
INSERT INTO conversations (
  agent_id,
  contact_id,
  messages,
  status,
  created_at
) VALUES (
  'agent-teste-001',
  'contact-teste',
  '[{"role":"user","content":"oi"},{"role":"assistant","content":"resposta ruim"}]',
  'completed',
  NOW()
);
```

## Passo 2: Rodar QA Analyst

```bash
# Via webhook
curl -X POST https://n8n.socialfy.me/webhook/qa-analyst \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "agent-teste-001"}'
```

Verificar:
- Score gerado
- Registro em `qa_evaluations`

## Passo 3: Disparar Reflection Loop

```bash
curl -X POST https://n8n.socialfy.me/webhook/reflection-loop \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "agent-teste-001"}'
```

Verificar:
- Padroes identificados em `reflection_patterns`
- Sugestoes geradas

## Passo 4: Validar com AI Judge

```bash
curl -X POST https://n8n.socialfy.me/webhook/ai-judge \
  -H "Content-Type: application/json" \
  -d '{"pattern_id": "xxx"}'
```

Verificar:
- Score de confianca
- Registro em `judge_evaluations`

## Passo 5: Gerar Novo Prompt

```bash
curl -X POST https://n8n.socialfy.me/webhook/prompt-updater \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "agent-teste-001"}'
```

Verificar:
- Nova versao em `prompt_versions`
- Changelog correto

## Passo 6: Aplicar em Producao

```bash
curl -X POST https://n8n.socialfy.me/webhook/feedback-loop \
  -H "Content-Type: application/json" \
  -d '{"agent_id": "agent-teste-001", "version": "xxx"}'
```

Verificar:
- Prompt atualizado no agente
- Registro em `prompt_deployments`

## Checklist Final

- [ ] Conversa inserida
- [ ] QA avaliou com score
- [ ] Reflection identificou padroes
- [ ] Judge validou sugestoes
- [ ] Novo prompt gerado
- [ ] Prompt aplicado

## Troubleshooting

| Problema | Causa | Solucao |
|----------|-------|---------|
| Score nao gerado | Workflow pausado | Ativar workflow 08 |
| Padroes vazios | Threshold alto | Ajustar threshold |
| Prompt nao aplicado | Versao antiga | Verificar version_id |
