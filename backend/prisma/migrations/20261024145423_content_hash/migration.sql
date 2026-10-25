-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "contentHash" TEXT;

-- CreateIndex
CREATE INDEX "Attachment_contentHash_idx" ON "Attachment"("contentHash");
