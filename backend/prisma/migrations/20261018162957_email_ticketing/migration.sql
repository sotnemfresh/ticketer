/*
  Warnings:

  - You are about to drop the column `body` on the `TicketMessage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[messageIdHeader]` on the table `TicketMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[graphMessageId]` on the table `TicketMessage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `bodyText` to the `TicketMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('INBOUND', 'OUTBOUND', 'INTERNAL_NOTE');

-- CreateEnum
CREATE TYPE "TicketSource" AS ENUM ('WEB', 'EMAIL');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'CUSTOMER';

-- DropForeignKey
ALTER TABLE "TicketMessage" DROP CONSTRAINT "TicketMessage_authorId_fkey";

-- AlterTable
ALTER TABLE "Ticket" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "conversationId" TEXT,
ADD COLUMN     "source" "TicketSource" NOT NULL DEFAULT 'WEB';

-- AlterTable
ALTER TABLE "TicketMessage" RENAME COLUMN "body" TO "bodyText";

-- AlterTable
ALTER TABLE "TicketMessage"
ADD COLUMN     "authorEmail" TEXT,
ADD COLUMN     "authorName" TEXT,
ADD COLUMN     "bodyHtml" TEXT,
ADD COLUMN     "graphMessageId" TEXT,
ADD COLUMN     "inReplyTo" TEXT,
ADD COLUMN     "messageIdHeader" TEXT,
ADD COLUMN     "references" TEXT[],
ADD COLUMN     "type" "MessageType" NOT NULL DEFAULT 'INTERNAL_NOTE',
ALTER COLUMN "authorId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;

-- CreateTable
CREATE TABLE "Attachment" (
    "id" SERIAL NOT NULL,
    "messageId" INTEGER NOT NULL,
    "filename" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "contentId" TEXT,
    "isInline" BOOLEAN NOT NULL DEFAULT false,
    "storageKey" TEXT,
    "graphAttachmentId" TEXT,
    "purgedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketFollower" (
    "id" SERIAL NOT NULL,
    "ticketId" INTEGER NOT NULL,
    "userId" INTEGER,
    "email" TEXT NOT NULL,

    CONSTRAINT "TicketFollower_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MailboxSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "mailboxAddress" TEXT,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "deltaLink" TEXT,
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MailboxSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storageKey_key" ON "Attachment"("storageKey");

-- CreateIndex
CREATE INDEX "Attachment_messageId_idx" ON "Attachment"("messageId");

-- CreateIndex
CREATE UNIQUE INDEX "TicketFollower_ticketId_email_key" ON "TicketFollower"("ticketId", "email");

-- CreateIndex
CREATE INDEX "Ticket_conversationId_idx" ON "Ticket"("conversationId");

-- CreateIndex
CREATE INDEX "Ticket_status_closedAt_idx" ON "Ticket"("status", "closedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TicketMessage_messageIdHeader_key" ON "TicketMessage"("messageIdHeader");

-- CreateIndex
CREATE UNIQUE INDEX "TicketMessage_graphMessageId_key" ON "TicketMessage"("graphMessageId");

-- CreateIndex
CREATE INDEX "TicketMessage_ticketId_createdAt_idx" ON "TicketMessage"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketMessage_inReplyTo_idx" ON "TicketMessage"("inReplyTo");

-- AddForeignKey
ALTER TABLE "TicketMessage" ADD CONSTRAINT "TicketMessage_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "TicketMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFollower" ADD CONSTRAINT "TicketFollower_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketFollower" ADD CONSTRAINT "TicketFollower_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
