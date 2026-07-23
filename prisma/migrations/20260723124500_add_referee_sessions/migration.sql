CREATE TABLE "RefereeSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "refereeId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RefereeSession_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "RefereeSession_tokenHash_key" ON "RefereeSession"("tokenHash");
CREATE INDEX "RefereeSession_refereeId_idx" ON "RefereeSession"("refereeId");
CREATE INDEX "RefereeSession_expiresAt_idx" ON "RefereeSession"("expiresAt");
