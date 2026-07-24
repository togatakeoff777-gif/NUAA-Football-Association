-- CreateTable
CREATE TABLE "Competition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "year" INTEGER,
    "campus" TEXT NOT NULL,
    "format" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "competitionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "Team_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "competitionId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "kickoff" DATETIME NOT NULL,
    "venue" TEXT NOT NULL,
    "homeTeamId" TEXT NOT NULL,
    "awayTeamId" TEXT NOT NULL,
    "homeScore" INTEGER,
    "awayScore" INTEGER,
    "status" TEXT NOT NULL,
    "applicationWindowStatus" TEXT NOT NULL DEFAULT 'CLOSED',
    "applicationDeadline" DATETIME,
    "isTestData" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Match_competitionId_fkey" FOREIGN KEY ("competitionId") REFERENCES "Competition" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Match_homeTeamId_fkey" FOREIGN KEY ("homeTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Match_awayTeamId_fkey" FOREIGN KEY ("awayTeamId") REFERENCES "Team" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Referee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "publicCode" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "elevenASide" BOOLEAN NOT NULL DEFAULT false,
    "futsal" BOOLEAN NOT NULL DEFAULT false,
    "sourceNote" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "RefereeApplication" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "refereeId" TEXT NOT NULL,
    "preferredPositions" TEXT NOT NULL,
    "note" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewNote" TEXT,
    "reviewedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RefereeApplication_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "RefereeApplication_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RefereeAppointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "matchId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publicationNote" TEXT,
    "publishedAt" DATETIME,
    "withdrawnAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RefereeAppointment_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AppointmentPosition" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "appointmentId" TEXT NOT NULL,
    "refereeId" TEXT,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    CONSTRAINT "AppointmentPosition_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "RefereeAppointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "AppointmentPosition_refereeId_fkey" FOREIGN KEY ("refereeId") REFERENCES "Referee" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AdminSession" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSeenAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Competition_slug_key" ON "Competition"("slug");

-- CreateIndex
CREATE INDEX "Team_competitionId_idx" ON "Team"("competitionId");

-- CreateIndex
CREATE UNIQUE INDEX "Team_competitionId_name_key" ON "Team"("competitionId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Match_slug_key" ON "Match"("slug");

-- CreateIndex
CREATE INDEX "Match_competitionId_kickoff_idx" ON "Match"("competitionId", "kickoff");

-- CreateIndex
CREATE INDEX "Match_applicationWindowStatus_applicationDeadline_idx" ON "Match"("applicationWindowStatus", "applicationDeadline");

-- CreateIndex
CREATE UNIQUE INDEX "Referee_publicCode_key" ON "Referee"("publicCode");

-- CreateIndex
CREATE INDEX "RefereeApplication_status_createdAt_idx" ON "RefereeApplication"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "RefereeApplication_matchId_refereeId_key" ON "RefereeApplication"("matchId", "refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "RefereeAppointment_matchId_key" ON "RefereeAppointment"("matchId");

-- CreateIndex
CREATE INDEX "RefereeAppointment_status_publishedAt_idx" ON "RefereeAppointment"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "AppointmentPosition_refereeId_idx" ON "AppointmentPosition"("refereeId");

-- CreateIndex
CREATE UNIQUE INDEX "AppointmentPosition_appointmentId_key_key" ON "AppointmentPosition"("appointmentId", "key");

-- CreateIndex
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");

-- CreateIndex
CREATE INDEX "AdminSession_expiresAt_idx" ON "AdminSession"("expiresAt");
