# Correções de Segurança - SQL Injection e Validação

## ✅ CONCLUÍDO - Todas as correções implementadas

## Arquivos Modificados

### 1. ✅ Novo arquivo de validação criado
**`src/lib/validation.ts`**
- `validateTableName()` - Valida nomes de tabelas (regex + length)
- `validateColumnName()` - Valida nomes de colunas
- `validateOperator()` - Valida operadores contra whitelist
- `sanitizeForLog()` - Remove valores sensíveis de SQL para logs
- `getSafeErrorMessage()` - Esconde detalhes de erro em produção

### 2. ✅ Arquivos de API corrigidos

#### `src/app/api/rls/[table]/route.ts`
**Correções implementadas:**
- ✅ Validação de table name em TODOS os métodos (GET, POST, DELETE, PATCH)
- ✅ Validação de policy name
- ✅ Validação de command (whitelist: SELECT, INSERT, UPDATE, DELETE, ALL)
- ✅ Validação de boolean no PATCH
- ✅ Mensagens de erro NÃO expõem SQL em produção
- ✅ Uso seguro de identifier quoting APÓS validação rigorosa

**Proteção contra SQL Injection:**
```typescript
// ANTES - VULNERÁVEL:
const sql = `WHERE c.relname = '${table}'`; // ❌ Direto na query

// DEPOIS - SEGURO:
if (!validateTableName(table)) {
  return NextResponse.json({ error: "Invalid table name" }, { status: 400 });
}
const sql = `WHERE c.relname = '${table}'`; // ✅ Validado antes
```

#### `src/app/api/data/[table]/route.ts`
**Correções implementadas:**
- ✅ Validação de table name em TODOS os métodos
- ✅ Validação de column names (filtros E ordenação)
- ✅ Validação de operadores (whitelist de 10 operadores seguros)
- ✅ Validação de primary key
- ✅ Mensagens de erro seguras
- ✅ Suporte ao operador 'in' (arrays)

**Proteção contra SQL Injection via filtros:**
```typescript
// Valida TODOS os filtros antes de aplicar
for (const filter of filters) {
  if (!validateColumnName(filter.column)) {
    return NextResponse.json(
      { error: `Invalid column name: ${filter.column}` },
      { status: 400 }
    );
  }
  if (!validateOperator(filter.operator)) {
    return NextResponse.json(
      { error: `Invalid operator: ${filter.operator}` },
      { status: 400 }
    );
  }
}
```

#### `src/app/api/query/route.ts`
**Correções implementadas:**
- ✅ Status 409 Conflict quando requer confirmação (HTTP semântico correto)
- ✅ Mensagens de erro seguras (sem exposição de stack trace)

**Antes vs Depois:**
```typescript
// ANTES: Status 200 para confirmação (confuso)
return NextResponse.json({ requiresConfirmation: true }, { status: 200 });

// DEPOIS: Status 409 Conflict (semântico correto)
return NextResponse.json({ requiresConfirmation: true }, { status: 409 });
```

#### `src/app/api/schema/[table]/route.ts`
**Correções implementadas:**
- ✅ Validação de table name
- ✅ Mensagens de erro seguras

#### `src/app/api/schema/route.ts`
**Correções implementadas:**
- ✅ Mensagens de erro seguras

#### `src/app/api/rls/route.ts`
**Correções implementadas:**
- ✅ Validação de table name no POST
- ✅ Validação de tipo boolean
- ✅ Mensagens de erro seguras

## Validações Implementadas

### 1. Table Name Validation
```typescript
validateTableName(table: string): boolean
```
- **Regex:** `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- **Max length:** 63 caracteres (limite PostgreSQL)
- **Previne:** 
  - SQL injection via table name
  - Caracteres especiais maliciosos
  - Comandos SQL embutidos

**Exemplos:**
```typescript
validateTableName("users")        // ✅ true
validateTableName("user_profiles") // ✅ true
validateTableName("users; DROP TABLE users--") // ❌ false
validateTableName("123users")      // ❌ false (começa com número)
```

### 2. Column Name Validation
```typescript
validateColumnName(column: string): boolean
```
- **Regex:** `/^[a-zA-Z_][a-zA-Z0-9_]*$/`
- **Max length:** 63 caracteres
- **Previne:** SQL injection via column name

### 3. Operator Validation
```typescript
validateOperator(op: string): op is ValidOperator
```
- **Whitelist:** `['eq', 'neq', 'gt', 'lt', 'gte', 'lte', 'like', 'ilike', 'in', 'is']`
- **Previne:** Injeção de operadores SQL maliciosos

**Exemplos:**
```typescript
validateOperator("eq")          // ✅ true
validateOperator("like")        // ✅ true
validateOperator("OR 1=1--")    // ❌ false
validateOperator("AND")         // ❌ false
```

### 4. Error Message Sanitization
```typescript
getSafeErrorMessage(error: unknown): string {
  if (process.env.NODE_ENV === 'development') {
    return error instanceof Error ? error.message : String(error);
  }
  return 'Internal error'; // ✅ Não expõe detalhes em produção
}
```

## Testes de Segurança Recomendados

### 1. ✅ Test SQL Injection via Table Name
```bash
# Tentativa de SQL injection
curl -X GET 'http://localhost:3000/api/data/users"; DROP TABLE users--'

# Esperado: 400 Bad Request
# Response: {"error":"Invalid table name"}
```

### 2. ✅ Test SQL Injection via Column Name
```bash
# Tentativa de injection via sortColumn
curl -X GET 'http://localhost:3000/api/data/users?sortColumn=id; DROP TABLE users--'

# Esperado: 400 Bad Request
# Response: {"error":"Invalid sort column name"}
```

### 3. ✅ Test Operator Injection
```bash
# Tentativa de injection via operador
curl -X POST 'http://localhost:3000/api/data/users' \
  -H 'Content-Type: application/json' \
  -d '{"filters":[{"column":"id","operator":"OR 1=1--","value":"1"}]}'

# Esperado: 400 Bad Request
# Response: {"error":"Invalid operator: OR 1=1--"}
```

### 4. ✅ Test Query Confirmation Status
```bash
# Query perigosa sem confirmação
curl -X POST 'http://localhost:3000/api/query' \
  -H 'Content-Type: application/json' \
  -d '{"sql":"DELETE FROM users WHERE id=1"}'

# Esperado: 409 Conflict (NÃO 200)
# Response: {"requiresConfirmation":true,...}
```

### 5. ✅ Test Error Message in Production
```bash
# Configurar NODE_ENV=production
NODE_ENV=production npm start

# Request a tabela inexistente
curl -X GET 'http://localhost:3000/api/data/nonexistent_table'

# Esperado em DEV: details com mensagem completa do erro
# Esperado em PROD: details: "Internal error"
```

## Abordagem de Segurança

### Por que validação + identifier quoting é seguro?

1. **Validação rigorosa ANTES do SQL:**
   - Regex garante apenas caracteres seguros: `[a-zA-Z0-9_]`
   - Length limit previne ataques de buffer

2. **Identifier quoting DEPOIS da validação:**
   ```typescript
   // Após validateTableName(table) passar:
   const sql = `SELECT * FROM "${table}"` // ✅ Seguro
   ```

3. **Nenhum valor de usuário em WHERE sem sanitização:**
   - Valores de filtros passam pelo Supabase SDK (prepared statements)
   - Apenas identificadores (table/column) na query string
   - Identificadores validados contra regex rigoroso

### Arquitetura de defesa em camadas:

```
Camada 1: Validação de entrada (validateTableName, validateColumnName)
    ↓
Camada 2: Whitelist de operadores (validateOperator)
    ↓
Camada 3: Identifier quoting (double quotes PostgreSQL)
    ↓
Camada 4: Supabase SDK (prepared statements para valores)
    ↓
Camada 5: Error sanitization (getSafeErrorMessage)
```

## Status Final

✅ **Código compila sem erros TypeScript**
✅ **Todas as validações implementadas**
✅ **Mensagens de erro seguras (dev vs prod)**
✅ **Status codes HTTP semânticos corretos**
✅ **Nenhuma dependência de funções inexistentes (exec_sql_with_params removido)**
✅ **Abordagem validação + identifier quoting (segura e funcional)**
✅ **@ts-expect-error apenas onde necessário, com comentários explicativos**

## Próximos Passos (Opcional - Melhorias Futuras)

1. **Rate limiting** nas APIs de query
2. **Audit log** para queries perigosas executadas
3. **WAF rules** no nível de infraestrutura
4. **Prepared statements** nativos se disponíveis no Supabase
5. **CSP headers** para proteção XSS adicional

## Notas Importantes

⚠️ **ATENÇÃO:** Este projeto usa identifier quoting (`"${table}"`) APÓS validação rigorosa. Isso é **SEGURO** porque:
- `validateTableName()` aceita APENAS `[a-zA-Z_][a-zA-Z0-9_]*`
- Comprimento máximo de 63 caracteres
- Impossível injetar SQL após passar pela validação

✅ **MELHOR ABORDAGEM:** Validar entrada rigorosamente, depois usar identifiers seguros.
