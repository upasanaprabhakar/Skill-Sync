/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_KnownBy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_LearningBy` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."_KnownBy" DROP CONSTRAINT "_KnownBy_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_KnownBy" DROP CONSTRAINT "_KnownBy_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_LearningBy" DROP CONSTRAINT "_LearningBy_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_LearningBy" DROP CONSTRAINT "_LearningBy_B_fkey";

-- DropTable
DROP TABLE "public"."User";

-- DropTable
DROP TABLE "public"."_KnownBy";

-- DropTable
DROP TABLE "public"."_LearningBy";

-- CreateTable
CREATE TABLE "public"."user" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_knownBy" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_knownBy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_learningBy" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_learningBy_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE INDEX "_knownBy_B_index" ON "public"."_knownBy"("B");

-- CreateIndex
CREATE INDEX "_learningBy_B_index" ON "public"."_learningBy"("B");

-- AddForeignKey
ALTER TABLE "public"."_knownBy" ADD CONSTRAINT "_knownBy_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_knownBy" ADD CONSTRAINT "_knownBy_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_learningBy" ADD CONSTRAINT "_learningBy_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_learningBy" ADD CONSTRAINT "_learningBy_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
