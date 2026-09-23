ALTER TABLE "Team" ADD COLUMN "publicStatus" TEXT;
ALTER TABLE "Team" ADD COLUMN "publicContactName" TEXT;
ALTER TABLE "Team" ADD COLUMN "publicContactRole" TEXT;
ALTER TABLE "Team" ADD COLUMN "publicContactQQ" TEXT;
ALTER TABLE "Team" ADD COLUMN "publicContactEmail" TEXT;
ALTER TABLE "Team" ADD COLUMN "publicDirectoryNote" TEXT;
ALTER TABLE "Team" ADD COLUMN "directoryIsPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Team" ADD COLUMN "directoryPublicOrder" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "TeamDirectorySettings" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT 'current',
    "activeCompetitionId" TEXT,
    "directoryPublished" BOOLEAN NOT NULL DEFAULT false,
    "contactName" TEXT,
    "contactTitle" TEXT,
    "contactQQ" TEXT,
    "contactEmail" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TeamDirectorySettings_activeCompetitionId_fkey" FOREIGN KEY ("activeCompetitionId") REFERENCES "Competition" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "TeamDirectorySettings_activeCompetitionId_key" ON "TeamDirectorySettings"("activeCompetitionId");
