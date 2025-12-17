/*
  Warnings:

  - Made the column `isUSBased` on table `Organization` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Organization" ALTER COLUMN "isUSBased" SET NOT NULL,
ALTER COLUMN "isUSBased" SET DEFAULT false;
