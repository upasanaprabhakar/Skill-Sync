/*
  Warnings:

  - You are about to drop the column `connectionId` on the `notes` table. All the data in the column will be lost.
  - Added the required column `skillGroupId` to the `notes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."notes" DROP CONSTRAINT "notes_connectionId_fkey";

-- DropIndex
DROP INDEX "public"."notes_connectionId_idx";

-- AlterTable
ALTER TABLE "public"."connections" ADD COLUMN     "skillGroupId" INTEGER;

-- AlterTable
ALTER TABLE "public"."notes" DROP COLUMN "connectionId",
ADD COLUMN     "skillGroupId" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "public"."skill_groups" (
    "id" SERIAL NOT NULL,
    "mentorId" INTEGER NOT NULL,
    "skillId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_groups_mentorId_skillId_key" ON "public"."skill_groups"("mentorId", "skillId");

-- CreateIndex
CREATE INDEX "notes_skillGroupId_idx" ON "public"."notes"("skillGroupId");

-- AddForeignKey
ALTER TABLE "public"."skill_groups" ADD CONSTRAINT "skill_groups_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."skill_groups" ADD CONSTRAINT "skill_groups_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connections" ADD CONSTRAINT "connections_skillGroupId_fkey" FOREIGN KEY ("skillGroupId") REFERENCES "public"."skill_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."notes" ADD CONSTRAINT "notes_skillGroupId_fkey" FOREIGN KEY ("skillGroupId") REFERENCES "public"."skill_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;
