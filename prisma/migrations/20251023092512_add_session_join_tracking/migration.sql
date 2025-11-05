-- AlterTable
ALTER TABLE "public"."sessions" ADD COLUMN     "joinedByMentor" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "joinedByStudent" BOOLEAN NOT NULL DEFAULT false;
