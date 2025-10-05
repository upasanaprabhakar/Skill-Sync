/*
  Warnings:

  - You are about to drop the `Skill` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_knownBy" DROP CONSTRAINT "_knownBy_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_learningBy" DROP CONSTRAINT "_learningBy_A_fkey";

-- DropTable
DROP TABLE "public"."Skill";

-- CreateTable
CREATE TABLE "public"."skill" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "skill_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "skill_name_key" ON "public"."skill"("name");

-- AddForeignKey
ALTER TABLE "public"."_knownBy" ADD CONSTRAINT "_knownBy_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_learningBy" ADD CONSTRAINT "_learningBy_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
