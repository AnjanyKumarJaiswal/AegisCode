/*
  Warnings:

  - You are about to drop the column `githubUsername` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "githubUsername",
ADD COLUMN     "username" TEXT;
