-- CreateTable
CREATE TABLE "RefereeAdmissionApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "studentId" TEXT,
    "phone" TEXT,
    "qq" TEXT,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "RefereeAdmissionApplication_status_createdAt_idx" ON "RefereeAdmissionApplication"("status", "createdAt");
