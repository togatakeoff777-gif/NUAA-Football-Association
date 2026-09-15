import { rm } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { readdir, readFile } from "node:fs/promises";

const migrationName = "20260914210000_admin_operations_r2";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function removeDatabase(databasePath: string) {
  for (const target of [databasePath, `${databasePath}-wal`, `${databasePath}-shm`]) await rm(target, { force: true, maxRetries: 10, retryDelay: 100 });
}

async function main() {
  const databasePath = path.resolve("prisma/test-admin-operations-r2-migration.db");
  const prismaDirectory = `${path.resolve("prisma")}${path.sep}`;
  if (!databasePath.startsWith(prismaDirectory)) throw new Error("R2 migration database escaped prisma directory.");
  await removeDatabase(databasePath);
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  const client = createClient({ url });
  try {
    const entries = (await readdir(path.resolve("prisma/migrations"), { withFileTypes: true })).filter((entry) => entry.isDirectory()).map((entry) => entry.name).sort((a, b) => a.localeCompare(b));
    const migrationIndex = entries.indexOf(migrationName);
    assert(migrationIndex >= 0, "R2 migration is missing.");
    for (const entry of entries.slice(0, migrationIndex)) await client.executeMultiple(await readFile(path.resolve("prisma/migrations", entry, "migration.sql"), "utf8"));
    await client.executeMultiple(`
      INSERT INTO "Referee" ("id","publicCode","name","status","mustChangePassword","elevenASide","futsal","trainingStatus","assignmentEligibility","publicDirectoryEnabled","failedLoginCount","createdAt","updatedAt") VALUES
        ('r2-existing-001','001','既有裁判一','ACTIVE',0,1,0,'QUALIFIED','ELIGIBLE',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        ('r2-existing-015','015','既有裁判十五','ACTIVE',0,1,1,'QUALIFIED','ELIGIBLE',1,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP),
        ('r2-existing-legacy','LEGACY-A','既有非数字编号','INACTIVE',1,0,0,'PENDING_ASSESSMENT','NOT_ELIGIBLE',0,0,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
      INSERT INTO "RefereeAvailability" ("id","refereeId","startAt","endAt","kind","note","createdAt","updatedAt") VALUES
        ('r2-existing-availability','r2-existing-001','2027-01-01T00:00:00.000Z','2027-01-02T00:00:00.000Z','AVAILABLE','既有记录',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP);
    `);
    const beforeReferees = Number((await client.execute('SELECT COUNT(*) AS count FROM "Referee"')).rows[0].count);
    const beforeAvailability = Number((await client.execute('SELECT COUNT(*) AS count FROM "RefereeAvailability"')).rows[0].count);
    await client.executeMultiple(await readFile(path.resolve("prisma/migrations", migrationName, "migration.sql"), "utf8"));
    const availabilityColumns = (await client.execute('PRAGMA table_info("RefereeAvailability")')).rows.map((row) => String(row.name));
    const conflictColumns = (await client.execute('PRAGMA table_info("AppointmentConflictReport")')).rows.map((row) => String(row.name));
    const sequence = (await client.execute('SELECT "prefix","width","nextValue" FROM "RefereePublicCodeSequence" WHERE "id" = ?;', ["canonical"])).rows[0];
    const legacyAvailability = (await client.execute('SELECT "competitionFormat","note" FROM "RefereeAvailability" WHERE "id" = ?;', ["r2-existing-availability"])).rows[0];
    const integrity = await client.execute("PRAGMA integrity_check");
    const foreignKeys = await client.execute("PRAGMA foreign_key_check");
    assert(Number((await client.execute('SELECT COUNT(*) AS count FROM "Referee"')).rows[0].count) === beforeReferees, "R2 migration changed referee row count.");
    assert(Number((await client.execute('SELECT COUNT(*) AS count FROM "RefereeAvailability"')).rows[0].count) === beforeAvailability, "R2 migration changed availability row count.");
    assert(availabilityColumns.includes("competitionFormat") && conflictColumns.includes("reasonCode") && conflictColumns.includes("explanation"), "R2 additive columns are missing.");
    assert(sequence && sequence.prefix === "" && Number(sequence.width) === 3 && Number(sequence.nextValue) === 16, "R2 publicCode sequence did not continue after max historical code.");
    assert(legacyAvailability.competitionFormat === null && legacyAvailability.note === "既有记录", "Existing availability was not preserved with BOTH default.");
    assert(integrity.rows[0].integrity_check === "ok" && foreignKeys.rows.length === 0, "R2 existing-database migration integrity failed.");
    console.log(JSON.stringify({ existingRowsPreserved: { Referee: beforeReferees, RefereeAvailability: beforeAvailability }, additiveColumns: { competitionFormat: true, reasonCode: true, explanation: true }, publicCodeSequenceNextValue: 16, legacyAvailabilityDefaultsToBoth: true, integrityCheck: "ok", foreignKeyViolations: 0 }, null, 2));
  } finally {
    client.close();
  }
}

main().catch((error) => { console.error(error instanceof Error ? error.stack ?? error.message : "R2 migration test failed."); process.exit(1); });
