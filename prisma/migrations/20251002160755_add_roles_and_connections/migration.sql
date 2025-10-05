/*
  Warnings:

  - You are about to drop the `_knownBy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_learningBy` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `skill` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('STUDENT', 'MENTOR', 'BOTH');

-- CreateEnum
CREATE TYPE "public"."ConnectionStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED');

-- DropForeignKey
ALTER TABLE "public"."_knownBy" DROP CONSTRAINT "_knownBy_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_knownBy" DROP CONSTRAINT "_knownBy_B_fkey";

-- DropForeignKey
ALTER TABLE "public"."_learningBy" DROP CONSTRAINT "_learningBy_A_fkey";

-- DropForeignKey
ALTER TABLE "public"."_learningBy" DROP CONSTRAINT "_learningBy_B_fkey";

-- DropTable
DROP TABLE "public"."_knownBy";

-- DropTable
DROP TABLE "public"."_learningBy";

-- DropTable
DROP TABLE "public"."skill";

-- DropTable
DROP TABLE "public"."user";

-- CreateTable
CREATE TABLE "public"."users" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "password" TEXT NOT NULL,
    "bio" TEXT,
    "role" "public"."UserRole" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."skills" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."connections" (
    "id" SERIAL NOT NULL,
    "mentorId" INTEGER NOT NULL,
    "studentId" INTEGER NOT NULL,
    "status" "public"."ConnectionStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."_UserKnownSkills" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserKnownSkills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "public"."_UserLearningSkills" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,

    CONSTRAINT "_UserLearningSkills_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "skills_name_key" ON "public"."skills"("name");

-- CreateIndex
CREATE UNIQUE INDEX "connections_mentorId_studentId_key" ON "public"."connections"("mentorId", "studentId");

-- CreateIndex
CREATE INDEX "_UserKnownSkills_B_index" ON "public"."_UserKnownSkills"("B");

-- CreateIndex
CREATE INDEX "_UserLearningSkills_B_index" ON "public"."_UserLearningSkills"("B");

-- AddForeignKey
ALTER TABLE "public"."connections" ADD CONSTRAINT "connections_mentorId_fkey" FOREIGN KEY ("mentorId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."connections" ADD CONSTRAINT "connections_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserKnownSkills" ADD CONSTRAINT "_UserKnownSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserKnownSkills" ADD CONSTRAINT "_UserKnownSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserLearningSkills" ADD CONSTRAINT "_UserLearningSkills_A_fkey" FOREIGN KEY ("A") REFERENCES "public"."skills"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."_UserLearningSkills" ADD CONSTRAINT "_UserLearningSkills_B_fkey" FOREIGN KEY ("B") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
