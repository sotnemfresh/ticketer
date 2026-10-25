-- CreateEnum
CREATE TYPE "OutboundDeliveryStatus" AS ENUM ('PENDING', 'PREPARING', 'READY', 'SENDING', 'ACCEPTED', 'UNKNOWN', 'FAILED');

-- CreateTable
CREATE TABLE "OutboundDelivery" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "status" "OutboundDeliveryStatus" NOT NULL DEFAULT 'PENDING',
    "senderMailbox" TEXT NOT NULL,
    "toEmails" TEXT[],
    "ccEmails" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "subject" TEXT NOT NULL,
    "bodyHtml" TEXT NOT NULL,
    "replyToGraphMessageId" TEXT,
    "inReplyTo" TEXT,
    "references" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "graphDraftId" TEXT,
    "internetMessageId" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "leaseToken" TEXT,
    "leaseExpiresAt" TIMESTAMP(3),
    "sendStartedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboundDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "OutboundDelivery_messageId_key" ON "OutboundDelivery"("messageId");

-- CreateIndex
CREATE INDEX "OutboundDelivery_status_nextAttemptAt_idx" ON "OutboundDelivery"("status", "nextAttemptAt");

-- CreateIndex
CREATE INDEX "OutboundDelivery_status_leaseExpiresAt_idx" ON "OutboundDelivery"("status", "leaseExpiresAt");

-- AddForeignKey
ALTER TABLE "OutboundDelivery" ADD CONSTRAINT "OutboundDelivery_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TicketMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
