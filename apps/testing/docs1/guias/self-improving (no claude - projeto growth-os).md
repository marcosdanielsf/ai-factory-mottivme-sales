# Self-Improving: Como Funciona

O sistema de auto-melhoria permite que os agentes evoluam automaticamente com base em feedback real.

## Conceito

```
Conversa Real --> Avaliacao --> Reflexao --> Novo Prompt --> Deploy
```

## Workflows Envolvidos

| Workflow | Papel |
|----------|-------|
| 08 - QA Analyst | Avalia qualidade das conversas |
| 09 - Reflection Loop | Identifica padroes de erro |
| 10 - AI as Judge | Pontua precisao das sugestoes |
| 11 - Prompt Updater | Gera versao melhorada |
| 13 - Feedback Loop | Aplica em producao |

## Ciclo de Melhoria

### 1. Coleta de Dados
- QA Analyst roda diariamente
- Avalia conversas dos ultimos 7 dias
- Calcula scores por dimensao

### 2. Identificacao de Padroes
- Reflection Loop analisa conversas com score < 6.0
- Agrupa por tipo de erro
- Gera sugestoes de melhoria

### 3. Validacao
- AI as Judge avalia sugestoes
- Pontua confianca (0-100)
- Filtra sugestoes fracas

### 4. Geracao de Prompt
- Prompt Updater recebe sugestoes validadas
- Gera nova versao do prompt
- Mantem changelog

### 5. Deploy
- Feedback Loop aplica novo prompt
- Monitora performance
- Rollback se necessario

## Metricas

| Metrica | Descricao | Meta |
|---------|-----------|------|
| Score Medio | Media das avaliacoes | > 7.5 |
| Taxa de Melhoria | % de melhoria por ciclo | > 5% |
| Confianca | Score do AI Judge | > 80 |

## Configuracao

```sql
-- Tabela de versoes de prompt
SELECT * FROM prompt_versions
WHERE agent_id = 'xxx'
ORDER BY version DESC
LIMIT 5;
```

## Alertas

- Score < 6.0: Notificacao no Slack
- Score < 4.0: Pausa agente para revisao
- 3 versoes sem melhoria: Revisao manual
