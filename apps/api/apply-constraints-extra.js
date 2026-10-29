const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const statements = [
  `ALTER TABLE "orders" ADD CONSTRAINT "orders_total_cents_nonnegative" CHECK ("total_cents" >= 0)`,
  `ALTER TABLE "order_items" ADD CONSTRAINT "order_items_quantity_positive" CHECK ("quantity" >= 1)`,
  `ALTER TABLE "rental_products" ADD CONSTRAINT "rental_products_one_destination" CHECK (("track_id" IS NOT NULL AND "album_id" IS NULL) OR ("track_id" IS NULL AND "album_id" IS NOT NULL))`,
];

async function main() {
  for (let i = 0; i < statements.length; i++) {
    try {
      await prisma.$executeRawUnsafe(statements[i]);
      console.log(`✅ [${i + 1}/${statements.length}] OK`);
    } catch (e) {
      if (e.meta?.code === '42710') {
        console.log(`⏭️  [${i + 1}/${statements.length}] já existe (ignorado)`);
      } else {
        console.error(`❌ [${i + 1}/${statements.length}] ${e.message}`);
      }
    }
  }
  await prisma.$disconnect();
}

main();