-- ADMIN OPERATIONS R2: additive availability, conflict-detail, and referee-code allocation support.
ALTER TABLE "RefereeAvailability" ADD COLUMN "competitionFormat" TEXT;

ALTER TABLE "AppointmentConflictReport" ADD COLUMN "reasonCode" TEXT;
ALTER TABLE "AppointmentConflictReport" ADD COLUMN "explanation" TEXT;

CREATE TABLE "RefereePublicCodeSequence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "prefix" TEXT NOT NULL DEFAULT '',
    "width" INTEGER NOT NULL DEFAULT 3,
    "nextValue" INTEGER NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

INSERT INTO "RefereePublicCodeSequence" ("id", "prefix", "width", "nextValue", "updatedAt")
SELECT
    'canonical',
    '',
    3,
    COALESCE(MAX(CAST("publicCode" AS INTEGER)), 0) + 1,
    CURRENT_TIMESTAMP
FROM "Referee"
WHERE length("publicCode") = 3
  AND "publicCode" GLOB '[0-9][0-9][0-9]';
