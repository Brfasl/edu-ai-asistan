-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('study', 'test', 'xp');

-- CreateTable
CREATE TABLE "StudyActivity" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "type" "ActivityType" NOT NULL,
    "minutes" INTEGER,
    "count" INTEGER,
    "xp" INTEGER,
    "course" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StudyActivity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "StudyActivity_ownerId_createdAt_idx" ON "StudyActivity"("ownerId", "createdAt");

-- CreateIndex
CREATE INDEX "StudyActivity_ownerId_course_idx" ON "StudyActivity"("ownerId", "course");

-- AddForeignKey
ALTER TABLE "StudyActivity" ADD CONSTRAINT "StudyActivity_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
