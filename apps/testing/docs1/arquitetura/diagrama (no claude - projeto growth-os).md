# Diagrama de Fluxos

## Fluxo Principal

```
Call Google Meet/Zoom
       |
       v
01-Organizador-Calls (classifica e move)
       |
       v
03-Call-Analyzer-Onboarding (cria agente com validacao)
       |
       v
04-Agent-Factory (provisiona no GHL)
       |
       v
05-Execution-Modular (roda em producao)
       |
       v
08-QA-Analyst (monitora qualidade)
       |
       v
09-Reflection-Loop -> 11-Prompt-Updater (auto-melhora)
```

## Fluxo Self-Improving

```
Conversa Finalizada
       |
       v
08-QA-Analyst (avalia conversas)
       |
       +--> Score < 6.0? --> Alerta
       |
       v
09-Reflection-Loop (identifica padroes)
       |
       v
10-AI-as-Judge (pontua precisao)
       |
       v
11-Prompt-Updater (gera novo prompt)
       |
       v
13-Feedback-Loop (aplica em producao)
```

## Fluxo Multi-Tenant

```
Mensagem WhatsApp
       |
       v
12-Multi-Tenant-Classifier
       |
       +--> Cliente A --> Agente A
       |
       +--> Cliente B --> Agente B
       |
       +--> Cliente C --> Agente C
```

## Detalhes por Workflow

| # | Workflow | Trigger | Output |
|---|----------|---------|--------|
| 01 | Organizador Calls | Webhook GDrive | Pasta organizada |
| 02 | Head de Vendas | Schedule | Analise semanal |
| 03 | Call Analyzer | 01 finalizado | Agente criado |
| 04 | Agent Factory | 03 finalizado | Agente no GHL |
| 05 | Execution | Webhook GHL | Resposta enviada |
| 06 | Call Revisao | Schedule | Agentes revisados |
| 07 | Engenheiro | Manual | Prompt otimizado |
| 08 | QA Analyst | Schedule | Score calculado |
| 09 | Reflection | 08 finalizado | Padroes identificados |
| 10 | AI Judge | 09 finalizado | Score de precisao |
| 11 | Prompt Updater | 10 finalizado | Novo prompt |
| 12 | Classifier | Webhook | Cliente identificado |
| 13 | Feedback Loop | 11 finalizado | Prompt aplicado |
