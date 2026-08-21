-- Acceptance Fix #3 keeps collegeId as the professional/college background and
-- adds one explicit current organization. RefereeAffiliation remains the
-- append-only direct-affiliation history/association bridge.
ALTER TABLE "Referee" ADD COLUMN "currentAffiliationUnitId" TEXT
  REFERENCES "AffiliationUnit"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "Referee_currentAffiliationUnitId_idx" ON "Referee"("currentAffiliationUnitId");

-- Remove the unit explicitly excluded from the final confirmed list. Cascades
-- remove only its association links; Referee/Team/Match/Appointment rows remain.
DELETE FROM "AffiliationUnit" WHERE "name" = '国家卓越工程师学院';
DELETE FROM "College" WHERE "name" = '国家卓越工程师学院';

-- Prefixes are authoritative configuration. Keep only the confirmed list and
-- canonicalize alphabetic prefixes to uppercase.
DELETE FROM "CollegeCodeMapping"
WHERE UPPER("prefix") NOT IN (
  '01','02','03','04','05','06','07','08','09','10','11','12',
  '15','16','17','18','19','20','21','22','24','26','CG','CZ'
);
DELETE FROM "CollegeCodeMapping" WHERE UPPER("prefix") IN ('CG', 'CZ');

INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-01', '01', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '航空学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-02', '02', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '能源与动力学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-03', '03', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '自动化学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-04', '04', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '电子信息工程学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-05', '05', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '机电学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-06', '06', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '材料科学与技术学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-07', '07', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '民航学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-08', '08', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '数学学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-09', '09', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '经济与管理学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-10', '10', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '人文与社会科学学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-11', '11', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '艺术学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-12', '12', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '外国语学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-15', '15', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '航天学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-16', '16', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '计算机科学与技术学院/软件学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-17', '17', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '马克思主义学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-18', '18', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '长空学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-19', '19', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '国际教育学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-20', '20', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '通用航空与飞行学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-21', '21', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '物理学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-22', '22', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '集成电路学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-24', '24', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '人工智能学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-26', '26', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '伦敦国际学院'
ON CONFLICT("prefix") DO UPDATE SET "collegeId" = excluded."collegeId", "note" = excluded."note", "updatedAt" = CURRENT_TIMESTAMP;
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-CG', 'CG', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '继续教育学院';
INSERT INTO "CollegeCodeMapping" ("id", "prefix", "collegeId", "note", "updatedAt")
SELECT 'college-code-CZ', 'CZ', "id", 'V2.9 R1 Fix #3 已确认映射', CURRENT_TIMESTAMP FROM "College" WHERE "name" = '继续教育学院';

-- Replace the four shuyuan compositions with the exact confirmed topology.
DELETE FROM "AffiliationUnitRelation"
WHERE "parentUnitId" IN (
  SELECT "id" FROM "AffiliationUnit"
  WHERE "name" IN ('致慧书院', '致元书院', '致微书院', '致和书院')
);

INSERT INTO "AffiliationUnitRelation" ("id", "parentUnitId", "childUnitId", "updatedAt")
SELECT 'relation-zhihui-' || child."id", parent."id", child."id", CURRENT_TIMESTAMP
FROM "AffiliationUnit" parent, "AffiliationUnit" child
WHERE parent."name" = '致慧书院' AND child."name" IN ('民航学院', '自动化学院', '通用航空与飞行学院');
INSERT INTO "AffiliationUnitRelation" ("id", "parentUnitId", "childUnitId", "updatedAt")
SELECT 'relation-zhiyuan-' || child."id", parent."id", child."id", CURRENT_TIMESTAMP
FROM "AffiliationUnit" parent, "AffiliationUnit" child
WHERE parent."name" = '致元书院' AND child."name" IN ('材料科学与技术学院', '数学学院', '计算机科学与技术学院/软件学院', '人工智能学院');
INSERT INTO "AffiliationUnitRelation" ("id", "parentUnitId", "childUnitId", "updatedAt")
SELECT 'relation-zhiwei-' || child."id", parent."id", child."id", CURRENT_TIMESTAMP
FROM "AffiliationUnit" parent, "AffiliationUnit" child
WHERE parent."name" = '致微书院' AND child."name" IN ('电子信息工程学院', '物理学院', '集成电路学院');
INSERT INTO "AffiliationUnitRelation" ("id", "parentUnitId", "childUnitId", "updatedAt")
SELECT 'relation-zhihe-' || child."id", parent."id", child."id", CURRENT_TIMESTAMP
FROM "AffiliationUnit" parent, "AffiliationUnit" child
WHERE parent."name" = '致和书院' AND child."name" IN ('经济与管理学院', '人文与社会科学学院', '艺术学院', '外国语学院');

-- Backfill one primary current organization without overwriting an explicit
-- shuyuan association for first/second-year referees.
UPDATE "Referee"
SET "currentAffiliationUnitId" = (
  SELECT ra."unitId"
  FROM "RefereeAffiliation" ra
  JOIN "AffiliationUnit" unit ON unit."id" = ra."unitId"
  WHERE ra."refereeId" = "Referee"."id" AND unit."type" = 'SHUYUAN'
  ORDER BY ra."createdAt" DESC
  LIMIT 1
)
WHERE "grade" IN ('大一', '大二')
  AND EXISTS (
    SELECT 1 FROM "RefereeAffiliation" ra
    JOIN "AffiliationUnit" unit ON unit."id" = ra."unitId"
    WHERE ra."refereeId" = "Referee"."id" AND unit."type" = 'SHUYUAN'
  );
UPDATE "Referee"
SET "currentAffiliationUnitId" = "collegeId"
WHERE "currentAffiliationUnitId" IS NULL AND "collegeId" IS NOT NULL;
