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
const MEDIA_PREFIX = 'josephmatthos/';
function slugify(text) {
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 80);
}
async function main() {
    console.log('🔄 Sincronizando músicas do Backblaze com o banco...');
    const list = await s3.send(new client_s3_1.ListObjectsV2Command({
        Bucket: BUCKET,
        Prefix: MEDIA_PREFIX,
        Delimiter: '/',
    }));
    const folders = (list.CommonPrefixes ?? [])
        .map((p) => p.Prefix?.replace(MEDIA_PREFIX, '').replace(/\/$/, ''))
        .filter((f) => !!f);
    console.log(`📁 Pastas encontradas no B2: ${folders.length}`);
    const artist = await prisma.artist.findFirst({
        where: { slug: 'joseph-matthos' },
        select: { id: true },
    });
    if (!artist) {
        console.error('❌ Artista Joseph Matthos não encontrado no banco. Rode `npm run seed` primeiro.');
        process.exit(1);
    }
    for (const folder of folders) {
        const folderPrefix = `${MEDIA_PREFIX}${folder}/`;
        const filesList = await s3.send(new client_s3_1.ListObjectsV2Command({
            Bucket: BUCKET,
            Prefix: folderPrefix,
        }));
        const mp3s = (filesList.Contents ?? [])
            .map((o) => o.Key)
            .filter((k) => k.toLowerCase().endsWith('.mp3'));
        if (mp3s.length === 0)
            continue;
        const candidates = await prisma.album.findMany({
            select: { id: true, slug: true, title: true },
        });
        const album = candidates.find((a) => {
            const slugified = a.slug.replace(/-/g, '');
            const folderLower = folder.toLowerCase();
            if (slugified === folderLower)
                return true;
            const albumClean = slugified.replace(/vol(\d)/, 'v$1');
            if (albumClean === folderLower)
                return true;
            return false;
        });
        if (!album) {
            console.log(`   ⏭️  Pasta "${folder}" não corresponde a nenhum álbum. Ignorando.`);
            continue;
        }
        console.log(`\n📀 Álbum: ${album.title} (${album.slug})`);
        console.log(`   ${mp3s.length} faixas no B2`);
        const existingTracks = await prisma.track.findMany({
            where: { albumId: album.id },
            select: { id: true, title: true, streamKey: true },
        });
        for (const key of mp3s) {
            const filename = key.substring(key.lastIndexOf('/') + 1);
            const title = filename
                .replace(/\.mp3$/i, '')
                .replace(/_/g, ' ')
                .trim();
            const existing = existingTracks.find((t) => t.title === title);
            if (existing) {
                await prisma.track.update({
                    where: { id: existing.id },
                    data: { streamKey: key },
                });
                console.log(`   ↻ ${title} → atualizado`);
            }
            else {
                const slug = slugify(`${title}-${Date.now()}`);
                const created = await prisma.track.create({
                    data: {
                        albumId: album.id,
                        artistId: artist.id,
                        title,
                        slug,
                        genre: 'Hip Hop',
                        status: client_1.TrackStatus.PUBLISHED,
                        streamKey: key,
                    },
                });
                const tiers = [
                    { hours: 24, name: '24 horas', priceCents: 290, sortOrder: 1 },
                    { hours: 48, name: '48 horas', priceCents: 490, sortOrder: 2 },
                    { hours: 72, name: '3 dias', priceCents: 690, sortOrder: 3 },
                    { hours: 120, name: '5 dias', priceCents: 990, sortOrder: 4 },
                    { hours: 240, name: '10 dias', priceCents: 1290, sortOrder: 5 },
                    { hours: 360, name: '15 dias', priceCents: 1990, sortOrder: 6 },
                ];
                await prisma.rentalProduct.createMany({
                    data: tiers.map((t) => ({
                        trackId: created.id,
                        name: t.name,
                        durationHours: t.hours,
                        priceCents: t.priceCents,
                        currency: 'BRL',
                        active: true,
                        sortOrder: t.sortOrder,
                    })),
                });
                console.log(`   + ${title} → criado`);
            }
        }
        const orphanTracks = await prisma.track.findMany({
            where: { albumId: album.id, streamKey: null },
            select: { id: true, title: true },
        });
        if (orphanTracks.length > 0 && mp3s.length > 0) {
            for (const t of orphanTracks) {
                await prisma.rentalProduct.deleteMany({ where: { trackId: t.id } });
                await prisma.playbackEvent.deleteMany({ where: { trackId: t.id } });
                await prisma.rental.deleteMany({ where: { trackId: t.id } });
                await prisma.track.delete({ where: { id: t.id } });
            }
            console.log(`   🧹 ${orphanTracks.length} faixas genéricas removidas`);
        }
    }
    console.log('\n✅ Sincronização concluída.');
}
main()
    .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=sync-b2.js.map