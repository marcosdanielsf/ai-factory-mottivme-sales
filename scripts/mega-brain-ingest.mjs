#!/usr/bin/env node
/**
 * Mega Brain Universal Ingestion Script
 * Ingere conteudo de qualquer formato no sistema Mega Brain.
 *
 * Uso:
 *   node scripts/mega-brain-ingest.mjs --url "https://youtube.com/watch?v=..." --title "Live Finch"
 *   node scripts/mega-brain-ingest.mjs --file ./doc.pdf --title "Manual Vendas" --author "Marcos"
 */

import { parseArgs } from 'node:util';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { extname, join, basename } from 'node:path';
import { execSync, exec } from 'node:child_process';
import { promisify } from 'node:util';
import { createReadStream } from 'node:fs';

const execAsync = promisify(exec);

// ============================================================
// CONFIG — env vars (setar antes de rodar)
// ============================================================
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.MEGA_BRAIN_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.MEGA_BRAIN_SUPABASE_KEY;
const OPENAI_KEY = process.env.OPENAI_API_KEY || process.env.MEGA_BRAIN_OPENAI_KEY;
const GROQ_KEY = process.env.GROQ_API_KEY || process.env.MEGA_BRAIN_GROQ_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error('Env vars obrigatorias: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, OPENAI_API_KEY');
  process.exit(1);
}

const CHUNK_TARGET_CHARS = 2000;  // ~500 tokens
const CHUNK_OVERLAP_CHARS = 100;
const EMBEDDING_BATCH_SIZE = 100;
const INSERT_BATCH_SIZE = 50;

// ============================================================
// CLI ARGS
// ============================================================
const { values: args } = parseArgs({
  options: {
    url:    { type: 'string' },
    file:   { type: 'string' },
    title:  { type: 'string' },
    author: { type: 'string', default: 'Marcos Daniels' },
    tags:   { type: 'string' },  // comma-separated
    help:   { type: 'boolean', short: 'h', default: false },
  },
  strict: false,
});

if (args.help || (!args.url && !args.file)) {
  console.log(`
Mega Brain Universal Ingestion Script

Uso:
  node scripts/mega-brain-ingest.mjs --url "URL" --title "Titulo"
  node scripts/mega-brain-ingest.mjs --file ./arquivo.pdf --title "Titulo" --author "Autor"

Opcoes:
  --url     URL para ingerir (YouTube, webpage)
  --file    Caminho do arquivo local
  --title   Titulo do conteudo (obrigatorio)
  --author  Autor do conteudo (default: Marcos Daniels)
  --tags    Tags separadas por virgula
  --help    Mostrar esta ajuda

Tipos suportados:
  YouTube   youtube.com / youtu.be (requer yt-dlp)
  PDF       .pdf
  Audio     .mp3 .wav .m4a .ogg
  Video     .mp4 .webm .mov (extrai audio)
  Texto     .txt .md
  Planilha  .csv .xlsx .xls
  Webpage   qualquer outra URL
`);
  process.exit(0);
}

if (!args.title) {
  console.error('ERRO: --title e obrigatorio');
  process.exit(1);
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Detecta o tipo de conteudo com base na URL ou extensao do arquivo.
 */
function detectType(input, isFile) {
  if (isFile) {
    const ext = extname(input).toLowerCase();
    if (ext === '.pdf') return 'pdf';
    if (['.mp3', '.wav', '.m4a', '.ogg', '.flac'].includes(ext)) return 'audio';
    if (['.mp4', '.webm', '.mov', '.avi', '.mkv'].includes(ext)) return 'video';
    if (['.txt', '.md', '.mdx'].includes(ext)) return 'text';
    if (['.csv', '.xlsx', '.xls'].includes(ext)) return 'spreadsheet';
    return 'text'; // fallback
  } else {
    const url = input.toLowerCase();
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    return 'webpage';
  }
}

/**
 * Faz chunking semantico do texto.
 * Respeita limites de paragrafo, linha e sentenca.
 */
function chunkText(text, metadata = {}) {
  const chunks = [];

  // Normalizar quebras de linha
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

  // Split por paragrafos
  const paragraphs = normalized.split(/\n\n+/);

  let currentChunk = '';
  let chunkIndex = 0;

  for (const para of paragraphs) {
    const trimmedPara = para.trim();
    if (!trimmedPara) continue;

    // Se adicionar o paragrafo ultrapassa o alvo, salvar chunk atual
    if (currentChunk && (currentChunk.length + trimmedPara.length + 2) > CHUNK_TARGET_CHARS) {
      // Salvar chunk
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          chunk_index: chunkIndex++,
          token_count: Math.ceil(currentChunk.length / 4),
          metadata: { ...metadata },
        });
      }

      // Overlap: pegar ultimas chars do chunk anterior
      const overlap = currentChunk.length > CHUNK_OVERLAP_CHARS
        ? currentChunk.slice(-CHUNK_OVERLAP_CHARS)
        : currentChunk;
      currentChunk = overlap + '\n\n' + trimmedPara;
    } else {
      // Adicionar ao chunk atual
      currentChunk = currentChunk ? currentChunk + '\n\n' + trimmedPara : trimmedPara;
    }

    // Se paragrafo individual ja e enorme, dividir por linha
    if (currentChunk.length > CHUNK_TARGET_CHARS * 2) {
      const lines = currentChunk.split('\n');
      currentChunk = '';
      for (const line of lines) {
        if (currentChunk && (currentChunk.length + line.length + 1) > CHUNK_TARGET_CHARS) {
          if (currentChunk.trim()) {
            chunks.push({
              content: currentChunk.trim(),
              chunk_index: chunkIndex++,
              token_count: Math.ceil(currentChunk.length / 4),
              metadata: { ...metadata },
            });
          }
          currentChunk = line;
        } else {
          currentChunk = currentChunk ? currentChunk + '\n' + line : line;
        }
      }
    }
  }

  // Ultimo chunk
  if (currentChunk.trim()) {
    chunks.push({
      content: currentChunk.trim(),
      chunk_index: chunkIndex++,
      token_count: Math.ceil(currentChunk.length / 4),
      metadata: { ...metadata },
    });
  }

  return chunks;
}

/**
 * Remove tags HTML e decodifica entidades basicas.
 */
function stripHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

// ============================================================
// SUPABASE API
// ============================================================

const SBHEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation',
};

async function sbInsert(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: SBHEADERS,
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase INSERT ${table} falhou (${res.status}): ${err}`);
  }
  return res.json();
}

async function sbUpdate(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...SBHEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase PATCH ${table} falhou (${res.status}): ${err}`);
  }
}

// ============================================================
// PROCESSADORES
// ============================================================

async function processYoutube(url) {
  console.log('  Verificando yt-dlp...');
  try {
    execSync('yt-dlp --version', { stdio: 'pipe' });
  } catch {
    throw new Error('yt-dlp nao encontrado. Instale: brew install yt-dlp');
  }

  const tmpPath = join(tmpdir(), `mega-brain-yt-%(id)s.%(ext)s`);
  console.log('  Baixando audio do YouTube...');
  execSync(`yt-dlp -x --audio-format wav --audio-quality 0 -o "${tmpPath}" "${url}"`, {
    stdio: 'inherit',
  });

  // Encontrar o arquivo gerado
  const { stdout: foundFiles } = await execAsync(
    `ls "${tmpdir()}" | grep "mega-brain-yt-" | head -1`
  );
  const audioFile = join(tmpdir(), foundFiles.trim());

  if (!audioFile || !existsSync(audioFile)) {
    throw new Error('Arquivo de audio do YouTube nao encontrado apos download');
  }

  console.log(`  Audio baixado: ${audioFile}`);
  const transcript = await transcribeAudio(audioFile);

  // Limpar arquivo temporario
  await unlink(audioFile).catch(() => {});

  return { text: transcript, metadata: { source_url: url } };
}

async function transcribeAudio(filePath) {
  console.log('  Transcrevendo audio com Groq Whisper...');

  // Ler arquivo de audio
  const audioBuffer = await readFile(filePath);
  const fileName = basename(filePath);

  // Criar FormData manualmente com boundary
  const boundary = `----FormBoundary${Math.random().toString(36).slice(2)}`;
  const parts = [];

  // field: model
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="model"\r\n\r\nwhisper-large-v3-turbo`
  );
  // field: language
  parts.push(
    `--${boundary}\r\nContent-Disposition: form-data; name="language"\r\n\r\npt`
  );
  // field: file
  const fileHeader = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: application/octet-stream\r\n\r\n`;

  // Montar body como Buffer
  const headersBuf = Buffer.from(parts.join('\r\n') + '\r\n' + fileHeader);
  const footerBuf = Buffer.from(`\r\n--${boundary}--\r\n`);
  const bodyBuf = Buffer.concat([headersBuf, audioBuffer, footerBuf]);

  const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${GROQ_KEY}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`,
    },
    body: bodyBuf,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq Whisper falhou (${res.status}): ${err}`);
  }

  const data = await res.json();
  return data.text || '';
}

async function processPdf(filePath) {
  console.log('  Extraindo texto do PDF...');

  // Import dinamico do pdf-parse
  const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js').catch(async () => {
    return await import('pdf-parse');
  });

  const buffer = await readFile(filePath);
  const result = await pdfParse(buffer);

  return {
    text: result.text,
    metadata: {
      total_pages: result.numpages,
      pdf_info: result.info,
    },
  };
}

async function processAudio(filePath) {
  return {
    text: await transcribeAudio(filePath),
    metadata: { source_file: basename(filePath) },
  };
}

async function processVideo(filePath) {
  console.log('  Extraindo audio do video...');

  // Verificar ffmpeg
  try {
    execSync('ffmpeg -version', { stdio: 'pipe' });
  } catch {
    throw new Error('ffmpeg nao encontrado. Instale: brew install ffmpeg');
  }

  const audioPath = join(tmpdir(), `mega-brain-video-${Date.now()}.wav`);
  execSync(`ffmpeg -i "${filePath}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}" -y`, {
    stdio: 'pipe',
  });

  const result = await transcribeAudio(audioPath);
  await unlink(audioPath).catch(() => {});

  return {
    text: result,
    metadata: { source_file: basename(filePath) },
  };
}

async function processText(filePath) {
  const text = await readFile(filePath, 'utf-8');
  return { text, metadata: { source_file: basename(filePath) } };
}

async function processSpreadsheet(filePath) {
  console.log('  Processando planilha...');

  const { default: XLSX } = await import('xlsx');
  const workbook = XLSX.readFile(filePath);

  let allText = '';

  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName];
    const csv = XLSX.utils.sheet_to_csv(sheet);
    allText += `\n## Sheet: ${sheetName}\n\n${csv}\n`;
  }

  return {
    text: allText.trim(),
    metadata: {
      source_file: basename(filePath),
      sheets: workbook.SheetNames,
    },
  };
}

async function processWebpage(url) {
  console.log('  Buscando pagina web...');

  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; MegaBrainBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
  });

  if (!res.ok) {
    throw new Error(`Fetch da pagina falhou: ${res.status} ${res.statusText}`);
  }

  const html = await res.text();
  const text = stripHtml(html);

  // Tentar extrair titulo da pagina
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : null;

  return {
    text,
    metadata: { source_url: url, page_title: pageTitle },
  };
}

// ============================================================
// EMBEDDINGS
// ============================================================

async function generateEmbeddings(chunks) {
  console.log(`  Gerando embeddings para ${chunks.length} chunks...`);
  const embeddings = [];

  for (let i = 0; i < chunks.length; i += EMBEDDING_BATCH_SIZE) {
    const batch = chunks.slice(i, i + EMBEDDING_BATCH_SIZE);
    const inputs = batch.map(c => c.content);

    const batchNum = Math.floor(i / EMBEDDING_BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(chunks.length / EMBEDDING_BATCH_SIZE);
    process.stdout.write(`    Batch ${batchNum}/${totalBatches}...\r`);

    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: inputs,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI Embeddings falhou (${res.status}): ${err}`);
    }

    const data = await res.json();
    embeddings.push(...data.data.map(d => d.embedding));
  }

  console.log(`\n  ${embeddings.length} embeddings gerados.`);
  return embeddings;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log('\n=== Mega Brain Universal Ingestion ===\n');

  const isFile = !!args.file;
  const input = args.url || args.file;
  const tags = args.tags ? args.tags.split(',').map(t => t.trim()) : [];

  let sourceId = null;

  try {
    // [1/5] Detectar tipo
    console.log('[1/5] Detectando tipo de conteudo...');
    const contentType = detectType(input, isFile);
    console.log(`  Tipo: ${contentType}`);
    console.log(`  Input: ${input}`);

    // [2/5] Processar conteudo
    console.log('\n[2/5] Processando conteudo...');
    let processResult;

    switch (contentType) {
      case 'youtube':
        processResult = await processYoutube(input);
        break;
      case 'pdf':
        processResult = await processPdf(input);
        break;
      case 'audio':
        processResult = await processAudio(input);
        break;
      case 'video':
        processResult = await processVideo(input);
        break;
      case 'text':
        processResult = await processText(input);
        break;
      case 'spreadsheet':
        processResult = await processSpreadsheet(input);
        break;
      case 'webpage':
        processResult = await processWebpage(input);
        break;
      default:
        throw new Error(`Tipo desconhecido: ${contentType}`);
    }

    const { text, metadata } = processResult;
    console.log(`  Texto extraido: ${text.length} chars`);

    if (!text || text.trim().length < 10) {
      throw new Error('Conteudo extraido esta vazio ou muito curto');
    }

    // [3/5] Registrar knowledge_source
    console.log('\n[3/5] Registrando fonte no Supabase...');

    const sourcePayload = {
      title: args.title,
      content_type: contentType,
      source_url: args.url || null,
      source_file: isFile ? basename(args.file) : null,
      author: args.author,
      tags: tags.length > 0 ? tags : null,
      status: 'processing',
      raw_content: text.slice(0, 10000), // primeiros 10k chars
      source_metadata: {
        ...metadata,
        ingested_at: new Date().toISOString(),
        char_count: text.length,
      },
    };

    const [source] = await sbInsert('knowledge_sources', sourcePayload);
    sourceId = source.id;
    console.log(`  Source ID: ${sourceId}`);

    // [4/5] Chunking + Embeddings
    console.log('\n[4/5] Fazendo chunking semantico e gerando embeddings...');
    const chunks = chunkText(text, { source_type: contentType });
    console.log(`  ${chunks.length} chunks gerados`);

    const embeddings = await generateEmbeddings(chunks);

    // [5/5] Inserir chunks no Supabase
    console.log('\n[5/5] Inserindo chunks no Supabase...');

    const totalTokens = chunks.reduce((sum, c) => sum + c.token_count, 0);

    for (let i = 0; i < chunks.length; i += INSERT_BATCH_SIZE) {
      const batch = chunks.slice(i, i + INSERT_BATCH_SIZE);
      const batchNum = Math.floor(i / INSERT_BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / INSERT_BATCH_SIZE);
      process.stdout.write(`  Inserindo batch ${batchNum}/${totalBatches}...\r`);

      const rows = batch.map((chunk, bIdx) => ({
        knowledge_source_id: sourceId,
        content: chunk.content,
        chunk_index: chunk.chunk_index,
        token_count: chunk.token_count,
        embedding: embeddings[i + bIdx],
        chunk_metadata: chunk.metadata,
      }));

      await sbInsert('knowledge_chunks', rows);
    }

    console.log(`\n  ${chunks.length} chunks inseridos.`);

    // Atualizar status do source para completed
    await sbUpdate('knowledge_sources', sourceId, {
      status: 'completed',
      total_chunks: chunks.length,
      total_tokens: totalTokens,
    });

    console.log('\n=== INGESTAO CONCLUIDA COM SUCESSO ===');
    console.log(`  Titulo:       ${args.title}`);
    console.log(`  Source ID:    ${sourceId}`);
    console.log(`  Tipo:         ${contentType}`);
    console.log(`  Chunks:       ${chunks.length}`);
    console.log(`  Tokens est.:  ${totalTokens}`);
    console.log(`  Chars:        ${text.length}`);
    console.log('');

  } catch (error) {
    console.error('\n[ERRO]', error.message);

    // Marcar source como failed se foi criado
    if (sourceId) {
      await sbUpdate('knowledge_sources', sourceId, {
        status: 'failed',
        processing_error: error.message,
      }).catch(e => console.error('Erro ao atualizar status failed:', e.message));
    }

    process.exit(1);
  }
}

main();
