-- R1-3A keeps all referee, application, appointment, capability, availability,
-- session and audit rows. Unknown legacy values abort before any mapping occurs.
CREATE TEMP TABLE "_r13a_training_guard" (
  "ok" INTEGER NOT NULL CHECK ("ok" = 1)
);
INSERT INTO "_r13a_training_guard" ("ok")
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM "Referee"
    WHERE "trainingStatus" NOT IN ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED')
  ) THEN 0 ELSE 1
END;
DROP TABLE "_r13a_training_guard";

CREATE TEMP TABLE "_r13a_account_guard" (
  "ok" INTEGER NOT NULL CHECK ("ok" = 1)
);
INSERT INTO "_r13a_account_guard" ("ok")
SELECT CASE
  WHEN EXISTS (
    SELECT 1 FROM "Referee"
    WHERE "status" NOT IN ('PENDING', 'ACTIVE', 'INACTIVE', 'ARCHIVED')
  ) THEN 0 ELSE 1
END;
DROP TABLE "_r13a_account_guard";

UPDATE "Referee"
SET "trainingStatus" = CASE "trainingStatus"
  WHEN 'NOT_STARTED' THEN 'PENDING_ASSESSMENT'
  WHEN 'IN_PROGRESS' THEN 'IN_TRAINING'
  WHEN 'COMPLETED' THEN 'QUALIFIED'
END;

-- The old PENDING value already meant "waiting for activation" in the UI.
UPDATE "Referee" SET "status" = 'PENDING_ACTIVATION' WHERE "status" = 'PENDING';

ALTER TABLE "Referee"
ADD COLUMN "assignmentEligibility" TEXT NOT NULL DEFAULT 'NOT_ELIGIBLE';

-- Compatibility only: referees that were already active before R1-3A retain
-- their operational eligibility. Accounts created after this migration use the
-- schema default NOT_ELIGIBLE unless an administrator explicitly changes it.
UPDATE "Referee"
SET "assignmentEligibility" = CASE
  WHEN "status" = 'ACTIVE' THEN 'ELIGIBLE'
  ELSE 'NOT_ELIGIBLE'
END;

ALTER TABLE "RefereeAdmissionApplication" ADD COLUMN "reviewedAt" DATETIME;
ALTER TABLE "RefereeAdmissionApplication" ADD COLUMN "reviewNote" TEXT;
ALTER TABLE "RefereeAdmissionApplication" ADD COLUMN "reviewedByAdminId" TEXT
  REFERENCES "AdminAccount"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RefereeAdmissionApplication" ADD COLUMN "refereeId" TEXT
  REFERENCES "Referee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "RefereeAdmissionApplication_reviewedByAdminId_idx"
  ON "RefereeAdmissionApplication"("reviewedByAdminId");
CREATE INDEX "RefereeAdmissionApplication_refereeId_idx"
  ON "RefereeAdmissionApplication"("refereeId");
