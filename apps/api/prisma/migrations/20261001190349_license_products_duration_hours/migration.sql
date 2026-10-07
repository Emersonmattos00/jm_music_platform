/*
  Warnings:

  - You are about to drop the column `duration_days` on the `license_products` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "license_products" DROP COLUMN "duration_days",
ADD COLUMN     "duration_hours" INTEGER,
ADD COLUMN     "sort_order" INTEGER NOT NULL DEFAULT 0;
