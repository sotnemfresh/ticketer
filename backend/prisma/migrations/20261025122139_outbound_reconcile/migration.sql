-- AlterTable
ALTER TABLE "OutboundDelivery" ADD COLUMN     "metadataVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "needsInvestigation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "nextReconcileAt" TIMESTAMP(3),
ADD COLUMN     "reconcileCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "OutboundDelivery_status_nextReconcileAt_idx" ON "OutboundDelivery"("status", "nextReconcileAt");
