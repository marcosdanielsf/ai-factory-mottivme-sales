# PRE-PROCESSADOR DE TRANSCRICAO

## PROBLEMA

Transcricoes brutas de calls contem muito "lixo" que confunde a IA:
- Timestamps repetitivos
- Marcacoes tecnicas
- Ruidos transcritos ("hum", "ah", "eh")
- Repeticoes de fala
- Informacoes irrelevantes (boas vindas genericas, despedidas)

## SOLUCAO

Um no de pre-processamento que:
1. Limpa o texto
2. Identifica falantes
3. Extrai metadados
4. Estrutura a transcricao de forma otimizada

---

## IMPLEMENTACAO: CODIGO N8N (Code Node)

```javascript
// PRE-PROCESSADOR DE TRANSCRICAO PARA AI HEAD DE VENDAS
// Versao: 1.0

const transcricaoBruta = $input.first().json.transcricao || $input.first().json.content || '';
const metadados = $input.first().json.metadados || {};

// ==========================================
// 1. LIMPEZA BASICA
// ==========================================

function limparTexto(texto) {
  return texto
    // Remove timestamps no formato [00:00:00] ou (00:00)
    .replace(/\[\d{1,2}:\d{2}(:\d{2})?\]/g, '')
    .replace(/\(\d{1,2}:\d{2}(:\d{2})?\)/g, '')

    // Remove marcadores tecnicos comuns
    .replace(/\[inaudivel\]/gi, '')
    .replace(/\[INAUDIBLE\]/gi, '')
    .replace(/\[musica\]/gi, '')
    .replace(/\[silencio\]/gi, '')
    .replace(/\[risos\]/gi, '[RISO]') // Mantem mas padroniza

    // Remove ruidos de fala (mas mantem alguns que indicam hesitacao)
    .replace(/\b(hum|humm|hummm|hmm|hmmm)\b/gi, '')
    .replace(/\b(eh|ehh|ehhh|ahn|ahnnn)\b/gi, '')
    .replace(/\b(tipo assim|ne|entendeu)\b/gi, '') // Vicios de linguagem

    // Remove repeticoes imediatas (gagueira/correcao)
    .replace(/(\b\w+\b)( \1){2,}/gi, '$1')

    // Normaliza espacos
    .replace(/\s+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// ==========================================
// 2. IDENTIFICACAO DE FALANTES
// ==========================================

function identificarFalantes(texto) {
  // Padroes comuns de identificacao de falante
  const padroes = [
    /^(Vendedor|Seller|Closer|SDR|Consultor):/gmi,
    /^(Cliente|Lead|Prospect|Paciente):/gmi,
    /^(Speaker \d+):/gmi,
    /^([A-Z][a-z]+ [A-Z][a-z]+):/gm, // Nome completo
    /^([A-Z][a-z]+):/gm // Primeiro nome
  ];

  const falantes = new Set();

  for (const padrao of padroes) {
    const matches = texto.match(padrao);
    if (matches) {
      matches.forEach(m => falantes.add(m.replace(':', '').trim()));
    }
  }

  return Array.from(falantes);
}

function normalizarFalantes(texto, falantes) {
  let textoNormalizado = texto;

  // Mapeia falantes para roles padrao
  const mapaRoles = {};

  falantes.forEach(falante => {
    const falanteLower = falante.toLowerCase();

    if (falanteLower.includes('vendedor') ||
        falanteLower.includes('seller') ||
        falanteLower.includes('closer') ||
        falanteLower.includes('sdr') ||
        falanteLower.includes('consultor')) {
      mapaRoles[falante] = 'VENDEDOR';
    } else if (falanteLower.includes('cliente') ||
               falanteLower.includes('lead') ||
               falanteLower.includes('prospect') ||
               falanteLower.includes('paciente')) {
      mapaRoles[falante] = 'CLIENTE';
    } else {
      // Assume primeiro falante = vendedor, segundo = cliente
      if (Object.values(mapaRoles).filter(v => v === 'VENDEDOR').length === 0) {
        mapaRoles[falante] = 'VENDEDOR';
      } else {
        mapaRoles[falante] = 'CLIENTE';
      }
    }
  });

  // Substitui no texto
  for (const [original, normalizado] of Object.entries(mapaRoles)) {
    const regex = new RegExp(`^${original}:`, 'gm');
    textoNormalizado = textoNormalizado.replace(regex, `${normalizado}:`);
  }

  return { texto: textoNormalizado, mapa: mapaRoles };
}

// ==========================================
// 3. EXTRACAO DE METADADOS DA CALL
// ==========================================

function extrairMetadados(texto) {
  const metadados = {
    duracao_estimada: null,
    mencoes_preco: [],
    mencoes_concorrente: [],
    mencoes_prazo: [],
    sentimento_geral: null,
    tem_objecao: false,
    tem_compromisso: false
  };

  // Detecta mencoes a preco/valor
  const regexPreco = /R\$\s*[\d.,]+|(\d+)\s*(mil|k|reais|mes)/gi;
  const mencoes = texto.match(regexPreco);
  if (mencoes) metadados.mencoes_preco = [...new Set(mencoes)];

  // Detecta objecoes comuns
  const objecoes = [
    /preciso pensar/gi,
    /vou avaliar/gi,
    /ta caro/gi,
    /muito caro/gi,
    /nao tenho (budget|orcamento|dinheiro)/gi,
    /ja tentei/gi,
    /nao sei se/gi
  ];

  for (const regex of objecoes) {
    if (regex.test(texto)) {
      metadados.tem_objecao = true;
      break;
    }
  }

  // Detecta compromissos
  const compromissos = [
    /vamos fechar/gi,
    /pode mandar (o contrato|a proposta)/gi,
    /quero comecar/gi,
    /fechado/gi,
    /combinado/gi,
    /pode agendar/gi
  ];

  for (const regex of compromissos) {
    if (regex.test(texto)) {
      metadados.tem_compromisso = true;
      break;
    }
  }

  // Estima duracao (conta paragrafos/falas)
  const falas = texto.split(/\n/).filter(l => l.trim().length > 0);
  // Aproximadamente 30 segundos por fala
  metadados.duracao_estimada = Math.round(falas.length * 0.5) + ' minutos';

  return metadados;
}

// ==========================================
// 4. ESTRUTURACAO FINAL
// ==========================================

function estruturarParaIA(texto, metadadosExtraidos) {
  // Divide em blocos de fala
  const linhas = texto.split('\n').filter(l => l.trim().length > 0);

  const blocos = [];
  let blocoAtual = null;

  for (const linha of linhas) {
    const matchFalante = linha.match(/^(VENDEDOR|CLIENTE):/);

    if (matchFalante) {
      if (blocoAtual) blocos.push(blocoAtual);
      blocoAtual = {
        falante: matchFalante[1],
        texto: linha.replace(/^(VENDEDOR|CLIENTE):/, '').trim()
      };
    } else if (blocoAtual) {
      blocoAtual.texto += ' ' + linha.trim();
    }
  }

  if (blocoAtual) blocos.push(blocoAtual);

  // Formata para o prompt
  let textoFormatado = '=== TRANSCRICAO DA CALL ===\n\n';

  // Adiciona metadados no inicio
  textoFormatado += `DURACAO ESTIMADA: ${metadadosExtraidos.duracao_estimada}\n`;
  if (metadadosExtraidos.mencoes_preco.length > 0) {
    textoFormatado += `VALORES MENCIONADOS: ${metadadosExtraidos.mencoes_preco.join(', ')}\n`;
  }
  textoFormatado += `OBJECAO DETECTADA: ${metadadosExtraidos.tem_objecao ? 'SIM' : 'NAO'}\n`;
  textoFormatado += `COMPROMISSO DETECTADO: ${metadadosExtraidos.tem_compromisso ? 'SIM' : 'NAO'}\n`;
  textoFormatado += '\n---\n\n';

  // Adiciona falas numeradas
  blocos.forEach((bloco, index) => {
    textoFormatado += `[${index + 1}] ${bloco.falante}: ${bloco.texto}\n\n`;
  });

  return textoFormatado;
}

// ==========================================
// EXECUCAO
// ==========================================

// 1. Limpa o texto
const textoLimpo = limparTexto(transcricaoBruta);

// 2. Identifica e normaliza falantes
const falantes = identificarFalantes(textoLimpo);
const { texto: textoNormalizado, mapa: mapaFalantes } = normalizarFalantes(textoLimpo, falantes);

// 3. Extrai metadados
const metadadosExtraidos = extrairMetadados(textoNormalizado);

// 4. Estrutura para a IA
const transcricaoProcessada = estruturarParaIA(textoNormalizado, metadadosExtraidos);

// 5. Calcula reducao
const reducaoPercentual = Math.round((1 - transcricaoProcessada.length / transcricaoBruta.length) * 100);

// Output
return [{
  json: {
    transcricao_original_chars: transcricaoBruta.length,
    transcricao_processada_chars: transcricaoProcessada.length,
    reducao_percentual: reducaoPercentual + '%',
    falantes_identificados: falantes,
    mapa_falantes: mapaFalantes,
    metadados: {
      ...metadados,
      ...metadadosExtraidos
    },
    transcricao_processada: transcricaoProcessada,

    // Para debug
    _debug: {
      texto_limpo_preview: textoLimpo.substring(0, 500) + '...'
    }
  }
}];
```

---

## USO NO WORKFLOW N8N

### Posicao no Fluxo:
```
Google Drive (arquivo)
    → Extrair Texto (Google Docs API)
    → [PRE-PROCESSADOR] ← Este no
    → AI Agent (Head de Vendas)
    → Salvar Analise
```

### Inputs Esperados:
```json
{
  "transcricao": "texto bruto da call...",
  "metadados": {
    "arquivo_id": "xxx",
    "data_call": "2026-01-01",
    "vendedor": "Nome",
    "cliente": "Nome"
  }
}
```

### Outputs:
```json
{
  "transcricao_processada": "=== TRANSCRICAO DA CALL ===\n\nDURACAO ESTIMADA: 35 minutos\n...",
  "reducao_percentual": "42%",
  "metadados": {
    "duracao_estimada": "35 minutos",
    "mencoes_preco": ["R$ 5.000", "12 mil"],
    "tem_objecao": true,
    "tem_compromisso": false
  }
}
```

---

## BENEFICIOS

1. **Reducao de Tokens**: 30-50% menos tokens enviados para a IA
2. **Maior Precisao**: IA recebe texto limpo e estruturado
3. **Metadados Pre-extraidos**: IA ja sabe se tem objecao, valores, etc
4. **Falantes Normalizados**: Sempre VENDEDOR/CLIENTE, facil de referenciar
5. **Falas Numeradas**: Facilita citacoes especificas

---

## PROXIMOS PASSOS

1. [ ] Implementar no workflow 02-AI-Agent-Head-Vendas.json
2. [ ] Testar com 5-10 transcricoes reais
3. [ ] Ajustar regexes conforme padroes encontrados
4. [ ] Adicionar deteccao de mais objecoes especificas do BPOSS
