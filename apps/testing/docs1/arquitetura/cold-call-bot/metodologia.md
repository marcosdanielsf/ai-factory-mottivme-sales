# Metodologia de Sub-Agentes

## O Padrão

```
1. DIAGNOSTICAR (5 min)
   curl/grep direto nas APIs e código
   
2. DECOMPOR
   Identificar tarefas paralelas vs seriais
   
3. SPAWNAR com contexto PRECISO
   Cada agente: arquivos, schemas, APIs, design system
   
4. INTEGRAR
   Wire imports, TypeScript check, commit + push
   
5. VALIDAR
   curl endpoints, feedback visual do usuário
```

## Quando Spawnar Paralelo
- Tasks independentes (hook + componentes)
- Research com ângulos diferentes (3 pesquisadores)
- Backend + Frontend + DB simultâneo

## Quando Fazer Serial  
- Task B depende do output de Task A
- Integração final (sempre manual)

## 6 Regras

1. **Contrato antes de spawnar** — Defina interfaces/props antes
2. **Diagnóstico antes de delegar** — 5min de curl vale 30min de agente
3. **Research triangulado** — 3 ângulos > 1 genérico
4. **Dica direcional** — Se suspeita da causa, diga pro agente
5. **Tag antes de deploy** — git tag pra rollback
6. **Error state sempre visível** — Nunca retornar null silencioso
