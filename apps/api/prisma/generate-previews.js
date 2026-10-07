"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_s3_1 = require("@aws-sdk/client-s3");
const client_1 = require("@prisma/client");
const child_process_1 = require("child_process");
const fs_1 = require("fs");
const promises_1 = require("stream/promises");
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prisma = new client_1.PrismaClient();
const s3 = new client_s3_1.S3Client({
    region: process.env.B2_MEDIA_REGION,
    endpoint: process.env.B2_MEDIA_ENDPOINT,
    credentials: {
        accessKeyId: process.env.B2_KEY_ID,
        secretAccessKey: process.env.B2_APPLICATION_KEY,
    },
    forcePathStyle: true,
});
const BUCKET = process.env.B2_MEDIA_BUCKET;
const PREVIEW_DURATION = 30;
const PREVIEW_BITRATE = '128k';
const PREVIEW_PREFIX = 'previews';
const CONCURRENCY = 2;
async function downloadFromB2(key, destPath) {
    const cmd = new client_s3_1.GetObjectCommand({ Bucket: BUCKET, Key: key });
    const res = await s3.send(cmd);
    if (!res.Body)
        throw new Error('Body vazio');
    const writeStream = (0, fs_1.createWriteStream)(destPath);
    await (0, promises_1.pipeline)(res.Body, writeStream);
}
async function uploadToB2(key, srcPath) {
    const body = await fs_1.promises.readFile(srcPath);
    const cmd = new client_s3_1.PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: body,
        ContentType: 'audio/mpeg',
    });
    await s3.send(cmd);
}
function runFfmpeg(input, output) {
    return new Promise((resolve, reject) => {
        const args = [
            '-y',
            '-i', input,
            '-t', String(PREVIEW_DURATION),
            '-b:a', PREVIEW_BITRATE,
            '-ar', '44100',
            '-ac', '2',
            '-f', 'mp3',
            output,
        ];
        const proc = (0, child_process_1.spawn)('ffmpeg', args);
        let stderr = '';
        proc.stderr.on('data', (d) => {
            stderr += d.toString();
        });
        proc.on('close', (code) => {
            if (code === 0)
                resolve();
            else
                reject(new Error(`ffmpeg saiu com código ${code}\n${stderr.slice(-500)}`));
        });
        proc.on('error', reject);
    });
}
async function processTrack(track, index, total) {
    if (!track.streamKey)
        return;
    const prefix = `[${index + 1}/${total}]`;
    const previewKey = `${PREVIEW_PREFIX}/${track.slug}.mp3`;
    const tmpOriginal = path.join(os.tmpdir(), `jm-original-${track.id}.mp3`);
    const tmpPreview = path.join(os.tmpdir(), `jm-preview-${track.id}.mp3`);
    try {
        console.log(`${prefix} ⬇️  Baixando "${track.title}"...`);
        await downloadFromB2(track.streamKey, tmpOriginal);
        const stat = await fs_1.promises.stat(tmpOriginal);
        console.log(`${prefix}    Baixado (${(stat.size / 1024 / 1024).toFixed(1)} MB)`);
        console.log(`${prefix} ✂️  Cortando 30s...`);
        await runFfmpeg(tmpOriginal, tmpPreview);
        const statPreview = await fs_1.promises.stat(tmpPreview);
        console.log(`${prefix}    Preview gerado (${(statPreview.size / 1024).toFixed(0)} KB)`);
        console.log(`${prefix} ⬆️  Enviando para B2...`);
        await uploadToB2(previewKey, tmpPreview);
        await prisma.track.update({
            where: { id: track.id },
            data: { previewKey },
        });
        console.log(`${prefix} ✅ Concluído: ${previewKey}\n`);
    }
    catch (err) {
        console.error(`${prefix} ❌ Erro em "${track.title}":`, err.message);
    }
    finally {
        await fs_1.promises.rm(tmpOriginal, { force: true });
        await fs_1.promises.rm(tmpPreview, { force: true });
    }
}
async function main() {
    console.log('🎬 Gerando previews de 30s para todas as faixas...\n');
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
    for (let i = 0; i < tracks.length; i += CONCURRENCY) {
        const batch = tracks.slice(i, i + CONCURRENCY);
        await Promise.all(batch.map((t, j) => processTrack(t, i + j, tracks.length)));
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
//# sourceMappingURL=generate-previews.js.map