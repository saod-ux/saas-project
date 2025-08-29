-- Add hasVariants column to products table
ALTER TABLE "products" ADD COLUMN "hasVariants" BOOLEAN NOT NULL DEFAULT false;
