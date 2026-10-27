-- 45.5: Numeração única de faixas por álbum (quando ambos definidos)
CREATE UNIQUE INDEX "tracks_album_track_number_unique"
ON "tracks" ("album_id", "track_number")
WHERE "album_id" IS NOT NULL AND "track_number" IS NOT NULL;

-- 45.7: Aluguéis com período válido
ALTER TABLE "rentals"
ADD CONSTRAINT "rentals_valid_period"
CHECK ("expires_at" > "starts_at");

-- 45.7: Aluguéis com exatamente um destino (faixa OU álbum)
ALTER TABLE "rentals"
ADD CONSTRAINT "rentals_exactly_one_target"
CHECK (
  (track_id IS NOT NULL AND album_id IS NULL)
  OR
  (track_id IS NULL AND album_id IS NOT NULL)
);
