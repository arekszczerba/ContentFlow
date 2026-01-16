/*
  Warnings:

  - You are about to drop the `ComponentPattern` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ComponentPattern" DROP CONSTRAINT "ComponentPattern_projectId_fkey";

-- DropTable
DROP TABLE "ComponentPattern";

-- CreateTable
CREATE TABLE "ContentBlockPattern" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "structure" TEXT NOT NULL,
    "exampleHtml" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL DEFAULT 0,
    "canonicalType" "CanonicalType" NOT NULL DEFAULT 'UNKNOWN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentBlockPattern_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContentBlockPattern_projectId_fingerprint_key" ON "ContentBlockPattern"("projectId", "fingerprint");

-- AddForeignKey
ALTER TABLE "ContentBlockPattern" ADD CONSTRAINT "ContentBlockPattern_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
