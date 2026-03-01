#!/usr/bin/env node
/**
 * Mega Brain Ingest — Ingestão universal de conteúdo no Mega Brain
 * Suporta: arquivo local (.pdf, .mp3, .mp4, .txt, .csv, .json, .xlsx, .md)
 *          URL (youtube.com, docs.google.com, webpage genérica)
 *
 * Usage:
 *   node scripts/mega-brain-ingest.mjs --url "https://youtube.com/watch?v=xxx" --title "Live Finch"
 *   node scripts/mega-brain-ingest.mjs --file ./doc.pdf --title "Manual Vendas" --author "Marcos"
 *   node scripts/mega-brain-ingest.mjs --file ./dados.csv --title "Leads Q1" --type spreadsheet
 */

import { parseArgs } from 'node:util';
import { readFile, writeFile, unlink, access } from 'node:fs/promises';
import { execSync } from 'node:child_process';
import { join, extname, basename } from 'node:path';
import { tmpdir } from 'node:os';
import { createReadStream } from 'node:fs';

// ─── Configuração ──────────────────────────────────────────────────────────────

const CHUNK_SIZE = 2000;  // chars (~500 tokens)
const CHUNK_OVERLAP = 100;
const EMBED_BATCH_SIZE = 100;
const EMBED_MODEL = 'text-embedding-3-small';

// ─── Args parsing (antes de env check para --help funcionar) ─────────────────

const { values: args } = parseArgs({
  options: {
    file:   { type: 'string' },
    url:    { type: 'string' },
    title:  { type: 'string' },
    author: { type: 'string', default: '' },
    type:   { type: 'string', default: '' },
    help:   { type: 'boolean', default: false },
  },
  allowPositionals: false,
});

if (args.help || (!args.file && !args.url)) {
  console.log(`
Mega Brain Ingest — Ingestão universal de conteúdo

Uso:
  node scripts/mega-brain-ingest.mjs --url "https://youtube.com/watch?v=xxx" --title "Titulo"
  node scripts/mega-brain-ingest.mjs --file ./doc.pdf --title "Manual" --author "Marcos"

Opções:
  --file    Caminho para arquivo local (.pdf, .mp3, .mp4, .txt, .csv, .json, .xlsx, .md)
  --url     URL para ingerir (YouTube, Google Docs, webpage genérica)
  --title   Título da fonte (OBRIGATÓRIO)
  --author  Autor do conteúdo (opcional)
  --type    Forçar tipo: pdf | audio | video | spreadsheet | text | youtube | webpage | gdrive_doc
  --help    Mostrar esta ajuda

Tipos auto-detectados por extensão:
  .pdf              → pdf
  .mp3/.wav/.m4a    → audio
  .mp4/.mov/.avi    → video
  .xlsx/.ods        → spreadsheet
  .csv              → spreadsheet
  .txt/.md/.json    → text
  youtube.com       → youtube
  docs.google.com   → gdrive_doc
  (outros URLs)     → webpage
`);
  process.exit(0);
}

// ─── Env check (apos help para --help funcionar sem env vars) ────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('ERRO: Variaveis de ambiente obrigatorias: SUPABASE_URL, SUPABASE_KEY (ou SUPABASE_SERVICE_KEY), OPENAI_API_KEY');
  process.exit(1);
}

if (!args.title) {
  console.error('ERRO: --title e obrigatorio');
  process.exit(1);
}

const input = args.file || args.url;
const inputIsFile = !!args.file;

// ─── Detecção de tipo ─────────────────────────────────────────────────────────

const TYPE_ALIASES = { text: 'note' };

async function detectType(input, isFile) {
  // Para URLs, detectar tipo pela URL ANTES de aplicar aliases
  if (!isFile) {
    const lower = input.toLowerCase();
    if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
    if (lower.includes('docs.google.com')) return 'gdrive_doc';
    // Se --type foi passado, usar alias; senao, webpage
    if (args.type) return TYPE_ALIASES[args.type] || args.type;
    return 'webpage';
  }

  // Arquivo local — se --type foi passado, usar alias
  if (args.type) return TYPE_ALIASES[args.type] || args.type;

  // Arquivo local — usar extensão
  const ext = extname(input).toLowerCase();
  const extMap = {
    '.pdf':  'pdf',
    '.mp3':  'audio',
    '.wav':  'audio',
    '.m4a':  'audio',
    '.mp4':  'video',
    '.mov':  'video',
    '.avi':  'video',
    '.xlsx': 'spreadsheet',
    '.ods':  'spreadsheet',
    '.csv':  'spreadsheet',
    '.txt':  'note',
    '.md':   'note',
    '.json': 'note',
  };

  return extMap[ext] || 'note';
}

// ─── Extração de texto por tipo ───────────────────────────────────────────────

async function extractText(input, type, isFile) {
  console.log(`[extract] Tipo: ${type}`);

  switch (type) {
    case 'text':
    case 'note':
    case 'transcript':
      return extractTextFile(input, isFile);

    case 'pdf':
      return extractPdf(input, isFile);

    case 'spreadsheet':
      return extractSpreadsheet(input, isFile);

    case 'audio':
    case 'video':
    case 'call_recording':
      return transcribeAudio(input, isFile);

    case 'youtube':
      return extractYouTube(input);

    case 'webpage':
    case 'gdrive_doc':
      return extractWebpage(input);

    default:
      throw new Error(`Tipo desconhecido: ${type}`);
  }
}

async function extractTextFile(input, isFile) {
  if (!isFile) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${input}`);
    return await res.text();
  }
  const content = await readFile(input, 'utf-8');
  return content;
}

async function extractPdf(input, isFile) {
  let pdfParse;
  try {
    pdfParse = (await import('pdf-parse')).default;
  } catch {
    throw new Error('pdf-parse nao instalado. Execute: npm install pdf-parse');
  }

  let buffer;
  if (isFile) {
    buffer = await readFile(input);
  } else {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar PDF`);
    buffer = Buffer.from(await res.arrayBuffer());
  }

  const data = await pdfParse(buffer);
  console.log(`[pdf] ${data.numpages} paginas extraidas`);
  return data.text;
}

async function extractSpreadsheet(input, isFile) {
  let XLSX;
  try {
    XLSX = (await import('xlsx')).default;
  } catch {
    throw new Error('xlsx nao instalado. Execute: npm install xlsx');
  }

  let workbook;
  if (isFile) {
    const ext = extname(input).toLowerCase();
    if (ext === '.csv') {
      const content = await readFile(input, 'utf-8');
      workbook = XLSX.read(content, { type: 'string' });
    } else {
      workbook = XLSX.readFile(input);
    }
  } else {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar planilha`);
    const buffer = Buffer.from(await res.arrayBuffer());
    workbook = XLSX.read(buffer, { type: 'buffer' });
  }

  const parts = [];
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    parts.push(`=== Aba: ${sheetName} ===`);
    for (const row of json) {
      if (row.length > 0) {
        parts.push(row.map(cell => (cell === null || cell === undefined) ? '' : String(cell)).join('\t'));
      }
    }
  }

  console.log(`[xlsx] ${workbook.SheetNames.length} aba(s) extraida(s)`);
  return parts.join('\n');
}

async function transcribeAudio(input, isFile) {
  let audioPath = input;
  let tempFile = null;

  // Se for URL, baixar primeiro
  if (!isFile) {
    console.log('[audio] Baixando arquivo de audio/video...');
    tempFile = join(tmpdir(), `mega-brain-audio-${Date.now()}.mp4`);
    const res = await fetch(input);
    if (!res.ok) throw new Error(`HTTP ${res.status} ao baixar audio`);
    const buffer = Buffer.from(await res.arrayBuffer());
    await writeFile(tempFile, buffer);
    audioPath = tempFile;
  }

  try {
    console.log('[audio] Transcrevendo com Whisper (OpenAI)...');

    // Usar FormData com fetch nativo
    const formData = new FormData();
    const fileBuffer = await readFile(audioPath);
    const fileName = basename(audioPath);
    const blob = new Blob([fileBuffer]);

    formData.append('file', blob, fileName);
    formData.append('model', 'whisper-1');
    formData.append('language', 'pt');
    formData.append('response_format', 'verbose_json');

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_KEY}` },
      body: formData,
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Whisper API ${res.status}: ${err}`);
    }

    const data = await res.json();

    // Extrair texto e timestamps por segmento
    if (data.segments) {
      const lines = data.segments.map(seg => {
        const ts = `[${formatTime(seg.start)} → ${formatTime(seg.end)}]`;
        return `${ts} ${seg.text.trim()}`;
      });
      console.log(`[audio] ${data.segments.length} segmentos transcritos`);
      return lines.join('\n');
    }

    return data.text || '';
  } finally {
    if (tempFile) {
      try { await unlink(tempFile); } catch {}
    }
  }
}

async function extractYouTube(url) {
  // Verificar se yt-dlp está disponível
  try {
    execSync('yt-dlp --version', { stdio: 'pipe' });
  } catch {
    throw new Error('yt-dlp nao encontrado. Instale com: brew install yt-dlp  OU  pip install yt-dlp');
  }

  const tempAudio = join(tmpdir(), `mega-brain-yt-${Date.now()}.mp3`);

  try {
    console.log('[youtube] Baixando audio via yt-dlp...');
    const { execFileSync } = await import('node:child_process');
    execFileSync('yt-dlp', ['-x', '--audio-format', 'mp3', '--audio-quality', '5', '-o', tempAudio, url], {
      stdio: 'pipe',
      timeout: 300_000,
    });

    // Verificar se arquivo foi criado (yt-dlp pode adicionar extensão)
    let audioFile = tempAudio;
    try {
      await access(tempAudio);
    } catch {
      // Tentar sem extensão adicionada
      audioFile = tempAudio.replace('.mp3', '') + '.mp3';
    }

    console.log('[youtube] Audio baixado, transcrevendo...');
    return await transcribeAudio(audioFile, true);
  } finally {
    // Limpar arquivos temporários
    for (const ext of ['', '.mp3', '.webm', '.m4a']) {
      try { await unlink(tempAudio.replace('.mp3', '') + ext); } catch {}
    }
  }
}

async function extractWebpage(url) {
  console.log('[webpage] Buscando conteudo da URL...');
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MegaBrainBot/1.0)' }
  });

  if (!res.ok) throw new Error(`HTTP ${res.status} ao buscar ${url}`);

  const html = await res.text();

  // Tentar usar cheerio se disponível
  try {
    const { load } = await import('cheerio');
    const $ = load(html);

    // Remover elementos não-conteúdo
    $('script, style, nav, header, footer, aside, [class*="menu"], [class*="sidebar"], [id*="menu"], [id*="sidebar"]').remove();

    // Extrair texto principal
    const title = $('title').text().trim();
    const mainContent = $('main, article, [role="main"], .content, #content, .post-content').first();

    let text;
    if (mainContent.length) {
      text = mainContent.text();
    } else {
      text = $('body').text();
    }

    // Limpar espaços extras
    text = text.replace(/\s+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

    console.log(`[webpage] ${text.length} chars extraidos`);
    return title ? `# ${title}\n\n${text}` : text;
  } catch {
    // Fallback: extração simples sem cheerio
    console.log('[webpage] cheerio nao disponivel, usando extração simples');
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();

    return text;
  }
}

// ─── Chunking semântico ───────────────────────────────────────────────────────

function chunkText(text, chunkSize = CHUNK_SIZE, overlap = CHUNK_OVERLAP) {
  if (!text || text.trim().length === 0) return [];

  // Normalizar quebras de linha
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Dividir por parágrafos primeiro
  const paragraphs = text.split(/\n{2,}/);
  const chunks = [];
  let currentChunk = '';
  let chunkIndex = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    // Se o parágrafo sozinho é maior que o chunk size, dividir por frases
    if (trimmed.length > chunkSize) {
      // Salvar chunk atual se tiver conteúdo
      if (currentChunk.trim()) {
        chunks.push({ index: chunkIndex++, text: currentChunk.trim() });
        // Overlap: pegar último pedaço do chunk anterior
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + '\n\n';
      }

      // Dividir parágrafo longo por frases
      const sentences = trimmed.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [trimmed];
      for (const sentence of sentences) {
        if (currentChunk.length + sentence.length > chunkSize && currentChunk.trim()) {
          chunks.push({ index: chunkIndex++, text: currentChunk.trim() });
          const overlapText = currentChunk.slice(-overlap);
          currentChunk = overlapText + ' ';
        }
        currentChunk += sentence + ' ';
      }
    } else if (currentChunk.length + trimmed.length + 2 > chunkSize) {
      // Parágrafo não cabe no chunk atual — salvar e começar novo
      if (currentChunk.trim()) {
        chunks.push({ index: chunkIndex++, text: currentChunk.trim() });
        const overlapText = currentChunk.slice(-overlap);
        currentChunk = overlapText + '\n\n' + trimmed;
      } else {
        currentChunk = trimmed;
      }
    } else {
      // Adicionar parágrafo ao chunk atual
      currentChunk += (currentChunk ? '\n\n' : '') + trimmed;
    }
  }

  // Último chunk
  if (currentChunk.trim()) {
    chunks.push({ index: chunkIndex++, text: currentChunk.trim() });
  }

  return chunks;
}

// ─── Embeddings ───────────────────────────────────────────────────────────────

async function generateEmbeddings(chunks) {
  console.log(`\n[embeddings] Gerando para ${chunks.length} chunks em batches de ${EMBED_BATCH_SIZE}...`);

  const results = [];
  let processed = 0;

  for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBED_BATCH_SIZE);
    const texts = batch.map(c => c.text.replace(/\n/g, ' '));

    try {
      const res = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: EMBED_MODEL,
          input: texts,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`OpenAI Embeddings ${res.status}: ${err}`);
      }

      const data = await res.json();

      for (let j = 0; j < batch.length; j++) {
        results.push({
          chunk: batch[j],
          embedding: data.data[j].embedding,
        });
      }

      processed += batch.length;
      const pct = Math.round((processed / chunks.length) * 100);
      process.stdout.write(`\r[embeddings] ${processed}/${chunks.length} chunks (${pct}%)        `);
    } catch (err) {
      console.error(`\n[embeddings] ERRO no batch ${i}: ${err.message}`);
      // Continuar com os outros batches — marcar este batch com embedding nulo
      for (const chunk of batch) {
        results.push({ chunk, embedding: null, error: err.message });
      }
    }
  }

  console.log(`\n[embeddings] Concluido: ${results.filter(r => r.embedding).length}/${chunks.length} com sucesso`);
  return results;
}

// ─── Supabase Insert ──────────────────────────────────────────────────────────

async function insertToSupabase(sourceData, chunksWithEmbeddings) {
  console.log('\n[supabase] Inserindo knowledge_source...');

  // 1. Inserir fonte
  const sourceRes = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_sources`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    body: JSON.stringify(sourceData),
  });

  if (!sourceRes.ok) {
    const err = await sourceRes.text();
    throw new Error(`Supabase knowledge_sources ${sourceRes.status}: ${err}`);
  }

  const [source] = await sourceRes.json();
  const sourceId = source.id;
  console.log(`[supabase] Source criada: ${sourceId}`);

  // 2. Inserir chunks em batches
  console.log(`[supabase] Inserindo ${chunksWithEmbeddings.length} chunks...`);

  const BATCH = 50;
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < chunksWithEmbeddings.length; i += BATCH) {
    const batch = chunksWithEmbeddings.slice(i, i + BATCH);

    const rows = batch.map(({ chunk, embedding, error }) => ({
      source_id: sourceId,
      chunk_index: chunk.index,
      content: chunk.text,
      embedding: embedding ? JSON.stringify(embedding) : null,
      metadata: {
        char_count: chunk.text.length,
        ...(chunk.page ? { page: chunk.page } : {}),
        ...(chunk.timestamp_start !== undefined ? { timestamp_start: chunk.timestamp_start } : {}),
        ...(chunk.timestamp_end !== undefined ? { timestamp_end: chunk.timestamp_end } : {}),
        ...(chunk.speaker ? { speaker: chunk.speaker } : {}),
        ...(error ? { embedding_error: error } : {}),
      },
    }));

    const chunkRes = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_chunks`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(rows),
    });

    if (chunkRes.ok) {
      inserted += batch.length;
    } else {
      const errText = await chunkRes.text();
      console.error(`\n[supabase] ERRO batch chunks ${i}: ${chunkRes.status} ${errText.slice(0, 200)}`);
      errors += batch.length;
    }

    const pct = Math.round(((i + batch.length) / chunksWithEmbeddings.length) * 100);
    process.stdout.write(`\r[supabase] ${Math.min(i + BATCH, chunksWithEmbeddings.length)}/${chunksWithEmbeddings.length} chunks (${pct}%)        `);
  }

  console.log(`\n[supabase] ${inserted} chunks inseridos, ${errors} erros`);

  // 3. Atualizar status da source
  const status = errors === 0 ? 'completed' : (inserted === 0 ? 'failed' : 'partial');
  await fetch(`${SUPABASE_URL}/rest/v1/knowledge_sources?id=eq.${sourceId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      status,
      chunk_count: inserted,
      processing_completed_at: new Date().toISOString(),
      ...(errors > 0 ? { processing_error: `${errors} chunks falharam` } : {}),
    }),
  });

  return { sourceId, inserted, errors, status };
}

async function markSourceFailed(sourceId, errorMessage) {
  if (!sourceId) return;
  await fetch(`${SUPABASE_URL}/rest/v1/knowledge_sources?id=eq.${sourceId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      processing_status: 'failed',
      processing_error: errorMessage,
    }),
  });
}

// ─── Utilitários ──────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('='.repeat(60));
  console.log('MEGA BRAIN INGEST');
  console.log('='.repeat(60));
  console.log(`Input:  ${input}`);
  console.log(`Titulo: ${args.title}`);
  if (args.author) console.log(`Autor:  ${args.author}`);
  console.log('');

  let sourceId = null;

  try {
    // 1. Detectar tipo
    const type = await detectType(input, inputIsFile);
    console.log(`[1/5] Tipo detectado: ${type}`);

    // 2. Inserir source pendente no Supabase (para tracking)
    const sourceData = {
      title: args.title,
      source_type: type,
      source_url: inputIsFile ? null : input,
      source_file_path: inputIsFile ? input : null,
      author: args.author || null,
      processing_status: 'processing',
      metadata: { processing_started_at: new Date().toISOString() },
    };

    const initRes = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_sources`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify(sourceData),
    });

    if (initRes.ok) {
      const [src] = await initRes.json();
      sourceId = src?.id;
      console.log(`[1/5] Source registrada: ${sourceId}`);
    } else {
      const errText = await initRes.text();
      console.warn(`[1/5] Aviso: nao foi possivel registrar source inicial: ${errText.slice(0, 200)}`);
      console.warn('[1/5] Continuando sem sourceId (insert final fara upsert completo)');
    }

    // 3. Extrair texto
    console.log('\n[2/5] Extraindo texto...');
    let text;
    try {
      text = await extractText(input, type, inputIsFile);
    } catch (err) {
      await markSourceFailed(sourceId, err.message);
      throw err;
    }

    if (!text || text.trim().length < 10) {
      await markSourceFailed(sourceId, 'Texto extraido vazio ou muito curto');
      throw new Error('Texto extraido vazio ou muito curto');
    }

    const wordCount = text.split(/\s+/).length;
    const tokenCount = estimateTokens(text);
    console.log(`[2/5] Extraidos: ${text.length} chars | ~${wordCount} palavras | ~${tokenCount} tokens`);

    // 4. Chunking
    console.log('\n[3/5] Dividindo em chunks...');
    const chunks = chunkText(text);
    console.log(`[3/5] ${chunks.length} chunks (avg ${Math.round(text.length / chunks.length)} chars cada)`);

    if (chunks.length === 0) {
      await markSourceFailed(sourceId, 'Nenhum chunk gerado');
      throw new Error('Nenhum chunk gerado');
    }

    // 5. Gerar embeddings
    console.log('\n[4/5] Gerando embeddings...');
    const chunksWithEmbeddings = await generateEmbeddings(chunks);

    // 6. Inserir no Supabase
    console.log('\n[5/5] Inserindo no Supabase...');

    let result;
    if (sourceId) {
      // Source já existe — apenas inserir chunks e atualizar status
      const chunksRows = chunksWithEmbeddings.map(({ chunk, embedding, error }) => ({
        source_id: sourceId,
        chunk_index: chunk.index,
        content: chunk.text,
        embedding: embedding ? JSON.stringify(embedding) : null,
        metadata: {
          char_count: chunk.text.length,
          ...(error ? { embedding_error: error } : {}),
        },
      }));

      const BATCH = 50;
      let inserted = 0;
      let errors = 0;

      for (let i = 0; i < chunksRows.length; i += BATCH) {
        const batch = chunksRows.slice(i, i + BATCH);
        const chunkRes = await fetch(`${SUPABASE_URL}/rest/v1/knowledge_chunks`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(batch),
        });

        if (chunkRes.ok) {
          inserted += batch.length;
        } else {
          const errText = await chunkRes.text();
          console.error(`\n[supabase] ERRO batch ${i}: ${chunkRes.status} ${errText.slice(0, 200)}`);
          errors += batch.length;
        }

        const pct = Math.round(((i + batch.length) / chunksRows.length) * 100);
        process.stdout.write(`\r[supabase] ${Math.min(i + BATCH, chunksRows.length)}/${chunksRows.length} chunks (${pct}%)        `);
      }

      console.log(`\n[supabase] ${inserted} chunks inseridos, ${errors} erros`);

      const status = errors === 0 ? 'completed' : (inserted === 0 ? 'failed' : 'partial');
      await fetch(`${SUPABASE_URL}/rest/v1/knowledge_sources?id=eq.${sourceId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          processing_status: status === 'partial' ? 'completed' : status,
          total_chunks: inserted,
          total_tokens: tokenCount,
          ...(errors > 0 ? { processing_error: `${errors}/${chunksRows.length} chunks falharam` } : {}),
        }),
      });

      result = { sourceId, inserted, errors, status };
    } else {
      // Fallback: inserir tudo junto via insertToSupabase
      const fullSourceData = {
        ...sourceData,
        word_count: wordCount,
        token_count: tokenCount,
        status: 'completed',
      };
      delete fullSourceData.processing_started_at; // será setado pelo DB
      result = await insertToSupabase(fullSourceData, chunksWithEmbeddings);
    }

    // ─── Resultado final ─────────────────────────────────────────────────────
    console.log('\n' + '='.repeat(60));
    console.log('INGESTAO CONCLUIDA');
    console.log('='.repeat(60));
    console.log(`Source ID:  ${result.sourceId}`);
    console.log(`Status:     ${result.status}`);
    console.log(`Chunks:     ${result.inserted} inseridos / ${chunksWithEmbeddings.length} total`);
    if (result.errors > 0) {
      console.log(`Erros:      ${result.errors} chunks com falha`);
    }
    console.log(`Tokens:     ~${tokenCount}`);
    console.log('');

    if (result.status === 'failed') {
      process.exit(1);
    }

  } catch (err) {
    console.error('\n[ERRO CRITICO]', err.message);
    if (sourceId) {
      await markSourceFailed(sourceId, err.message);
      console.error(`Source ${sourceId} marcada como failed`);
    }
    process.exit(1);
  }
}

main();
