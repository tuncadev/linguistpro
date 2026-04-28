-- CreateEnum
CREATE TYPE "LiveClassStatus" AS ENUM ('SCHEDULED', 'CANCELLED', 'COMPLETED');

-- CreateTable
CREATE TABLE "LiveClassSession" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "tutorId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "agenda" TEXT,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "durationMinutes" INTEGER NOT NULL,
  "timezone" TEXT NOT NULL,
  "status" "LiveClassStatus" NOT NULL DEFAULT 'SCHEDULED',
  "zoomMeetingId" TEXT NOT NULL,
  "zoomJoinUrl" TEXT NOT NULL,
  "zoomStartUrl" TEXT,
  "zoomPassword" TEXT,
  "zoomHostEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "cancelledAt" TIMESTAMP(3),
  "cancelledById" TEXT,

  CONSTRAINT "LiveClassSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LiveClassSession_courseId_startsAt_idx" ON "LiveClassSession"("courseId", "startsAt");

-- CreateIndex
CREATE INDEX "LiveClassSession_tutorId_startsAt_idx" ON "LiveClassSession"("tutorId", "startsAt");

-- CreateIndex
CREATE INDEX "LiveClassSession_zoomMeetingId_idx" ON "LiveClassSession"("zoomMeetingId");

-- AddForeignKey
ALTER TABLE "LiveClassSession"
  ADD CONSTRAINT "LiveClassSession_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassSession"
  ADD CONSTRAINT "LiveClassSession_tutorId_fkey"
  FOREIGN KEY ("tutorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
