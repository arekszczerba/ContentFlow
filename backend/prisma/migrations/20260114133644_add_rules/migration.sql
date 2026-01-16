-- CreateTable
CREATE TABLE "ExtractionRule" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "selector" TEXT NOT NULL,
    "contentType" TEXT NOT NULL,
    "attribute" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExtractionRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtractionRule_projectId_fieldName_key" ON "ExtractionRule"("projectId", "fieldName");

-- AddForeignKey
ALTER TABLE "ExtractionRule" ADD CONSTRAINT "ExtractionRule_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
