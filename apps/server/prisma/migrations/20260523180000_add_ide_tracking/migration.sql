-- AlterTable
ALTER TABLE "UserSettings" ADD COLUMN "lastIdeClient" TEXT,
ADD COLUMN "lastIdeSyncAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "CodingSession" ADD COLUMN "ideClient" TEXT;
