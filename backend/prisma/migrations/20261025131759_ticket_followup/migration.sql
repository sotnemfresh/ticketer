-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "followUpOfId" INTEGER;

-- CreateIndex
CREATE INDEX "Ticket_followUpOfId_idx" ON "Ticket"("followUpOfId");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_followUpOfId_fkey" FOREIGN KEY ("followUpOfId") REFERENCES "Ticket"("id") ON DELETE SET NULL ON UPDATE CASCADE;
