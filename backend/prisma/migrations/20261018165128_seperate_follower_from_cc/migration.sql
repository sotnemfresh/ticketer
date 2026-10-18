-- CreateEnum
CREATE TYPE "FollowerType" AS ENUM ('CC', 'FOLLOWER');

-- AlterTable
ALTER TABLE "TicketFollower" ADD COLUMN     "type" "FollowerType" NOT NULL DEFAULT 'CC';
