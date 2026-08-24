import { readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function applyMigration(client: ReturnType<typeof createClient>, name: string) {
  const sql = await readFile(path.resolve("prisma/migrations", name, "migration.sql"), "utf8");
  await client.executeMultiple(sql);
}

async function count(client: ReturnType<typeof createClient>, table: string) {
  const result = await client.execute(`SELECT COUNT(*) AS count FROM "${table}"`);
  return Number(result.rows[0].count);
}

async function main() {
  const databasePath = process.env.REFEREE_R1_3A_MIGRATION_DATABASE_PATH;
  if (!databasePath) throw new Error("REFEREE_R1_3A_MIGRATION_DATABASE_PATH is required.");
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  const client = createClient({ url });
  const preR13AMigrations = [
    "20260722013757_init_referee_center",
    "20260723124500_add_referee_sessions",
    "20260730090000_referee_operations_v24",
    "20260819120000_referee_admin_r1",
    "20260820120000_referee_business_model_fix2",
    "20260820160000_referee_acceptance_fix3",
    "20260823091228_unified_admin_r1_foundation",
    "20260823160000_referee_admission_application_intake",
  ];
  for (const migration of preR13AMigrations) await applyMigration(client, migration);

  await client.executeMultiple(`
    PRAGMA foreign_keys = ON;
    INSERT INTO "Competition"
      ("id", "slug", "name", "campus", "format", "status", "updatedAt")
    VALUES
      ('r13a-migration-competition', 'r13a-migration', 'R1-3A 迁移赛事', '天目湖校区', 'ELEVEN_A_SIDE', 'ONGOING', CURRENT_TIMESTAMP);
    INSERT INTO "Team" ("id", "competitionId", "name") VALUES
      ('r13a-migration-home', 'r13a-migration-competition', '迁移主队'),
      ('r13a-migration-away', 'r13a-migration-competition', '迁移客队');
    INSERT INTO "Match"
      ("id", "slug", "competitionId", "stage", "kickoff", "endAt", "venue", "homeTeamId", "awayTeamId", "status", "updatedAt")
    VALUES
      ('r13a-migration-match', 'r13a-migration-match', 'r13a-migration-competition', '迁移轮次',
       '2027-03-01T10:00:00.000Z', '2027-03-01T12:00:00.000Z', '迁移场地',
       'r13a-migration-home', 'r13a-migration-away', 'SCHEDULED', CURRENT_TIMESTAMP);
    INSERT INTO "Referee"
      ("id", "publicCode", "name", "status", "elevenASide", "futsal", "publicDirectoryEnabled", "trainingStatus", "updatedAt")
    VALUES
      ('active-not-started', 'MIG-A-NS', '启用待开始', 'ACTIVE', 1, 0, 0, 'NOT_STARTED', CURRENT_TIMESTAMP),
      ('active-in-progress', 'MIG-A-IP', '启用培养中', 'ACTIVE', 1, 0, 0, 'IN_PROGRESS', CURRENT_TIMESTAMP),
      ('active-completed', 'MIG-A-C', '启用已完成', 'ACTIVE', 1, 0, 1, 'COMPLETED', CURRENT_TIMESTAMP),
      ('inactive-referee', 'MIG-INACTIVE', '停用裁判', 'INACTIVE', 1, 0, 0, 'IN_PROGRESS', CURRENT_TIMESTAMP),
      ('archived-referee', 'MIG-ARCHIVED', '归档裁判', 'ARCHIVED', 0, 1, 0, 'COMPLETED', CURRENT_TIMESTAMP),
      ('pending-referee', 'MIG-PENDING', '待启用裁判', 'PENDING', 0, 0, 0, 'NOT_STARTED', CURRENT_TIMESTAMP);
    INSERT INTO "RefereePositionCapability"
      ("id", "refereeId", "format", "positionKey", "status", "updatedAt")
    VALUES
      ('r13a-migration-capability', 'active-not-started', 'ELEVEN_A_SIDE', 'REFEREE', 'READY', CURRENT_TIMESTAMP);
    INSERT INTO "RefereeAvailability"
      ("id", "refereeId", "startAt", "endAt", "kind", "note", "updatedAt")
    VALUES
      ('r13a-migration-availability', 'active-not-started', '2027-03-01T09:00:00.000Z', '2027-03-01T13:00:00.000Z', 'AVAILABLE', '迁移保留', CURRENT_TIMESTAMP);
    INSERT INTO "RefereeApplication"
      ("id", "matchId", "refereeId", "preferredPositions", "status", "updatedAt")
    VALUES
      ('r13a-migration-application', 'r13a-migration-match', 'active-not-started', '["REFEREE"]', 'PENDING', CURRENT_TIMESTAMP);
    INSERT INTO "RefereeAppointment"
      ("id", "matchId", "status", "revision", "updatedAt")
    VALUES
      ('r13a-migration-appointment', 'r13a-migration-match', 'DRAFT', 0, CURRENT_TIMESTAMP);
    INSERT INTO "AppointmentPosition"
      ("id", "appointmentId", "refereeId", "key", "label", "sortOrder", "slot")
    VALUES
      ('r13a-migration-position', 'r13a-migration-appointment', 'active-not-started', 'REFEREE', '裁判员', 10, 1);
    INSERT INTO "RefereeAdmissionApplication"
      ("id", "name", "phone", "status", "updatedAt")
    VALUES
      ('r13a-migration-admission', '迁移准入申请', '13800000100', 'PENDING', CURRENT_TIMESTAMP);
    INSERT INTO "AuditLog"
      ("id", "actorType", "action", "entityType", "entityId", "summary")
    VALUES
      ('r13a-migration-audit', 'SYSTEM', 'MIGRATION_PROTECTED', 'Referee', 'active-not-started', '迁移保护审计');
  `);

  const protectedTables = [
    "Referee",
    "RefereePositionCapability",
    "RefereeAvailability",
    "RefereeApplication",
    "RefereeAppointment",
    "AppointmentPosition",
    "RefereeAdmissionApplication",
    "AuditLog",
  ];
  const before = Object.fromEntries(
    await Promise.all(protectedTables.map(async (table) => [table, await count(client, table)])),
  );

  await applyMigration(client, "20260824120000_referee_admission_eligibility");

  const rows = await client.execute({
    sql: `SELECT "id", "status", "trainingStatus", "assignmentEligibility" FROM "Referee" ORDER BY "id"`,
  });
  const byId = new Map(rows.rows.map((row) => [String(row.id), row]));
  const expectState = (
    id: string,
    status: string,
    trainingStatus: string,
    assignmentEligibility: string,
  ) => {
    const row = byId.get(id);
    assert(
      row?.status === status &&
        row.trainingStatus === trainingStatus &&
        row.assignmentEligibility === assignmentEligibility,
      `${id} 的 legacy 状态映射不正确。`,
    );
  };
  expectState("active-not-started", "ACTIVE", "PENDING_ASSESSMENT", "ELIGIBLE");
  expectState("active-in-progress", "ACTIVE", "IN_TRAINING", "ELIGIBLE");
  expectState("active-completed", "ACTIVE", "QUALIFIED", "ELIGIBLE");
  expectState("inactive-referee", "INACTIVE", "IN_TRAINING", "NOT_ELIGIBLE");
  expectState("archived-referee", "ARCHIVED", "QUALIFIED", "NOT_ELIGIBLE");
  expectState("pending-referee", "PENDING_ACTIVATION", "PENDING_ASSESSMENT", "NOT_ELIGIBLE");

  const after = Object.fromEntries(
    await Promise.all(protectedTables.map(async (table) => [table, await count(client, table)])),
  );
  assert(JSON.stringify(after) === JSON.stringify(before), "R1-3A migration 改变了受保护业务行数量。");
  const protectedIds = [
    ["RefereePositionCapability", "r13a-migration-capability"],
    ["RefereeAvailability", "r13a-migration-availability"],
    ["RefereeApplication", "r13a-migration-application"],
    ["RefereeAppointment", "r13a-migration-appointment"],
    ["AppointmentPosition", "r13a-migration-position"],
    ["RefereeAdmissionApplication", "r13a-migration-admission"],
    ["AuditLog", "r13a-migration-audit"],
  ] as const;
  for (const [table, id] of protectedIds) {
    const result = await client.execute({ sql: `SELECT "id" FROM "${table}" WHERE "id" = ?`, args: [id] });
    assert(result.rows.length === 1, `${table}/${id} 在 migration 后丢失。`);
  }

  const integrity = await client.execute("PRAGMA integrity_check");
  const foreignKeys = await client.execute("PRAGMA foreign_key_check");
  assert(integrity.rows[0].integrity_check === "ok", "SQLite integrity_check 未通过。");
  assert(foreignKeys.rows.length === 0, "R1-3A migration 产生了外键违规。");

  console.log(JSON.stringify({
    preR13AMigrations,
    appliedMigration: "20260824120000_referee_admission_eligibility",
    trainingStatusMapping: {
      NOT_STARTED: "PENDING_ASSESSMENT",
      IN_PROGRESS: "IN_TRAINING",
      COMPLETED: "QUALIFIED",
    },
    assignmentEligibilityMapping: {
      ACTIVE: "ELIGIBLE",
      INACTIVE: "NOT_ELIGIBLE",
      ARCHIVED: "NOT_ELIGIBLE",
      PENDING_ACTIVATION: "NOT_ELIGIBLE",
    },
    protectedRowCountsPreserved: after,
    protectedIdsPreserved: true,
    integrityCheck: "ok",
    foreignKeyViolations: 0,
  }, null, 2));
  client.close();
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "R1-3A migration worker failed.");
  process.exit(1);
});
