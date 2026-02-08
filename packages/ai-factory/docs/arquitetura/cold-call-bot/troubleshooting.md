# Troubleshooting

## Bugs Conhecidos e Soluções

| Bug | Sintoma | Causa | Fix |
|-----|---------|-------|-----|
| Voz corta mid-frase | IA para de falar no meio | Cartesia flush_audio bug #3669 | FixedCartesiaTTS subclass |
| Voz fina/grossa | Tom inconsistente | sample_rate mismatch | Auto-detect (remover hardcode) |
| Chamada não salva | 0 registros novos | asyncio.create_task + task.cancel | await antes de cancel |
| Custo $0 | cost_breakdown vazio | Usage metrics não capturados | TranscriptTrackingList |
| Status "unknown" | Dashboard mostra unknown | Outcome nunca setado | Inferência por duração/transcript |
| CORS blocked | Frontend não carrega dados | URL Vercel não na whitelist | Adicionar em allow_origins |
| duration error | INSERT falha silenciosamente | INTEGER vs FLOAT | ALTER COLUMN NUMERIC(10,2) |

## Como Debugar

### Supabase não salva
```bash
curl https://cold-call-bot-production.up.railway.app/debug/supabase-test
```

### Verificar últimos webhooks
```bash
curl https://cold-call-bot-production.up.railway.app/debug/last-webhook
```

### Verificar retry queue
```bash
curl https://cold-call-bot-production.up.railway.app/retry/queue
```
