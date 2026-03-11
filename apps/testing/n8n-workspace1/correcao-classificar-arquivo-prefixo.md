# Correção Nó: Classificar Arquivo por Prefixo

**Data:** 2026-01-04
**Workflow:** 01-Monitor-Pasta-Calls (Orquestrador)
**Problema:** Telefone internacional (+1) sendo convertido para brasileiro (+55)

---

## Problema

O número `+1 781 689 1605` (americano) estava sendo convertido para `+5517816891605` (brasileiro), causando:
1. Busca no GHL não encontrava o contato
2. `contact_id` vinha `null`
3. Workflow 02 falhava com erro 404

---

## Código Corrigido

Substituir TODO o código do nó `Classificar Arquivo por Prefixo`:

```javascript
// IDs das pastas de destino
const pastasIds = {
  '1. Vendas': '1yr256LwbLKJZ5HzHgC7Zq25MrSOKTQEs',
  '2. Onboarding': '1JS87Zs1bRSiNKjqVPTZ3GkfCvMnUj8PO',
  '3. Revisao': '1psAln8h2Il5ic6U8Nv8UhRWt6RNbnmyQ',
  '4. Suporte': '15Q6LzE0Mujxj-Q8lqNjx8rmRjVyUx0Kw',
  '5. Churn': '1G56zGj8N6mhdS7nZH77mtK15wGDFV8kk',
  '6. Outros': '1Z0Zdo05XxtBhIe8mwUUkgGsld3PanHKU'
};

const config = {
  prefixos: {
    'DIAGNOSTICO': { pasta: '1. Vendas', tipo: 'diagnostico' },
    'DIAG_': { pasta: '1. Vendas', tipo: 'diagnostico' },
    'KICKOFF': { pasta: '2. Onboarding', tipo: 'kickoff' },
    'KICK_': { pasta: '2. Onboarding', tipo: 'kickoff' },
    'ACOMPANHAMENTO': { pasta: '3. Revisao', tipo: 'acompanhamento' },
    'ACOMP_': { pasta: '3. Revisao', tipo: 'acompanhamento' },
    'REVISAO': { pasta: '3. Revisao', tipo: 'revisao' },
    'REV_': { pasta: '3. Revisao', tipo: 'revisao' },
    'ALINHAMENTO': { pasta: '3. Revisao', tipo: 'alinhamento' },
    'ALINH_': { pasta: '3. Revisao', tipo: 'alinhamento' },
    'SUPORTE': { pasta: '4. Suporte', tipo: 'suporte' },
    'SUP_': { pasta: '4. Suporte', tipo: 'suporte' },
    'CHURN': { pasta: '5. Churn', tipo: 'churn' },
    'CHURN_': { pasta: '5. Churn', tipo: 'churn' }
  },
  fallback: { pasta: '6. Outros', tipo: 'outro' },
  notificacaoContactId: 'Ql1qBRN8GTemuG0BlM0F',
  defaultLocationId: 'cd1uyzpJox6XPt4Vct8Y'
};

const arquivo = $input.first().json;
const nomeArquivo = arquivo.name || '';

// Remover emojis do nome para processamento
const nomeClean = nomeArquivo.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '').trim();
const nomeUpper = nomeClean.toUpperCase();

// Identificar prefixo
let prefixoEncontrado = null;
let configDestino = config.fallback;

for (const [prefixo, cfg] of Object.entries(config.prefixos)) {
  if (nomeUpper.startsWith(prefixo) || nomeUpper.includes(' ' + prefixo + ' ') || nomeUpper.includes(prefixo + ' ')) {
    prefixoEncontrado = prefixo.replace('_', '');
    configDestino = cfg;
    break;
  }
}

// Extrair partes do nome separadas por ' - '
let partes = nomeClean.split(' - ').map(p => p.trim());

// Funções de identificação
const isPhone = (s) => /^\+?[\d\s]{10,}$/.test(s.replace(/[^\d\s+]/g, '')) || s.startsWith('+');
const isLocationId = (s) => /^[a-zA-Z0-9]{15,25}$/.test(s) && /[a-zA-Z]/.test(s) && !/^\+/.test(s);
const isDate = (s) => /\d{4}-\d{2}-\d{2}/.test(s) || /\d{2}-\d{2}-\d{4}/.test(s);
const isSequentialNumber = (s) => /^\d{1,4}$/.test(s);
const isTipo = (s) => Object.keys(config.prefixos).some(p => s.toUpperCase().includes(p.replace('_', '')));
const isCopia = (s) => s.toLowerCase().startsWith('copia de') || s.toLowerCase().startsWith('cópia de');

let nome = '';
let telefoneOriginal = ''; // Manter o formato original com +
let telefone = '';
let telefoneFormatado = '';
let locationId = '';
let partesNome = [];

for (const parte of partes) {
  if (isSequentialNumber(parte)) continue;
  if (isCopia(parte)) continue;
  if (isDate(parte)) continue;
  if (isTipo(parte) && !nome) continue;

  if (isPhone(parte) && !telefone) {
    // CORREÇÃO: Preservar o telefone original ANTES de limpar
    telefoneOriginal = parte.trim();
    telefone = parte.replace(/[^0-9]/g, '');
  } else if (isLocationId(parte) && !locationId) {
    locationId = parte;
  } else if (!isTipo(parte) && !isSequentialNumber(parte)) {
    partesNome.push(parte);
  }
}

// Juntar partes do nome
nome = partesNome.join(' ').trim();

// CORREÇÃO: Formatar telefone preservando o código do país original
if (telefone.length >= 10) {
  const isGHLGroupId = telefone.startsWith('120363') || telefone.length > 15;

  if (isGHLGroupId) {
    // Grupo do WhatsApp GHL
    telefoneFormatado = '+' + telefone;
  } else if (telefoneOriginal.startsWith('+')) {
    // CORREÇÃO: Se o original tinha +, usar o número limpo com +
    // Detectar se é internacional (não BR)
    if (telefoneOriginal.startsWith('+1 ') || (telefoneOriginal.startsWith('+1') && !telefoneOriginal.startsWith('+15') && telefone.startsWith('1'))) {
      // Número americano/canadense (+1)
      telefoneFormatado = '+' + telefone;
    } else if (telefoneOriginal.startsWith('+55') || telefoneOriginal.startsWith('+55 ')) {
      // Número brasileiro
      telefoneFormatado = '+' + telefone;
    } else {
      // Outro país - manter como está
      telefoneFormatado = '+' + telefone;
    }
  } else {
    // Sem + no original, assumir brasileiro
    const telefoneLimpo = telefone.startsWith('0') ? telefone.substring(1) : telefone;
    // Se já começa com 55, não duplicar
    if (telefoneLimpo.startsWith('55') && telefoneLimpo.length > 11) {
      telefoneFormatado = '+' + telefoneLimpo;
    } else {
      telefoneFormatado = '+55' + telefoneLimpo;
    }
  }
}

// Usar locationId padrão se não encontrou
if (!locationId) locationId = config.defaultLocationId;

const nomeLimpo = nomeClean;
const temNome = nome.length > 0;
const temTelefone = telefone.length >= 10;
const dadosCompletos = temNome && temTelefone;

const notificacaoNecessaria = prefixoEncontrado !== null && !dadosCompletos;

const resultado = {
  arquivo: {
    id: arquivo.id,
    nome: nomeArquivo,
    nomeLimpo: nomeLimpo,
    mimeType: arquivo.mimeType,
    createdTime: arquivo.createdTime,
    webViewLink: arquivo.webViewLink
  },
  classificacao: {
    prefixo: prefixoEncontrado,
    tipo: configDestino.tipo,
    pastaDestino: configDestino.pasta,
    pastaDestinoId: pastasIds[configDestino.pasta],
    reconhecido: prefixoEncontrado !== null
  },
  dadosExtraidos: {
    nome: nome,
    telefone: telefone,
    telefoneOriginal: telefoneOriginal, // NOVO: preservar original para debug
    telefoneFormatado: telefoneFormatado,
    locationId: locationId,
    temNome: temNome,
    temTelefone: temTelefone,
    dadosCompletos: dadosCompletos
  },
  notificacao: {
    necessaria: notificacaoNecessaria,
    contactId: config.notificacaoContactId,
    mensagem: notificacaoNecessaria
      ? `Arquivo com dados incompletos: ${nomeArquivo}. Falta: ${!temNome ? 'Nome' : ''} ${!temTelefone ? 'Telefone' : ''}. Movido para /${configDestino.pasta}/`
      : null
  }
};

return [{ json: resultado }];
```

---

## O Que Foi Corrigido

| Entrada | Antes (ERRADO) | Depois (CORRETO) |
|---------|----------------|------------------|
| `+1 781 689 1605` | `+5517816891605` | `+17816891605` |
| `+55 11 99999-9999` | `+5555119999999` | `+5511999999999` |
| `11 99999-9999` | `+5511999999999` | `+5511999999999` |
| `+120363406157741216` | `+120363406157741216` | `+120363406157741216` |

---

## Lógica de Formatação

1. **Grupo WhatsApp GHL** (`120363...`): Mantém como `+120363...`
2. **Número com `+` original**: Preserva o código do país
3. **Número sem `+`**: Assume brasileiro e adiciona `+55`
4. **Número já com `55`**: Não duplica o código

---

## Checklist

- [ ] Substituir código no nó `Classificar Arquivo por Prefixo`
- [ ] Salvar workflow
- [ ] Testar com arquivo de telefone internacional
- [ ] Verificar se `contact_id` é encontrado no GHL
