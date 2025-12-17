/*
  Warnings:

  - The `role` column on the `Invitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `status` column on the `Invitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `role` column on the `Member` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('ADMIN', 'MEMBER', 'VIEWER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "InvitationType" AS ENUM ('INVITATION', 'JOIN_REQUEST');

-- AlterTable
ALTER TABLE "Invitation" ADD COLUMN     "message" TEXT,
ADD COLUMN     "type" "InvitationType" NOT NULL DEFAULT 'INVITATION',
DROP COLUMN "role",
ADD COLUMN     "role" "MemberRole" NOT NULL DEFAULT 'MEMBER',
DROP COLUMN "status",
ADD COLUMN     "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "role",
ADD COLUMN     "role" "MemberRole" NOT NULL DEFAULT 'MEMBER';
