-- CreateEnum
CREATE TYPE "TutorApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "onboardingCompletedAt" TIMESTAMP(3),
ADD COLUMN "welcomeDismissedAt" TIMESTAMP(3),
ADD COLUMN "tutorApprovalStatus" "TutorApprovalStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "tutorApprovedAt" TIMESTAMP(3),
ADD COLUMN "tutorApprovalNotes" TEXT;

-- Existing tutor accounts should remain operational by default.
UPDATE "User"
SET
  "tutorApprovalStatus" = 'APPROVED',
  "tutorApprovedAt" = COALESCE("tutorApprovedAt", NOW())
WHERE "role" = 'TUTOR';

-- Existing student accounts should be treated as completed onboarding for continuity.
UPDATE "User"
SET "onboardingCompletedAt" = COALESCE("onboardingCompletedAt", NOW())
WHERE "role" = 'STUDENT';
