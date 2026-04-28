-- CreateTable
CREATE TABLE "ZoomConnection" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "zoomUserId" TEXT NOT NULL,
  "zoomAccountId" TEXT,
  "zoomEmail" TEXT,
  "accessTokenEnc" TEXT NOT NULL,
  "refreshTokenEnc" TEXT NOT NULL,
  "tokenType" TEXT,
  "scope" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "lastRefreshedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "ZoomConnection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ZoomConnection_userId_key" ON "ZoomConnection"("userId");

-- CreateIndex
CREATE INDEX "ZoomConnection_zoomUserId_idx" ON "ZoomConnection"("zoomUserId");

-- CreateIndex
CREATE INDEX "ZoomConnection_expiresAt_idx" ON "ZoomConnection"("expiresAt");

-- AddForeignKey
ALTER TABLE "ZoomConnection"
  ADD CONSTRAINT "ZoomConnection_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
