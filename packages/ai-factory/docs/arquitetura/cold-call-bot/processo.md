# Processo de Construção

## Timeline

### Dia 1 (06/02): Fundação
- Decisão: pipecat open source em vez de VAPI (custo 50% menor)
- Setup: Railway + Supabase + GitHub
- Primeiro pipeline: Deepgram → OpenAI → ElevenLabs
- Problemas: latência alta, voz robótica

### Dia 2 (07/02): MVP Funcional
- Migração ElevenLabs → Cartesia (latência 90ms vs 300ms)
- Primeira chamada real funcionando
- GHL function calling (6 tools)
- Deploy Railway com auto-deploy
- Custo: ~$0.04/min (vs $0.08 VAPI)

### Dia 3 (08/02): Produção
- **15 sub-agentes** em paralelo
- Dashboard de custos (4 cards + donut chart + tabela)
- 6 fixes de voice quality
- Sistema de retry com cadência progressiva
- Drill-down por dia com Score IA
- ~25 commits em 6 horas

## Métricas Finais
| Métrica | Valor |
|---------|-------|
| Sub-agentes usados | ~15 |
| Commits | ~25 |
| Bugs corrigidos | 8 |
| Features entregues | 4 |
| Tempo total | ~6h (dia 3) |
