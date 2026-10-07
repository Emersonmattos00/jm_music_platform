-- AlterTable
ALTER TABLE "tracks" ADD COLUMN     "track_number" INTEGER;

-- CreateIndex
CREATE INDEX "tracks_album_id_track_number_idx" ON "tracks"("album_id", "track_number");
