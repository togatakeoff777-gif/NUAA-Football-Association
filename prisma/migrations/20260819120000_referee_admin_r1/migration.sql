-- V2.9 R1 is additive. Existing referee, match, appointment, position, version,
-- audit and session tables are retained in place; IDs and historical rows are unchanged.

CREATE TABLE "College" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "College_name_key" ON "College"("name");

CREATE TABLE "AdminAccount" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "username" TEXT NOT NULL,
  "displayName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "mustChangePassword" BOOLEAN NOT NULL DEFAULT false,
  "lastLoginAt" DATETIME,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE UNIQUE INDEX "AdminAccount_username_key" ON "AdminAccount"("username");

ALTER TABLE "Competition" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Competition" ADD COLUMN "externalCompetitionId" TEXT;
ALTER TABLE "Competition" ADD COLUMN "lastSyncedAt" DATETIME;
CREATE UNIQUE INDEX "Competition_source_externalCompetitionId_key"
  ON "Competition"("source", "externalCompetitionId");

ALTER TABLE "Match" ADD COLUMN "endAt" DATETIME;
ALTER TABLE "Match" ADD COLUMN "round" TEXT;
ALTER TABLE "Match" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Match" ADD COLUMN "externalMatchId" TEXT;
ALTER TABLE "Match" ADD COLUMN "lastSyncedAt" DATETIME;
CREATE UNIQUE INDEX "Match_source_externalMatchId_key"
  ON "Match"("source", "externalMatchId");

ALTER TABLE "Referee" ADD COLUMN "studentId" TEXT;
ALTER TABLE "Referee" ADD COLUMN "collegeId" TEXT REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Referee" ADD COLUMN "grade" TEXT;
ALTER TABLE "Referee" ADD COLUMN "phone" TEXT;
ALTER TABLE "Referee" ADD COLUMN "qq" TEXT;
ALTER TABLE "Referee" ADD COLUMN "refereeLevel" TEXT;
ALTER TABLE "Referee" ADD COLUMN "joinedAt" DATETIME;
CREATE UNIQUE INDEX "Referee_studentId_key" ON "Referee"("studentId");
CREATE INDEX "Referee_collegeId_idx" ON "Referee"("collegeId");

ALTER TABLE "RefereeAppointment" ADD COLUMN "completedAt" DATETIME;
ALTER TABLE "RefereeAppointment" ADD COLUMN "cancelledAt" DATETIME;
ALTER TABLE "RefereeAppointment" ADD COLUMN "cancellationReason" TEXT;

ALTER TABLE "AppointmentVersion" ADD COLUMN "overrideReason" TEXT;
ALTER TABLE "AppointmentVersion" ADD COLUMN "createdByAdminId" TEXT REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "AppointmentVersion_createdByAdminId_idx" ON "AppointmentVersion"("createdByAdminId");

ALTER TABLE "AdminSession" ADD COLUMN "adminAccountId" TEXT REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "AdminSession_adminAccountId_idx" ON "AdminSession"("adminAccountId");

CREATE TABLE "CollegeCodeMapping" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "prefix" TEXT NOT NULL,
  "collegeId" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "CollegeCodeMapping_collegeId_fkey"
    FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CollegeCodeMapping_prefix_key" ON "CollegeCodeMapping"("prefix");
CREATE INDEX "CollegeCodeMapping_collegeId_idx" ON "CollegeCodeMapping"("collegeId");

CREATE TABLE "TeamAffiliation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "teamId" TEXT NOT NULL,
  "collegeId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TeamAffiliation_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TeamAffiliation_collegeId_fkey"
    FOREIGN KEY ("collegeId") REFERENCES "College"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TeamAffiliation_teamId_collegeId_key" ON "TeamAffiliation"("teamId", "collegeId");
CREATE INDEX "TeamAffiliation_collegeId_idx" ON "TeamAffiliation"("collegeId");

CREATE TABLE "RefereePositionCapability" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "refereeId" TEXT NOT NULL,
  "format" TEXT NOT NULL,
  "positionKey" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "RefereePositionCapability_refereeId_fkey"
    FOREIGN KEY ("refereeId") REFERENCES "Referee"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RefereePositionCapability_refereeId_format_positionKey_key"
  ON "RefereePositionCapability"("refereeId", "format", "positionKey");
CREATE INDEX "RefereePositionCapability_format_positionKey_idx"
  ON "RefereePositionCapability"("format", "positionKey");

CREATE TABLE "RefereeAvailability" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "refereeId" TEXT NOT NULL,
  "startAt" DATETIME NOT NULL,
  "endAt" DATETIME NOT NULL,
  "kind" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "RefereeAvailability_refereeId_fkey"
    FOREIGN KEY ("refereeId") REFERENCES "Referee"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RefereeAvailability_refereeId_startAt_endAt_idx"
  ON "RefereeAvailability"("refereeId", "startAt", "endAt");

CREATE TABLE "AppointmentAcknowledgement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "refereeId" TEXT NOT NULL,
  "acknowledgedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentAcknowledgement_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "RefereeAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AppointmentAcknowledgement_versionId_fkey"
    FOREIGN KEY ("versionId") REFERENCES "AppointmentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AppointmentAcknowledgement_refereeId_fkey"
    FOREIGN KEY ("refereeId") REFERENCES "Referee"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AppointmentAcknowledgement_versionId_refereeId_key"
  ON "AppointmentAcknowledgement"("versionId", "refereeId");
CREATE INDEX "AppointmentAcknowledgement_appointmentId_refereeId_idx"
  ON "AppointmentAcknowledgement"("appointmentId", "refereeId");

CREATE TABLE "AppointmentConflictReport" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "versionId" TEXT NOT NULL,
  "refereeId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "resolutionNote" TEXT,
  "resolvedAt" DATETIME,
  "resolvedByAdminId" TEXT,
  CONSTRAINT "AppointmentConflictReport_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "RefereeAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AppointmentConflictReport_versionId_fkey"
    FOREIGN KEY ("versionId") REFERENCES "AppointmentVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AppointmentConflictReport_refereeId_fkey"
    FOREIGN KEY ("refereeId") REFERENCES "Referee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AppointmentConflictReport_resolvedByAdminId_fkey"
    FOREIGN KEY ("resolvedByAdminId") REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AppointmentConflictReport_versionId_refereeId_key"
  ON "AppointmentConflictReport"("versionId", "refereeId");
CREATE INDEX "AppointmentConflictReport_status_reportedAt_idx"
  ON "AppointmentConflictReport"("status", "reportedAt");
CREATE INDEX "AppointmentConflictReport_appointmentId_refereeId_idx"
  ON "AppointmentConflictReport"("appointmentId", "refereeId");
CREATE INDEX "AppointmentConflictReport_resolvedByAdminId_idx"
  ON "AppointmentConflictReport"("resolvedByAdminId");

-- Only the confirmed mapping is initialized. No other college code is inferred.
INSERT INTO "College" ("id", "name", "updatedAt")
VALUES ('college-nuaa-civil-aviation', '民航学院', CURRENT_TIMESTAMP);
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
VALUES ('college-code-07', '07', 'college-nuaa-civil-aviation', 'V2.9 R1 已确认映射', CURRENT_TIMESTAMP);

-- Preserve the two legacy format flags while normalizing their current meaning
-- into position capabilities for existing referees.
INSERT INTO "RefereePositionCapability" ("id", "refereeId", "format", "positionKey", "updatedAt")
SELECT "id" || ':ELEVEN_A_SIDE:' || role.key, "id", 'ELEVEN_A_SIDE', role.key, CURRENT_TIMESTAMP
FROM "Referee"
JOIN (
  SELECT 'REFEREE' AS key UNION ALL
  SELECT 'ASSISTANT_REFEREE_1' UNION ALL
  SELECT 'ASSISTANT_REFEREE_2' UNION ALL
  SELECT 'FOURTH_OFFICIAL' UNION ALL
  SELECT 'RESERVE_ASSISTANT_REFEREE'
) AS role
WHERE "elevenASide" = true;

INSERT INTO "RefereePositionCapability" ("id", "refereeId", "format", "positionKey", "updatedAt")
SELECT "id" || ':FUTSAL:' || role.key, "id", 'FUTSAL', role.key, CURRENT_TIMESTAMP
FROM "Referee"
JOIN (
  SELECT 'REFEREE' AS key UNION ALL
  SELECT 'SECOND_REFEREE' UNION ALL
  SELECT 'THIRD_REFEREE' UNION ALL
  SELECT 'TIMEKEEPER'
) AS role
WHERE "futsal" = true;
