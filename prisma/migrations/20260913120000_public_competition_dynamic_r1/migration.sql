-- Public Competition Dynamic Integration R1 is additive only. Existing
-- Competition, Team, Match and archive data remains unchanged.
ALTER TABLE "Competition" ADD COLUMN "shortName" TEXT;
ALTER TABLE "Competition" ADD COLUMN "semesterLabel" TEXT;
ALTER TABLE "Competition" ADD COLUMN "teamFormation" TEXT;
ALTER TABLE "Competition" ADD COLUMN "publicPublished" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Competition" ADD COLUMN "homepageFeatured" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Competition" ADD COLUMN "publicOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Competition" ADD COLUMN "registrationStartAt" DATETIME;
ALTER TABLE "Competition" ADD COLUMN "registrationEndAt" DATETIME;
ALTER TABLE "Competition" ADD COLUMN "matchStartAt" DATETIME;
ALTER TABLE "Competition" ADD COLUMN "matchEndAt" DATETIME;
ALTER TABLE "Competition" ADD COLUMN "venue" TEXT;
ALTER TABLE "Competition" ADD COLUMN "host" TEXT;
ALTER TABLE "Competition" ADD COLUMN "organizer" TEXT;
ALTER TABLE "Competition" ADD COLUMN "summary" TEXT;
ALTER TABLE "Competition" ADD COLUMN "notice" TEXT;
ALTER TABLE "Competition" ADD COLUMN "registrationUrl" TEXT;

CREATE INDEX "Competition_publicPublished_homepageFeatured_publicOrder_idx"
  ON "Competition"("publicPublished", "homepageFeatured", "publicOrder");
