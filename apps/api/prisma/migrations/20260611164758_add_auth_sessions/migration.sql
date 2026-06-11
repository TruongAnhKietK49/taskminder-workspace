-- AlterTable
ALTER TABLE "auth_sessions" ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "user_agent" TEXT;
