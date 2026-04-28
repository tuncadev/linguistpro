-- CreateEnum
CREATE TYPE "CommunicationTemplate" AS ENUM ('WELCOME', 'ENROLLMENT_CONFIRMATION', 'PAYMENT_RECEIPT', 'CLASS_REMINDER', 'CLASS_CANCELLATION');

-- CreateEnum
CREATE TYPE "CommunicationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');

-- CreateTable
CREATE TABLE "CommunicationMessage" (
  "id" TEXT NOT NULL,
  "template" "CommunicationTemplate" NOT NULL,
  "triggerKey" TEXT,
  "status" "CommunicationStatus" NOT NULL DEFAULT 'PENDING',
  "recipientEmail" TEXT NOT NULL,
  "recipientName" TEXT,
  "subject" TEXT NOT NULL,
  "bodyText" TEXT NOT NULL,
  "bodyHtml" TEXT,
  "userId" TEXT,
  "courseId" TEXT,
  "liveClassSessionId" TEXT,
  "attemptCount" INTEGER NOT NULL DEFAULT 0,
  "sentAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "lastError" TEXT,
  "lastAttemptAt" TIMESTAMP(3),
  "meta" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "CommunicationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommunicationAttempt" (
  "id" TEXT NOT NULL,
  "messageId" TEXT NOT NULL,
  "attemptNumber" INTEGER NOT NULL,
  "status" "CommunicationStatus" NOT NULL,
  "provider" TEXT,
  "providerMessageId" TEXT,
  "responseCode" INTEGER,
  "errorMessage" TEXT,
  "responseBody" TEXT,
  "attemptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "CommunicationAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CommunicationMessage_template_status_idx" ON "CommunicationMessage"("template", "status");

-- CreateIndex
CREATE INDEX "CommunicationMessage_recipientEmail_createdAt_idx" ON "CommunicationMessage"("recipientEmail", "createdAt");

-- CreateIndex
CREATE INDEX "CommunicationAttempt_messageId_attemptNumber_idx" ON "CommunicationAttempt"("messageId", "attemptNumber");

-- AddForeignKey
ALTER TABLE "CommunicationMessage"
  ADD CONSTRAINT "CommunicationMessage_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage"
  ADD CONSTRAINT "CommunicationMessage_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationMessage"
  ADD CONSTRAINT "CommunicationMessage_liveClassSessionId_fkey"
  FOREIGN KEY ("liveClassSessionId") REFERENCES "LiveClassSession"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommunicationAttempt"
  ADD CONSTRAINT "CommunicationAttempt_messageId_fkey"
  FOREIGN KEY ("messageId") REFERENCES "CommunicationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
