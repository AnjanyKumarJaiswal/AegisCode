-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ScanTrigger" AS ENUM ('AUTO_INACTIVITY', 'MANUAL');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO');

-- CreateEnum
CREATE TYPE "VulnStatus" AS ENUM ('OPEN', 'FIXED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "githubId" TEXT,
    "githubToken" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 100,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "currentScore" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CodingSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanReport" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "triggerType" "ScanTrigger" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScanReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vulnerability" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "fileLocation" TEXT NOT NULL,
    "lineNumber" INTEGER,
    "fixSuggestion" TEXT NOT NULL,
    "status" "VulnStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vulnerability_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

-- AddForeignKey
ALTER TABLE "CodingSession" ADD CONSTRAINT "CodingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScanReport" ADD CONSTRAINT "ScanReport_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "CodingSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vulnerability" ADD CONSTRAINT "Vulnerability_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "ScanReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;
