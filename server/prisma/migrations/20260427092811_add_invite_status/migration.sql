-- CreateEnum
CREATE TYPE "InviteStatus" AS ENUM ('PENDING', 'ACTIVE', 'DECLINED');

-- AlterTable
ALTER TABLE "WorkspaceMember" ADD COLUMN     "status" "InviteStatus" NOT NULL DEFAULT 'ACTIVE';
