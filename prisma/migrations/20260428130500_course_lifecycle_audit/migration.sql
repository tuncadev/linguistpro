-- AlterTable
ALTER TABLE "Course"
  ADD COLUMN "submittedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "archivedAt" TIMESTAMP(3),
  ADD COLUMN "statusReason" TEXT,
  ADD COLUMN "statusChangedById" TEXT,
  ADD COLUMN "statusChangedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "CourseLifecycleEvent" (
  "id" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "fromStatus" "CourseStatus",
  "toStatus" "CourseStatus" NOT NULL,
  "reason" TEXT,
  "actorId" TEXT NOT NULL,
  "actorRole" "Role" NOT NULL,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CourseLifecycleEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CourseLifecycleEvent_courseId_createdAt_idx" ON "CourseLifecycleEvent"("courseId", "createdAt");

-- AddForeignKey
ALTER TABLE "CourseLifecycleEvent"
  ADD CONSTRAINT "CourseLifecycleEvent_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
