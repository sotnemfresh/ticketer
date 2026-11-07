/*
  Warnings:

  - A unique constraint covering the columns `[ticketId,email,type]` on the table `TicketFollower` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "TicketFollower_ticketId_email_key";

-- CreateIndex
CREATE UNIQUE INDEX "TicketFollower_ticketId_email_type_key" ON "TicketFollower"("ticketId", "email", "type");
