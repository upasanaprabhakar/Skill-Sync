-- AlterTable
ALTER TABLE "public"."notes" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedBy" INTEGER,
ADD COLUMN     "isCompleted" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "notes_isCompleted_idx" ON "public"."notes"("isCompleted");
