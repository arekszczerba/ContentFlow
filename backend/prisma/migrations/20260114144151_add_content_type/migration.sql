/*
  Warnings:

  - You are about to drop the column `fieldName` on the `ExtractionRule` table. All the data in the column will be lost.
  - Added the required column `name` to the `ExtractionRule` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RuleType" AS ENUM ('GLOBAL', 'CONTAINER', 'COMPONENT');

-- DropIndex
DROP INDEX "ExtractionRule_projectId_fieldName_key";

-- AlterTable
ALTER TABLE "ExtractionRule" DROP COLUMN "fieldName",
ADD COLUMN     "definitions" JSONB,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "ruleType" "RuleType" NOT NULL DEFAULT 'GLOBAL',
ALTER COLUMN "contentType" DROP NOT NULL;
