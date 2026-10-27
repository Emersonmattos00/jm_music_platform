-- Ativa a extensão citext (case-insensitive string)
CREATE EXTENSION IF NOT EXISTS citext;

-- Converte a coluna email da tabela users para citext
-- Nota: O Prisma pode tentar recriar a coluna. Se houver dados, precisamos converter.
-- Como estamos em ambiente de teste/desenvolvimento, podemos usar o ALTER TYPE direto.
ALTER TABLE "users" ALTER COLUMN "email" TYPE citext;