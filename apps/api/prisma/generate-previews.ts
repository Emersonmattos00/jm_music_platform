import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaClient } from '@prisma/client';
import { spawn } from 'child_process';
import { createWriteStream, promises as fs } from 'fs';
import { pipeline } from 'stream/promises';
import * as path from 'path';
import * as os from 'os';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

const s3 = new S3Client({
  region: process.env.B2_MEDIA_REGION!,
  endpoint: process.env.B2_MEDIA_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.B2_KEY_ID!,
    secretAccessKey: process.env.B2_APPLICATION_KEY!,
  },
  forcePathStyle: true,
});

const BUCKET = process.env.B2_MEDIA_BUCKET!;

// Configurações do preview
const PREVIEW_DURATION = 30;       // segundos
const PREVIEW_BITRATE = '128k';    // kbps
const PREVIEW_PREFIX = 'previews'; // pasta no B2

// Concorrência: quantos previews gera em paralelo
const CONCURRENCY = 2;

// ----------------------------------------------------------
// DOWNLOAD do B2 para arquivo local
// ----------------------------------------------------------
async function downloadFromB2(key: string, destPath: string): Promise<void> {
  const cmd = new GetObjectCommand({ Bucket: BUCKET, Key: key });
  const res = await s3.send(cmd);
  if (!res.Body) throw new Error('Body vazio');

  const writeStream = createWriteStream(destPath);
  await pipeline(res.Body as any, writeStream);
}

// ----------------------------------------------------------
// UPLOAD do arquivo local para o B2
// ----------------------------------------------------------
async function uploadToB2(key: string, srcPath: string): Promise<void> {
  const body = await fs.readFile(srcPath);
  const cmd = new PutObjectCommand({
    Bucket: BUCKET,
    Key: key,
    Body: body,
    ContentType: 'audio/mpeg',
  });
  await s3.send(cmd);
}

// ----------------------------------------------------------
// FFMPEG: corta 30s + reencoda para 128 kbps
// ----------------------------------------------------------
function runFfmpeg(input: string, output: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const args = [
      '-y',                    // overwrite
      '-i', input,             // input
      '-t', String(PREVIEW_DURATION), // duração (30s)
      '-b:a', PREVIEW_BITRATE, // bitrate
      '-ar', '44100',          // sample rate
      '-ac', '2',              // estéreo
      '-f', 'mp3',
      output,
    ];

    const proc = spawn('ffmpeg', args);

    let stderr = '';
    proc.stderr.on('data', (d) => {
      stderr += d.toString();
    });

    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg saiu com código ${code}\n${stderr.slice(-500)}`));
    });

    proc.on('error', reject);
  });
}

// ----------------------------------------------------------
// PROCESSAR UMA TRACK
// ----------------------------------------------------------
async function processTrack(track: {
  id: string;
  title: string;
  slug: string;
  streamKey: string | null;
}, index: number, total: number): Promise<void> {
  if (!track.streamKey) return;

  const prefix = `[${index + 1}/${total}]`;

  // Nome do arquivo de preview: slug da faixa
  const previewKey = `${PREVIEW_PREFIX}/${track.slug}.mp3`;

  // Arquivos temporários
  const tmpOriginal = path.join(os.tmpdir(), `jm-original-${track.id}.mp3`);
  const tmpPreview = path.join(os.tmpdir(), `jm-preview-${track.id}.mp3`);

  try {
    // 1. Baixar original
    console.log(`${prefix} ⬇️  Baixando "${track.title}"...`);
    await downloadFromB2(track.streamKey, tmpOriginal);

    const stat = await fs.stat(tmpOriginal);
    console.log(`${prefix}    Baixado (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);

    // 2. Rodar ffmpeg
    console.log(`${prefix} ✂️  Cortando 30s...`);
    await runFfmpeg(tmpOriginal, tmpPreview);

    const statPreview = await fs.stat(tmpPreview);
    console.log(
      `${prefix}    Preview gerado (${(statPreview.size / 1024).toFixed(0)} KB)`,
    );

    // 3. Upload do preview
    console.log(`${prefix} ⬆️  Enviando para B2...`);
    await uploadToB2(previewKey, tmpPreview);

    // 4. Atualizar banco
    await prisma.track.update({
      where: { id: track.id },
      data: { previewKey },
    });

    console.log(`${prefix} ✅ Concluído: ${previewKey}\n`);
  } catch (err) {
    console.error(`${prefix} ❌ Erro em "${track.title}":`, (err as Error).message);
  } finally {
    // Limpar temporários
    await fs.rm(tmpOriginal, { force: true });
    await fs.rm(tmpPreview, { force: true });
  }
}

// ----------------------------------------------------------
// MAIN — processa em lotes com concorrência controlada
// ----------------------------------------------------------
async function main() {
  console.log('🎬 Gerando previews de 30s para todas as faixas...\n');

  // Buscar todas as tracks com streamKey
  const tracks = await prisma.track.findMany({
    where: {
      status: 'PUBLISHED',
      streamKey: { not: null },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      streamKey: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📊 Total de faixas: ${tracks.length}\n`);

  if (tracks.length === 0) {
    console.log('Nada para processar.');
    return;
  }

  // Processar em lotes de CONCURRENCY
  for (let i = 0; i < tracks.length; i += CONCURRENCY) {
    const batch = tracks.slice(i, i + CONCURRENCY);
    await Promise.all(
      batch.map((t, j) => processTrack(t, i + j, tracks.length)),
    );
  }

  console.log('\n🎉 Todos os previews foram gerados.');
}

main()
  .catch((e) => {
    console.error('❌ Erro geral:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });