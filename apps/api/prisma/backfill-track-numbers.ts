import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  const albums = await prisma.album.findMany({ select: { id: true, title: true } });
  console.log(`Populando trackNumber para ${albums.length} álbuns...\n`);

  let totalUpdated = 0;

  for (const album of albums) {
    const tracks = await prisma.track.findMany({
      where: { albumId: album.id },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });

    for (let i = 0; i < tracks.length; i++) {
      await prisma.track.update({
        where: { id: tracks[i].id },
        data: { trackNumber: i + 1 },
      });
      totalUpdated++;
    }

    console.log(`✅ ${album.title}: ${tracks.length} faixas numeradas`);
  }

  console.log(`\n🎉 Total: ${totalUpdated} faixas atualizadas.`);
}

main()
  .catch((e) => {
    console.error('❌ Erro:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });