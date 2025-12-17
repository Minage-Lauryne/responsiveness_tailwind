-- CreateTable
CREATE TABLE "restoration_requests" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),
    "resolvedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "restoration_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "restoration_requests_userId_idx" ON "restoration_requests"("userId");

-- CreateIndex
CREATE INDEX "restoration_requests_status_idx" ON "restoration_requests"("status");

-- AddForeignKey
ALTER TABLE "restoration_requests" ADD CONSTRAINT "restoration_requests_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
