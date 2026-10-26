-- Problema 9.2: RentalProduct deve ter EXATAMENTE UM entre trackId e albumId
ALTER TABLE "rental_products"
ADD CONSTRAINT "rental_products_exactly_one_target"
CHECK (
  (track_id IS NOT NULL AND album_id IS NULL)
  OR
  (track_id IS NULL AND album_id IS NOT NULL)
);

-- Problema 9.3: Valores monetários não podem ser negativos
ALTER TABLE "rental_products"
ADD CONSTRAINT "rental_products_price_non_negative"
CHECK (price_cents >= 0);
