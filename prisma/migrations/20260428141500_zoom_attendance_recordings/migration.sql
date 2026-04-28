-- CreateTable
CREATE TABLE "LiveClassAttendance" (
  "id" TEXT NOT NULL,
  "liveClassSessionId" TEXT NOT NULL,
  "participantId" TEXT NOT NULL,
  "participantName" TEXT,
  "participantEmail" TEXT,
  "firstJoinAt" TIMESTAMP(3),
  "lastLeaveAt" TIMESTAMP(3),
  "totalDurationMinutes" INTEGER,
  "joinCount" INTEGER NOT NULL DEFAULT 0,
  "sourceEventIds" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LiveClassAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LiveClassRecording" (
  "id" TEXT NOT NULL,
  "liveClassSessionId" TEXT NOT NULL,
  "externalFileId" TEXT NOT NULL,
  "recordingType" TEXT,
  "fileType" TEXT,
  "fileSizeBytes" BIGINT,
  "playUrl" TEXT,
  "downloadUrl" TEXT,
  "recordingStart" TIMESTAMP(3),
  "recordingEnd" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "LiveClassRecording_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassAttendance_liveClassSessionId_participantId_key" ON "LiveClassAttendance"("liveClassSessionId", "participantId");

-- CreateIndex
CREATE INDEX "LiveClassAttendance_liveClassSessionId_firstJoinAt_idx" ON "LiveClassAttendance"("liveClassSessionId", "firstJoinAt");

-- CreateIndex
CREATE UNIQUE INDEX "LiveClassRecording_externalFileId_key" ON "LiveClassRecording"("externalFileId");

-- CreateIndex
CREATE INDEX "LiveClassRecording_liveClassSessionId_recordingStart_idx" ON "LiveClassRecording"("liveClassSessionId", "recordingStart");

-- AddForeignKey
ALTER TABLE "LiveClassAttendance"
  ADD CONSTRAINT "LiveClassAttendance_liveClassSessionId_fkey"
  FOREIGN KEY ("liveClassSessionId") REFERENCES "LiveClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LiveClassRecording"
  ADD CONSTRAINT "LiveClassRecording_liveClassSessionId_fkey"
  FOREIGN KEY ("liveClassSessionId") REFERENCES "LiveClassSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
