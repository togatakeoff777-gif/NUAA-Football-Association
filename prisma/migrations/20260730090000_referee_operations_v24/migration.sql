-- v2.4 adds production referee operations fields without removing existing records.
ALTER TABLE "Match" ADD COLUMN "publicNote" TEXT;
ALTER TABLE "Match" ADD COLUMN "internalNote" TEXT;
ALTER TABLE "Match" ADD COLUMN "cancelledAt" DATETIME;
ALTER TABLE "Match" ADD COLUMN "cancellationReason" TEXT;

ALTER TABLE "Referee" ADD COLUMN "passwordHash" TEXT;
ALTER TABLE "Referee" ADD COLUMN "mustChangePassword" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Referee" ADD COLUMN "certificateNote" TEXT;
ALTER TABLE "Referee" ADD COLUMN "trainingStatus" TEXT NOT NULL DEFAULT 'NOT_STARTED';
ALTER TABLE "Referee" ADD COLUMN "publicDirectoryEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Referee" ADD COLUMN "publicBio" TEXT;
ALTER TABLE "Referee" ADD COLUMN "internalNote" TEXT;
ALTER TABLE "Referee" ADD COLUMN "failedLoginCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Referee" ADD COLUMN "lockedUntil" DATETIME;
ALTER TABLE "Referee" ADD COLUMN "lastLoginAt" DATETIME;
ALTER TABLE "Referee" ADD COLUMN "passwordChangedAt" DATETIME;

ALTER TABLE "RefereeAppointment" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "RefereeAppointment" ADD COLUMN "lastChangeReason" TEXT;

ALTER TABLE "AppointmentPosition" ADD COLUMN "slot" INTEGER NOT NULL DEFAULT 1;
DROP INDEX "AppointmentPosition_appointmentId_key_key";
CREATE UNIQUE INDEX "AppointmentPosition_appointmentId_key_slot_key"
  ON "AppointmentPosition"("appointmentId", "key", "slot");

CREATE TABLE "MatchPositionRequirement" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "count" INTEGER NOT NULL DEFAULT 1,
  "sortOrder" INTEGER NOT NULL,
  CONSTRAINT "MatchPositionRequirement_matchId_fkey"
    FOREIGN KEY ("matchId") REFERENCES "Match" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AppointmentVersion" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "appointmentId" TEXT NOT NULL,
  "revision" INTEGER NOT NULL,
  "status" TEXT NOT NULL,
  "snapshot" TEXT NOT NULL,
  "reason" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AppointmentVersion_appointmentId_fkey"
    FOREIGN KEY ("appointmentId") REFERENCES "RefereeAppointment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "actorType" TEXT NOT NULL,
  "actorId" TEXT,
  "action" TEXT NOT NULL,
  "entityType" TEXT NOT NULL,
  "entityId" TEXT,
  "summary" TEXT NOT NULL,
  "metadata" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "LoginAttempt" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "scope" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "failures" INTEGER NOT NULL DEFAULT 0,
  "blockedUntil" DATETIME,
  "updatedAt" DATETIME NOT NULL
);

CREATE INDEX "MatchPositionRequirement_matchId_sortOrder_idx"
  ON "MatchPositionRequirement"("matchId", "sortOrder");
CREATE UNIQUE INDEX "MatchPositionRequirement_matchId_key_key"
  ON "MatchPositionRequirement"("matchId", "key");
CREATE INDEX "AppointmentVersion_createdAt_idx" ON "AppointmentVersion"("createdAt");
CREATE UNIQUE INDEX "AppointmentVersion_appointmentId_revision_key"
  ON "AppointmentVersion"("appointmentId", "revision");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");
CREATE INDEX "LoginAttempt_blockedUntil_idx" ON "LoginAttempt"("blockedUntil");
CREATE UNIQUE INDEX "LoginAttempt_scope_keyHash_key" ON "LoginAttempt"("scope", "keyHash");
