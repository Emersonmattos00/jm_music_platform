import { PrismaClient, UserRole, TrackStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed JM Music iniciando...');

  // ------------------------------------------------------------
  // 1. Usuário admin (Joseph Matthos)
  // ------------------------------------------------------------
  const adminPassword = await bcrypt.hash('troque-esta-senha-123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'joseph@jmmusic.com' },
    update: {},
    create: {
      email: 'joseph@jmmusic.com',
      name: 'Joseph Matthos',
      passwordHash: adminPassword,
      role: UserRole.ADMIN,
    },
  });
  console.log(`👤 Admin criado: ${admin.email}`);

  // ------------------------------------------------------------
  // 2. Artista
  // ------------------------------------------------------------
  const artist = await prisma.artist.upsert({
    where: { name: 'Joseph Matthos' },
    update: {},
    create: {
      name: 'Joseph Matthos',
      bio: 'Artista e titular do catálogo JM Music.',
    },
  });
  console.log(`🎤 Artista: ${artist.name}`);

  // ------------------------------------------------------------
  // 3. Álbuns
  // ------------------------------------------------------------
  const album1 = await prisma.album.upsert({
    where: { slug: 'origins-vol-1' },
    update: {},
    create: {
      title: 'Origins Vol. 1',
      slug: 'origins-vol-1',
      artistId: artist.id,
      releaseDate: new Date('2026-01-15'),
    },
  });

  const album2 = await prisma.album.upsert({
    where: { slug: 'reflexos' },
    update: {},
    create: {
      title: 'Reflexos',
      slug: 'reflexos',
      artistId: artist.id,
      releaseDate: new Date('2026-03-20'),
    },
  });
  console.log(`💿 Álbuns: ${album1.title}, ${album2.title}`);

  // ------------------------------------------------------------
  // 4. Faixas (títulos do protótipo HTML)
  // ------------------------------------------------------------
  const tracksData = [
    { title: 'Jardim do Coração',   slug: 'jardim-do-coracao',   genre: 'Hip Hop',      mood: 'Reflexivo',     albumId: album1.id },
    { title: 'Mentalidade de Ouro', slug: 'mentalidade-de-ouro', genre: 'Hip Hop',      mood: 'Inspirador',    albumId: album1.id },
    { title: 'O Instante',          slug: 'o-instante',          genre: 'Cinemática',   mood: 'Emocional',     albumId: album2.id },
    { title: 'Caminho, Direção',    slug: 'caminho-direcao',     genre: 'Hip Hop',      mood: 'Motivacional',  albumId: album2.id },
    { title: 'Espelho da Alma',     slug: 'espelho-da-alma',     genre: 'Ambient',      mood: 'Contemplativo', albumId: album2.id },
    { title: 'Horizonte Interior',  slug: 'horizonte-interior',  genre: 'Instrumental', mood: 'Calmo',         albumId: album2.id },
  ];

  const tracks = [];
  for (const t of tracksData) {
    const track = await prisma.track.upsert({
      where: { slug: t.slug },
      update: {},
      create: {
        ...t,
        artistId: artist.id,
        status: TrackStatus.PUBLISHED,
      },
    });
    tracks.push(track);
  }
  console.log(`🎵 Faixas: ${tracks.length}`);

  // ------------------------------------------------------------
  // 5. Produtos de licença (por faixa)
  // ------------------------------------------------------------
  const licenseProductsByTrack = [
    {
      trackId: tracks[0].id,
      products: [
        { name: 'YouTube e redes', purpose: 'youtube', commercialUse: true,  downloadAllowed: false, durationDays: 365, priceCents: 1990 },
        { name: 'Podcast',         purpose: 'podcast', commercialUse: true,  downloadAllowed: false, durationDays: 365, priceCents: 1990 },
        { name: 'Pessoal',         purpose: 'personal', commercialUse: false, downloadAllowed: false, durationDays: 365, priceCents: 990  },
      ],
    },
    {
      trackId: tracks[1].id,
      products: [
        { name: 'YouTube e redes', purpose: 'youtube', commercialUse: true, downloadAllowed: false, durationDays: 365, priceCents: 1990 },
        { name: 'Comercial',       purpose: 'commercial', commercialUse: true, downloadAllowed: true, durationDays: 365, priceCents: 4990 },
      ],
    },
    {
      trackId: tracks[2].id,
      products: [
        { name: 'Cinemática', purpose: 'commercial', commercialUse: true, downloadAllowed: true, durationDays: 730, priceCents: 7990 },
      ],
    },
    {
      trackId: tracks[3].id,
      products: [
        { name: 'YouTube e redes', purpose: 'youtube', commercialUse: true, downloadAllowed: false, durationDays: 365, priceCents: 1990 },
      ],
    },
    {
      trackId: tracks[4].id,
      products: [
        { name: 'YouTube e redes', purpose: 'youtube', commercialUse: true, downloadAllowed: false, durationDays: 365, priceCents: 1490 },
      ],
    },
    {
      trackId: tracks[5].id,
      products: [
        { name: 'Instrumental comercial', purpose: 'commercial', commercialUse: true, downloadAllowed: true, durationDays: 365, priceCents: 3490 },
      ],
    },
  ];

  for (const { trackId, products } of licenseProductsByTrack) {
    for (const p of products) {
      await prisma.licenseProduct.create({
        data: { ...p, trackId },
      });
    }
  }
  console.log('📄 Produtos de licença criados');

  // ------------------------------------------------------------
  // 6. Planos de assinatura (valores do protótipo HTML)
  // ------------------------------------------------------------
  const plans = [
    { name: 'Explorador', priceCents: 0,     intervalUnit: 'month', intervalCount: 1 },
    { name: 'Criador',    priceCents: 2990,  intervalUnit: 'month', intervalCount: 1 },
    { name: 'Estúdio',    priceCents: 7990,  intervalUnit: 'month', intervalCount: 1 },
  ];

  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { name: plan.name },
      update: {},
      create: plan,
    });
  }
  console.log(`💳 Planos: ${plans.map(p => p.name).join(', ')}`);

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