-- AlterTable
ALTER TABLE "sources" ADD COLUMN     "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "sources_type_idx" ON "sources"("type");
