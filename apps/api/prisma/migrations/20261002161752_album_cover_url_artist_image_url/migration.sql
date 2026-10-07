/*
  Warnings:

  - You are about to drop the column `cover_key` on the `albums` table. All the data in the column will be lost.
  - You are about to drop the column `image_key` on the `artists` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[slug]` on the table `artists` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "albums" DROP COLUMN "cover_key",
ADD COLUMN     "cover_url" TEXT,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "artists" DROP COLUMN "image_key",
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "slug" TEXT;

-- CreateIndex
CREATE INDEX "albums_artist_id_idx" ON "albums"("artist_id");

-- CreateIndex
CREATE INDEX "albums_sort_order_idx" ON "albums"("sort_order");

-- CreateIndex
CREATE UNIQUE INDEX "artists_slug_key" ON "artists"("slug");
