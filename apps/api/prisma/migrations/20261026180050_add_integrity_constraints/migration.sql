-- 1. Pedidos não podem ter valor negativo
ALTER TABLE "Order" 
ADD CONSTRAINT "Order_totalCents_nonnegative" CHECK ("totalCents" >= 0);

-- 2. Itens de pedido devem ter quantidade maior ou igual a 1
ALTER TABLE "OrderItem" 
ADD CONSTRAINT "OrderItem_quantity_positive" CHECK ("quantity" >= 1);

-- 3. Aluguéis devem ter período válido (expira depois de começar)
ALTER TABLE "Rental" 
ADD CONSTRAINT "Rental_period_valid" CHECK ("expiresAt" > "startsAt");

-- 4. Produtos de aluguel devem ter exatamente um destino (faixa ou álbum)
ALTER TABLE "RentalProduct" 
ADD CONSTRAINT "RentalProduct_one_destination" 
CHECK (
  ("trackId" IS NOT NULL AND "albumId" IS NULL) OR 
  ("trackId" IS NULL AND "albumId" IS NOT NULL)
);

-- 5. Aluguéis devem ter exatamente um destino (faixa ou álbum)
ALTER TABLE "Rental" 
ADD CONSTRAINT "Rental_one_destination" 
CHECK (
  ("trackId" IS NOT NULL AND "albumId" IS NULL) OR 
  ("trackId" IS NULL AND "albumId" IS NOT NULL)
);