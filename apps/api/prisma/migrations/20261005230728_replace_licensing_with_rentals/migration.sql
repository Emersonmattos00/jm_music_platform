/*
  Warnings:

  - The values [LICENSE] on the enum `ProductType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the `license_products` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `licenses` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "RentalStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- AlterEnum
BEGIN;
CREATE TYPE "ProductType_new" AS ENUM ('RENTAL', 'SUBSCRIPTION');
ALTER TABLE "order_items" ALTER COLUMN "product_type" TYPE "ProductType_new" USING ("product_type"::text::"ProductType_new");
ALTER TYPE "ProductType" RENAME TO "ProductType_old";
ALTER TYPE "ProductType_new" RENAME TO "ProductType";
DROP TYPE "public"."ProductType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "license_products" DROP CONSTRAINT "license_products_track_id_fkey";

-- DropForeignKey
ALTER TABLE "licenses" DROP CONSTRAINT "licenses_order_id_fkey";

-- DropForeignKey
ALTER TABLE "licenses" DROP CONSTRAINT "licenses_track_id_fkey";

-- DropForeignKey
ALTER TABLE "licenses" DROP CONSTRAINT "licenses_user_id_fkey";

-- AlterTable
ALTER TABLE "subscriptions" ADD COLUMN     "init_point" TEXT,
ADD COLUMN     "payer_email" TEXT;

-- DropTable
DROP TABLE "license_products";

-- DropTable
DROP TABLE "licenses";

-- DropEnum
DROP TYPE "LicenseStatus";

-- CreateTable
CREATE TABLE "rental_products" (
    "id" UUID NOT NULL,
    "track_id" UUID,
    "album_id" UUID,
    "name" TEXT NOT NULL,
    "duration_hours" INTEGER NOT NULL,
    "price_cents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BRL',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "rental_products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rentals" (
    "id" UUID NOT NULL,
    "rental_code" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "track_id" UUID,
    "album_id" UUID,
    "order_id" UUID,
    "status" "RentalStatus" NOT NULL DEFAULT 'PENDING',
    "starts_at" TIMESTAMPTZ NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rentals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rental_products_track_id_idx" ON "rental_products"("track_id");

-- CreateIndex
CREATE INDEX "rental_products_album_id_idx" ON "rental_products"("album_id");

-- CreateIndex
CREATE UNIQUE INDEX "rentals_rental_code_key" ON "rentals"("rental_code");

-- CreateIndex
CREATE INDEX "rentals_user_id_idx" ON "rentals"("user_id");

-- CreateIndex
CREATE INDEX "rentals_track_id_idx" ON "rentals"("track_id");

-- CreateIndex
CREATE INDEX "rentals_album_id_idx" ON "rentals"("album_id");

-- AddForeignKey
ALTER TABLE "rental_products" ADD CONSTRAINT "rental_products_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rental_products" ADD CONSTRAINT "rental_products_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_track_id_fkey" FOREIGN KEY ("track_id") REFERENCES "tracks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_album_id_fkey" FOREIGN KEY ("album_id") REFERENCES "albums"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rentals" ADD CONSTRAINT "rentals_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
