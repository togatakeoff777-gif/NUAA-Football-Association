-- Public Competition True Dynamic R3 keeps the existing referee-role template
-- classification in Competition.format and adds an independent public playing
-- format. The nullable addition avoids a SQLite table rebuild; application
-- validation requires the field for all newly created and updated records.
ALTER TABLE "Competition" ADD COLUMN "playingFormat" TEXT;

-- Preserve every existing Competition and deterministically backfill the two
-- legacy referee template values without changing identities or relationships.
UPDATE "Competition"
SET "playingFormat" = CASE "format"
  WHEN 'ELEVEN_A_SIDE' THEN '十一人制'
  WHEN 'FUTSAL' THEN '五人制'
  ELSE "playingFormat"
END
WHERE "playingFormat" IS NULL;
