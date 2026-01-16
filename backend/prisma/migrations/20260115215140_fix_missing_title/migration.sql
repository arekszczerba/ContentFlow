/*
  Warnings:

  - You are about to drop the column `language` on the `Page` table. All the data in the column will be lost.
  - You are about to drop the column `targetUrl` on the `Page` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "CanonicalType" AS ENUM ('UNKNOWN', 'HEADER', 'RICH_TEXT', 'IMAGE', 'IMAGE_TEXT', 'CTA', 'QUOTE', 'TABLE', 'HERO_BANNER', 'AUTHOR_BOX', 'RELATED_ARTICLES', 'CONTAINER');

-- AlterTable
ALTER TABLE "Page" DROP COLUMN "language",
DROP COLUMN "targetUrl",
ADD COLUMN     "legacyTemplate" TEXT,
ADD COLUMN     "metaDesc" TEXT,
ADD COLUMN     "metaTitle" TEXT,
ADD COLUMN     "newTemplate" TEXT;

-- CreateTable
CREATE TABLE "ComponentPattern" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "isLayout" BOOLEAN NOT NULL DEFAULT false,
    "componentType" "CanonicalType" NOT NULL DEFAULT 'UNKNOWN',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ComponentPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ComponentPattern_projectId_selector_key" ON "ComponentPattern"("projectId", "selector");

-- AddForeignKey
ALTER TABLE "ComponentPattern" ADD CONSTRAINT "ComponentPattern_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
