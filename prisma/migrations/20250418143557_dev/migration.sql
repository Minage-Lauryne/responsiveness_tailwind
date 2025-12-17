/*
  Warnings:

  - You are about to drop the column `title` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `service` on the `Workspace` table. All the data in the column will be lost.
  - You are about to drop the `Account` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Account" DROP CONSTRAINT "Account_userId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "title";

-- AlterTable
ALTER TABLE "Workspace" DROP COLUMN "service";

-- DropTable
DROP TABLE "Account";
