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
const client_1 = require("@prisma/client");
const bcrypt = __importStar(require("bcrypt"));
const prisma = new client_1.PrismaClient();
const B2_IMAGES_BASE = 'https://f005.backblazeb2.com/file/joseph.matthos/assets/img';
const ARTIST_IMAGE = `${B2_IMAGES_BASE}/publico.webp`;
const ALBUMS = [
    { title: 'Mentalidade de Ouro Vol. 1', slug: 'mentalidade-de-ouro-vol-1', cover: 'mentalidadedeourov1.webp', releaseDate: '2026-01-15', genre: 'Hip Hop', mood: 'Inspirador' },
    { title: 'Mentalidade de Ouro Vol. 2', slug: 'mentalidade-de-ouro-vol-2', cover: 'mentalidadedeourov2.webp', releaseDate: '2026-02-01', genre: 'Hip Hop', mood: 'Motivacional' },
    { title: 'Mentalidade de Ouro Vol. 3', slug: 'mentalidade-de-ouro-vol-3', cover: 'mentalidadedeourov3.webp', releaseDate: '2026-02-15', genre: 'Hip Hop', mood: 'Reflexivo' },
    { title: 'Mentalidade de Ouro Vol. 4', slug: 'mentalidade-de-ouro-vol-4', cover: 'mentalidadedeourov4.webp', releaseDate: '2026-03-01', genre: 'Hip Hop', mood: 'Inspirador' },
    { title: 'Mentalidade de Ouro Vol. 5', slug: 'mentalidade-de-ouro-vol-5', cover: 'mentalidadedeourov5.webp', releaseDate: '2026-03-15', genre: 'Hip Hop', mood: 'Motivacional' },
    { title: 'Poesia Viva', slug: 'poesia-viva', cover: 'poesiaviva.webp', releaseDate: '2026-04-01', genre: 'Hip Hop', mood: 'Reflexivo' },
    { title: 'Jardim do Coração', slug: 'jardim-do-coracao', cover: 'jardimdocoracao.webp', releaseDate: '2026-04-15', genre: 'Hip Hop', mood: 'Emocional' },
    { title: 'Caminho, Direção', slug: 'caminho-direcao', cover: 'caminhodirecao.webp', releaseDate: '2026-05-01', genre: 'Hip Hop', mood: 'Motivacional' },
    { title: 'Ressignifique!', slug: 'ressignifique', cover: 'ressignifique.webp', releaseDate: '2026-05-15', genre: 'Hip Hop', mood: 'Inspirador' },
    { title: 'Abismo do Coração', slug: 'abismo-do-coracao', cover: 'abismodocoracao.webp', releaseDate: '2026-06-01', genre: 'Hip Hop', mood: 'Melancólico' },
    { title: 'Ocultos da Alma', slug: 'ocultos-da-alma', cover: 'ocultosdaalma.webp', releaseDate: '2026-06-15', genre: 'Hip Hop', mood: 'Contemplativo' },
    { title: 'Ainda Dá Tempo', slug: 'ainda-da-tempo', cover: 'aindadatempo.webp', releaseDate: '2026-07-01', genre: 'Hip Hop', mood: 'Esperançoso' },
    { title: 'O Instante', slug: 'o-instante', cover: 'oinstante.webp', releaseDate: '2026-07-15', genre: 'Cinemática', mood: 'Emocional' },
    { title: 'Espelho da Alma', slug: 'espelho-da-alma', cover: 'espelhodaalma.webp', releaseDate: '2026-08-01', genre: 'Ambient', mood: 'Contemplativo' },
    { title: 'Prisões Invisíveis', slug: 'prisoes-invisiveis', cover: 'prisoesinvisiveis.webp', releaseDate: '2026-08-15', genre: 'Hip Hop', mood: 'Reflexivo' },
    { title: 'Apocalipse da Emoção', slug: 'apocalipse-da-emocao', cover: 'apocalipsedaemocao.webp', releaseDate: '2026-09-01', genre: 'Hip Hop', mood: 'Intenso' },
    { title: 'História Infinita', slug: 'historia-infinita', cover: 'historiainfinita.webp', releaseDate: '2026-09-15', genre: 'Hip Hop', mood: 'Narrativo' },
    { title: 'Íntima Relação', slug: 'intima-relacao', cover: 'intimarelacao.webp', releaseDate: '2026-10-01', genre: 'Hip Hop', mood: 'Íntimo' },
    { title: 'Dilemas', slug: 'dilemas', cover: 'dilemas.webp', releaseDate: '2026-10-15', genre: 'Hip Hop', mood: 'Reflexivo' },
    { title: 'Razão do Coração', slug: 'razao-do-coracao', cover: 'razaodocoracao.webp', releaseDate: '2026-11-01', genre: 'Hip Hop', mood: 'Emocional' },
    { title: 'Nada Acabou', slug: 'nada-acabou', cover: 'nadaacabou.webp', releaseDate: '2026-11-15', genre: 'Hip Hop', mood: 'Esperançoso' },
    { title: 'Peso da Caneta', slug: 'peso-da-caneta', cover: 'pesodacaneta.webp', releaseDate: '2026-12-01', genre: 'Hip Hop', mood: 'Reflexivo' },
    { title: 'Máquina do Tempo', slug: 'maquina-do-tempo', cover: 'maquinadotempo.webp', releaseDate: '2026-12-15', genre: 'Hip Hop', mood: 'Nostálgico' },
    { title: 'Boom, Boom, Bap', slug: 'boom-boom-bap', cover: 'boomboombap.webp', releaseDate: '2027-01-01', genre: 'Hip Hop', mood: 'Energético' },
    { title: 'O Despertar', slug: 'o-despertar', cover: 'odespertar.webp', releaseDate: '2027-01-15', genre: 'Hip Hop', mood: 'Inspirador' },
    { title: 'Eu Comigo', slug: 'eu-comigo', cover: 'eucomigo.webp', releaseDate: '2027-02-01', genre: 'Hip Hop', mood: 'Íntimo' },
    { title: 'Mar de Inquirições', slug: 'mar-de-inquiricoes', cover: 'mardeinquiricoes.webp', releaseDate: '2027-02-15', genre: 'Hip Hop', mood: 'Filosófico' },
    { title: 'Contraditório', slug: 'contraditorio', cover: 'contraditorio.webp', releaseDate: '2027-03-01', genre: 'Hip Hop', mood: 'Reflexivo' },
    { title: 'Mundo Atual', slug: 'mundo-atual', cover: 'mundoatual.webp', releaseDate: '2027-03-15', genre: 'Hip Hop', mood: 'Crítico' },
    { title: 'Tornado da Arte', slug: 'tornado-da-arte', cover: 'tornadodaarte.webp', releaseDate: '2027-04-01', genre: 'Hip Hop', mood: 'Intenso' },
];
const AINDA_DA_TEMPO_SLUG = 'ainda-da-tempo';
const AINDA_DA_TEMPO_STREAM_PREFIX = 'josephmatthos/aindadatempo';
const AINDA_DA_TEMPO_TRACKS = [
    { title: 'Apreensivo', file: 'Apreensivo.mp3' },
    { title: 'Aqui Jaz um Sentimento', file: 'Aqui jaz um Sentimento.mp3' },
    { title: 'Ciclo', file: 'Ciclo.mp3' },
    { title: 'Loucura Sana', file: 'Loucura Sana.mp3' },
    { title: 'Pra Amar', file: 'Pra Amar.mp3' },
    { title: 'Servo', file: 'Servo.mp3' },
    { title: 'Ainda Dá Tempo', file: 'aindadatempo.mp3' },
    { title: 'Lamento', file: 'eulamento.mp3' },
    { title: 'O Fechar das Cortinas', file: 'ofechardascortinas.mp3' },
    { title: 'Psique Insana', file: 'psiqueinsana.mp3' },
    { title: 'Saudade de Você', file: 'saudadedevoce.mp3' },
];
const TITLE_WORDS_A = [
    'Ser', 'Sempre', 'Sobre', 'Sem', 'Só', 'Sob', 'Sentido', 'Semente', 'Silêncio',
    'Saudade', 'Sonho', 'Sorte', 'Sabedoria', 'Sangue', 'Segredo', 'Sorriso',
    'Vida', 'Verdade', 'Voz', 'Vento', 'Vitória', 'Vazio', 'Viagem', 'Vínculo',
    'Coração', 'Caminho', 'Céu', 'Cinzas', 'Confiança', 'Consciência',
    'Alma', 'Ainda', 'Amanhã', 'Amor', 'Abismo', 'Ápice',
    'Mente', 'Mundo', 'Mar', 'Memória', 'Medo', 'Motivo',
    'Tempo', 'Tudo', 'Terra', 'Trilha', 'Tesouro',
    'Noite', 'Nada', 'Ninguém', 'Nome',
    'Razão', 'Real', 'Risco', 'Raiz',
    'Fogo', 'Fé', 'Força', 'Fim',
    'Peso', 'Paz', 'Porto', 'Presença',
    'Luz', 'Luta', 'Lugar', 'Limite',
    'Dor', 'Destino', 'Deus', 'Dilema',
    'Olhar', 'Ouro', 'Origem', 'Oceano',
    'Instante', 'Infinito', 'Irmão', 'Ilusão',
    'História', 'Horizonte',
];
const TITLE_WORDS_B = [
    'de Ouro', 'da Alma', 'do Coração', 'do Tempo', 'da Vida', 'da Mente',
    'do Mundo', 'do Mar', 'da Noite', 'da Luz', 'do Fogo', 'da Fé',
    'sem Fim', 'sem Medo', 'sem Volta', 'sem Nome',
    'em Mim', 'em Nós', 'em Paz', 'em Guerra',
    'no Espelho', 'no Silêncio', 'no Escuro', 'no Alto',
    'na Estrada', 'na Memória', 'na Pele',
    'infinita', 'invisível', 'eterna', 'viva',
    'de Verdade', 'de Luta', 'de Amor', 'de Sangue',
    'interna', 'externa', 'profunda',
    'do Amanhã', 'do Ontem',
];
function generateTrackTitle(seed, indexInAlbum) {
    const a = TITLE_WORDS_A[(seed * 7 + indexInAlbum * 3) % TITLE_WORDS_A.length];
    const b = TITLE_WORDS_B[(seed * 5 + indexInAlbum * 11) % TITLE_WORDS_B.length];
    return `${a} ${b}`;
}
const TRACK_RENTAL_TIERS = [
    { hours: 24, name: '24 horas', priceCents: 290, sortOrder: 1 },
    { hours: 48, name: '48 horas', priceCents: 490, sortOrder: 2 },
    { hours: 72, name: '3 dias', priceCents: 690, sortOrder: 3 },
    { hours: 120, name: '5 dias', priceCents: 990, sortOrder: 4 },
    { hours: 240, name: '10 dias', priceCents: 1290, sortOrder: 5 },
    { hours: 360, name: '15 dias', priceCents: 1990, sortOrder: 6 },
];
const ALBUM_RENTAL_TIERS = [
    { hours: 24, name: '24 horas', priceCents: 1290, sortOrder: 1 },
    { hours: 48, name: '48 horas', priceCents: 1990, sortOrder: 2 },
    { hours: 72, name: '3 dias', priceCents: 2990, sortOrder: 3 },
    { hours: 120, name: '5 dias', priceCents: 3990, sortOrder: 4 },
    { hours: 240, name: '10 dias', priceCents: 4990, sortOrder: 5 },
    { hours: 360, name: '15 dias', priceCents: 6990, sortOrder: 6 },
];
const TRACKS_PER_ALBUM = 10;
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
    console.log('🌱 Seed JM Music iniciando...');
    const adminPassword = await bcrypt.hash('troque-esta-senha-123', 10);
    const admin = await prisma.user.upsert({
        where: { email: 'joseph@jmmusic.com' },
        update: {
            emailVerified: new Date(),
        },
        create: {
            email: 'joseph@jmmusic.com',
            name: 'Joseph Matthos',
            passwordHash: adminPassword,
            role: client_1.UserRole.ADMIN,
            emailVerified: new Date(),
        },
    });
    console.log(`👤 Admin: ${admin.email}`);
    const artist = await prisma.artist.upsert({
        where: { name: 'Joseph Matthos' },
        update: {
            slug: 'joseph-matthos',
            imageUrl: ARTIST_IMAGE,
            bio: 'Artista e titular do catálogo JM Music.',
        },
        create: {
            name: 'Joseph Matthos',
            slug: 'joseph-matthos',
            bio: 'Artista e titular do catálogo JM Music.',
            imageUrl: ARTIST_IMAGE,
        },
    });
    console.log(`🎤 Artista: ${artist.name} (${artist.slug})`);
    await prisma.playbackEvent.deleteMany({});
    await prisma.rental.deleteMany({});
    await prisma.orderItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.rentalProduct.deleteMany({});
    await prisma.track.deleteMany({});
    await prisma.album.deleteMany({});
    console.log('🧹 Aluguéis, pedidos, álbuns, faixas e produtos antigos removidos');
    let trackTotal = 0;
    let productTotal = 0;
    for (let i = 0; i < ALBUMS.length; i++) {
        const a = ALBUMS[i];
        const coverUrl = `${B2_IMAGES_BASE}/${a.cover}`;
        const album = await prisma.album.create({
            data: {
                title: a.title,
                slug: a.slug,
                coverUrl,
                releaseDate: new Date(a.releaseDate),
                artistId: artist.id,
                sortOrder: i,
            },
        });
        await prisma.rentalProduct.createMany({
            data: ALBUM_RENTAL_TIERS.map((t) => ({
                albumId: album.id,
                name: t.name,
                durationHours: t.hours,
                priceCents: t.priceCents,
                currency: 'BRL',
                active: true,
                sortOrder: t.sortOrder,
            })),
        });
        productTotal += ALBUM_RENTAL_TIERS.length;
        if (a.slug === AINDA_DA_TEMPO_SLUG) {
            for (let j = 0; j < AINDA_DA_TEMPO_TRACKS.length; j++) {
                const t = AINDA_DA_TEMPO_TRACKS[j];
                const trackSlug = slugify(`${t.title}-${j + 1}`);
                const track = await prisma.track.create({
                    data: {
                        albumId: album.id,
                        artistId: artist.id,
                        title: t.title,
                        slug: trackSlug,
                        genre: a.genre,
                        mood: a.mood,
                        durationSeconds: null,
                        status: client_1.TrackStatus.PUBLISHED,
                        streamKey: `${AINDA_DA_TEMPO_STREAM_PREFIX}/${t.file}`,
                    },
                });
                trackTotal++;
                await prisma.rentalProduct.createMany({
                    data: TRACK_RENTAL_TIERS.map((tier) => ({
                        trackId: track.id,
                        name: tier.name,
                        durationHours: tier.hours,
                        priceCents: tier.priceCents,
                        currency: 'BRL',
                        active: true,
                        sortOrder: tier.sortOrder,
                    })),
                });
                productTotal += TRACK_RENTAL_TIERS.length;
            }
            continue;
        }
        for (let j = 0; j < TRACKS_PER_ALBUM; j++) {
            const baseTitle = generateTrackTitle(i, j);
            const trackSlug = slugify(`${baseTitle}-${j + 1}`);
            const duration = 90 + ((i * 17 + j * 23) % 180);
            const track = await prisma.track.create({
                data: {
                    albumId: album.id,
                    artistId: artist.id,
                    title: baseTitle,
                    slug: trackSlug,
                    genre: a.genre,
                    mood: a.mood,
                    durationSeconds: duration,
                    status: client_1.TrackStatus.PUBLISHED,
                },
            });
            trackTotal++;
            await prisma.rentalProduct.createMany({
                data: TRACK_RENTAL_TIERS.map((t) => ({
                    trackId: track.id,
                    name: t.name,
                    durationHours: t.hours,
                    priceCents: t.priceCents,
                    currency: 'BRL',
                    active: true,
                    sortOrder: t.sortOrder,
                })),
            });
            productTotal += TRACK_RENTAL_TIERS.length;
        }
    }
    console.log(`💿 Álbuns: ${ALBUMS.length}`);
    console.log(`🎵 Faixas: ${trackTotal}`);
    console.log(`📄 Produtos de aluguel: ${productTotal}`);
    await prisma.plan.updateMany({
        data: { active: false },
    });
    const plans = [
        {
            name: 'Pro Mensal',
            priceCents: 1990,
            currency: 'BRL',
            intervalUnit: 'month',
            intervalCount: 1,
            active: true,
        },
        {
            name: 'Pro Anual',
            priceCents: 17990,
            currency: 'BRL',
            intervalUnit: 'year',
            intervalCount: 1,
            active: true,
        },
    ];
    for (const plan of plans) {
        await prisma.plan.upsert({
            where: { name: plan.name },
            update: {
                priceCents: plan.priceCents,
                currency: plan.currency,
                intervalUnit: plan.intervalUnit,
                intervalCount: plan.intervalCount,
                active: plan.active,
            },
            create: plan,
        });
    }
    console.log(`💳 Planos ativos: ${plans.map((p) => p.name).join(', ')}`);
    console.log(`   ⤷ Pro Mensal: R$ 19,90/mês`);
    console.log(`   ⤷ Pro Anual:  R$ 179,90/ano (economia de R$ 58,90)`);
    const socials = [
        { platform: 'spotify', label: 'Spotify', url: 'https://open.spotify.com/artist/6CoZAvrQxUxB0Gx5aAXZlo', sortOrder: 1 },
        { platform: 'youtube', label: 'YouTube', url: 'https://www.youtube.com/@josephmatthos', sortOrder: 2 },
        { platform: 'amazon', label: 'Amazon Music', url: 'https://music.amazon.com.br/artists/B0H7Z173V1/joseph-matthos', sortOrder: 3 },
        { platform: 'facebook', label: 'Facebook', url: 'https://www.facebook.com/profile.php?id=61593112378384', sortOrder: 4 },
        { platform: 'tiktok', label: 'TikTok', url: 'https://tiktok.com/@joseph.matthos', sortOrder: 5 },
        { platform: 'apple', label: 'Apple Music', url: 'https://music.apple.com/us/artist/joseph-matthos/6802310570', sortOrder: 6 },
        { platform: 'audiomack', label: 'Audiomack', url: 'https://audiomack.com/josephmatthos', sortOrder: 7 },
    ];
    for (const s of socials) {
        await prisma.socialLink.upsert({
            where: { platform: s.platform },
            update: { url: s.url, label: s.label, sortOrder: s.sortOrder, active: true },
            create: s,
        });
    }
    console.log(`🔗 Redes sociais: ${socials.length}`);
    console.log('✅ Seed concluído.');
}
main()
    .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map