-- AlterTable
ALTER TABLE "User"
ADD COLUMN "location" TEXT,
ADD COLUMN "languagesSpoken" TEXT,
ADD COLUMN "profileHighlights" JSONB,
ADD COLUMN "profileStats" JSONB,
ADD COLUMN "pedagogicalModules" JSONB;
