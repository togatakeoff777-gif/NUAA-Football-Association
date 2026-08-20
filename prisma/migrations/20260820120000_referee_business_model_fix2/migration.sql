-- V2.9 R1 Acceptance Fix #2 is an additive compatibility migration.
-- College and TeamAffiliation remain available for existing R1 references while
-- the new affiliation unit relations become the canonical business layer.

ALTER TABLE "Team" ADD COLUMN "teamType" TEXT NOT NULL DEFAULT 'FREEFORM';
ALTER TABLE "Team" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'MANUAL';
ALTER TABLE "Team" ADD COLUMN "externalTeamId" TEXT;
ALTER TABLE "Team" ADD COLUMN "lastSyncedAt" DATETIME;
CREATE UNIQUE INDEX "Team_source_externalTeamId_key" ON "Team"("source", "externalTeamId");

ALTER TABLE "Referee" ADD COLUMN "qualificationNote" TEXT;
ALTER TABLE "RefereePositionCapability" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'READY';

CREATE TABLE "AffiliationUnit" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "legacyCollegeId" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AffiliationUnit_legacyCollegeId_fkey"
    FOREIGN KEY ("legacyCollegeId") REFERENCES "College"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AffiliationUnit_name_key" ON "AffiliationUnit"("name");
CREATE UNIQUE INDEX "AffiliationUnit_legacyCollegeId_key" ON "AffiliationUnit"("legacyCollegeId");
CREATE INDEX "AffiliationUnit_type_name_idx" ON "AffiliationUnit"("type", "name");

CREATE TABLE "AffiliationUnitRelation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "parentUnitId" TEXT NOT NULL,
  "childUnitId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "AffiliationUnitRelation_parentUnitId_fkey"
    FOREIGN KEY ("parentUnitId") REFERENCES "AffiliationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AffiliationUnitRelation_childUnitId_fkey"
    FOREIGN KEY ("childUnitId") REFERENCES "AffiliationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "AffiliationUnitRelation_parentUnitId_childUnitId_key"
  ON "AffiliationUnitRelation"("parentUnitId", "childUnitId");
CREATE INDEX "AffiliationUnitRelation_childUnitId_idx" ON "AffiliationUnitRelation"("childUnitId");

CREATE TABLE "RefereeAffiliation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "refereeId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "RefereeAffiliation_refereeId_fkey"
    FOREIGN KEY ("refereeId") REFERENCES "Referee"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RefereeAffiliation_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES "AffiliationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "RefereeAffiliation_refereeId_unitId_key" ON "RefereeAffiliation"("refereeId", "unitId");
CREATE INDEX "RefereeAffiliation_unitId_idx" ON "RefereeAffiliation"("unitId");

CREATE TABLE "TeamUnitAffiliation" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "teamId" TEXT NOT NULL,
  "unitId" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "TeamUnitAffiliation_teamId_fkey"
    FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "TeamUnitAffiliation_unitId_fkey"
    FOREIGN KEY ("unitId") REFERENCES "AffiliationUnit"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "TeamUnitAffiliation_teamId_unitId_key" ON "TeamUnitAffiliation"("teamId", "unitId");
CREATE INDEX "TeamUnitAffiliation_unitId_idx" ON "TeamUnitAffiliation"("unitId");

-- Confirmed colleges. Existing rows with the same name are retained unchanged.
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-aviation', '航空学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-energy-power', '能源与动力学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-automation', '自动化学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-electronic-information', '电子信息工程学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-mechanical-electrical', '机电学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-materials', '材料科学与技术学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-civil-aviation', '民航学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-mathematics', '数学学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-economics-management', '经济与管理学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-humanities-social-sciences', '人文与社会科学学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-arts', '艺术学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-foreign-languages', '外国语学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-astronautics', '航天学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-computer-software', '计算机科学与技术学院/软件学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-marxism', '马克思主义学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-changkong', '长空学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-international-education', '国际教育学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-general-aviation-flight', '通用航空与飞行学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-physics', '物理学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-integrated-circuits', '集成电路学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-excellent-engineers', '国家卓越工程师学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-artificial-intelligence', '人工智能学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-london', '伦敦国际学院', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "College" ("id", "name", "updatedAt") VALUES ('college-nuaa-continuing-education', '继续教育学院', CURRENT_TIMESTAMP);

-- Every legacy college has a one-to-one canonical affiliation unit. Reusing the
-- college id keeps existing association values stable and makes bridge reads safe.
INSERT OR IGNORE INTO "AffiliationUnit" ("id", "name", "type", "legacyCollegeId", "updatedAt")
SELECT "id", "name", 'COLLEGE', "id", CURRENT_TIMESTAMP FROM "College";

INSERT OR IGNORE INTO "AffiliationUnit" ("id", "name", "type", "updatedAt") VALUES ('shuyuan-nuaa-zhihui', '致慧书院', 'SHUYUAN', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "AffiliationUnit" ("id", "name", "type", "updatedAt") VALUES ('shuyuan-nuaa-zhiwei', '致微书院', 'SHUYUAN', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "AffiliationUnit" ("id", "name", "type", "updatedAt") VALUES ('shuyuan-nuaa-zhiyuan', '致元书院', 'SHUYUAN', CURRENT_TIMESTAMP);
INSERT OR IGNORE INTO "AffiliationUnit" ("id", "name", "type", "updatedAt") VALUES ('shuyuan-nuaa-zhihe', '致和书院', 'SHUYUAN', CURRENT_TIMESTAMP);

-- Only the supplied Zhihui composition is initialized. Other shuyuan relations stay empty.
INSERT OR IGNORE INTO "AffiliationUnitRelation" ("id", "parentUnitId", "childUnitId", "updatedAt")
SELECT 'relation-zhihui-civil-aviation', parent."id", child."id", CURRENT_TIMESTAMP
FROM "AffiliationUnit" parent, "AffiliationUnit" child
WHERE parent."name" = '致慧书院' AND child."name" = '民航学院';
INSERT OR IGNORE INTO "AffiliationUnitRelation" ("id", "parentUnitId", "childUnitId", "updatedAt")
SELECT 'relation-zhihui-automation', parent."id", child."id", CURRENT_TIMESTAMP
FROM "AffiliationUnit" parent, "AffiliationUnit" child
WHERE parent."name" = '致慧书院' AND child."name" = '自动化学院';
INSERT OR IGNORE INTO "AffiliationUnitRelation" ("id", "parentUnitId", "childUnitId", "updatedAt")
SELECT 'relation-zhihui-general-aviation-flight', parent."id", child."id", CURRENT_TIMESTAMP
FROM "AffiliationUnit" parent, "AffiliationUnit" child
WHERE parent."name" = '致慧书院' AND child."name" = '通用航空与飞行学院';

-- Preserve the sole confirmed student number mapping and point it at the retained college row.
INSERT OR IGNORE INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-07', '07', "id", 'V2.9 R1 已确认映射', CURRENT_TIMESTAMP
FROM "College" WHERE "name" = '民航学院';
UPDATE "CollegeCodeMapping"
SET "collegeId" = (SELECT "id" FROM "College" WHERE "name" = '民航学院'),
    "updatedAt" = CURRENT_TIMESTAMP
WHERE "prefix" = '07';

-- Bridge existing referee and team college associations without changing source rows.
INSERT OR IGNORE INTO "RefereeAffiliation" ("id", "refereeId", "unitId", "updatedAt")
SELECT "id" || ':affiliation:' || "collegeId", "id", "collegeId", CURRENT_TIMESTAMP
FROM "Referee" WHERE "collegeId" IS NOT NULL;

INSERT OR IGNORE INTO "TeamUnitAffiliation" ("id", "teamId", "unitId", "updatedAt")
SELECT 'unit:' || "id", "teamId", "collegeId", CURRENT_TIMESTAMP FROM "TeamAffiliation";

UPDATE "Team"
SET "teamType" = CASE
  WHEN (SELECT COUNT(*) FROM "TeamAffiliation" a WHERE a."teamId" = "Team"."id") > 1 THEN 'JOINT'
  WHEN (SELECT COUNT(*) FROM "TeamAffiliation" a WHERE a."teamId" = "Team"."id") = 1 THEN 'ORGANIZATION'
  ELSE 'FREEFORM'
END;

-- Existing capability rows meant "can be assigned" and therefore migrate to READY.
UPDATE "RefereePositionCapability" SET "status" = 'READY';

-- Normalize known formal qualifications. Unknown historical text is retained in
-- the new note field before the select value is reset to the neutral option.
UPDATE "Referee" SET "refereeLevel" = '国家三级' WHERE "refereeLevel" IN ('国家三级裁判', '国家三级裁判员');
UPDATE "Referee" SET "refereeLevel" = '国家二级' WHERE "refereeLevel" IN ('国家二级裁判', '国家二级裁判员');
UPDATE "Referee" SET "refereeLevel" = '国家一级' WHERE "refereeLevel" IN ('国家一级裁判', '国家一级裁判员');
UPDATE "Referee" SET "qualificationNote" =
  CASE
    WHEN "qualificationNote" IS NULL OR TRIM("qualificationNote") = '' THEN '原裁判等级记录：' || "refereeLevel"
    ELSE "qualificationNote" || '；原裁判等级记录：' || "refereeLevel"
  END
WHERE "refereeLevel" IS NOT NULL
  AND TRIM("refereeLevel") <> ''
  AND "refereeLevel" NOT IN ('暂无正式裁判资质', '国家三级', '国家二级', '国家一级', '预备国家级', '国家级', '国际级');
UPDATE "Referee" SET "refereeLevel" = '暂无正式裁判资质'
WHERE "refereeLevel" IS NULL OR TRIM("refereeLevel") = ''
   OR "refereeLevel" NOT IN ('暂无正式裁判资质', '国家三级', '国家二级', '国家一级', '预备国家级', '国家级', '国际级');
