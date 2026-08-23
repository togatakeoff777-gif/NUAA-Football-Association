import { randomBytes } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function applyMigrations(url: string) {
  const client = createClient({ url });
  const entries = await readdir(path.resolve("prisma/migrations"), { withFileTypes: true });
  for (const entry of entries.filter((item) => item.isDirectory()).sort((a, b) => a.name.localeCompare(b.name))) {
    const sql = await readFile(path.resolve("prisma/migrations", entry.name, "migration.sql"), "utf8");
    await client.executeMultiple(sql);
  }
  client.close();
}

async function main() {
  const databasePath = process.env.REFEREE_ADMISSION_TEST_DATABASE_PATH;
  if (!databasePath) throw new Error("REFEREE_ADMISSION_TEST_DATABASE_PATH is required.");
  const url = `file:${databasePath.replaceAll("\\", "/")}`;
  process.env.DATABASE_URL = url;
  process.env.REFEREE_ADMIN_SESSION_SECRET = randomBytes(32).toString("base64url");
  process.env.REFEREE_MEMBER_SESSION_SECRET = randomBytes(32).toString("base64url");

  await applyMigrations(url);

  const verifier = new PrismaClient({ adapter: new PrismaLibSql({ url }) });
  const route = await import("../src/app/api/referees/admission-applications/route");

  try {
    const before = {
      admissions: await verifier.refereeAdmissionApplication.count(),
      matchApplications: await verifier.refereeApplication.count(),
      appointments: await verifier.refereeAppointment.count(),
      referees: await verifier.referee.count(),
    };

    const validResponse = await route.POST(new Request(
      "http://localhost/api/referees/admission-applications",
      {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({
          name: "  新裁判申请人  ",
          studentId: "  16260001  ",
          phone: "  13800000000  ",
          qq: "",
          note: "  希望参加协会裁判培训  ",
        }),
      },
    ));
    const validBody = await validResponse.json() as {
      ok?: boolean;
      applicationId?: string;
      status?: string;
    };
    assert(validResponse.status === 201 && validBody.ok, "有效准入申请未成功提交。");
    assert(validBody.status === "PENDING", "API 未返回初始 PENDING 状态。");
    assert(typeof validBody.applicationId === "string", "API 未返回准入申请 ID。");

    const persisted = await verifier.refereeAdmissionApplication.findUnique({
      where: { id: validBody.applicationId },
    });
    assert(persisted, "准入申请未持久化。");
    assert(persisted.status === "PENDING", "准入申请未以 PENDING 状态创建。");
    assert(
      persisted.name === "新裁判申请人" &&
        persisted.studentId === "16260001" &&
        persisted.phone === "13800000000" &&
        persisted.qq === null &&
        persisted.note === "希望参加协会裁判培训",
      "准入申请未按既有文本规则规范化保存。",
    );
    assert(
      await verifier.refereeAdmissionApplication.count() === before.admissions + 1,
      "有效提交没有且仅创建一条准入申请。",
    );

    const invalidResponse = await route.POST(new Request(
      "http://localhost/api/referees/admission-applications",
      {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ name: "", phone: "", qq: "" }),
      },
    ));
    assert(invalidResponse.status === 400, "缺失必填数据的准入申请未被拒绝。");
    assert(
      await verifier.refereeAdmissionApplication.count() === before.admissions + 1,
      "无效提交仍创建了准入申请。",
    );

    const missingContactResponse = await route.POST(new Request(
      "http://localhost/api/referees/admission-applications",
      {
        method: "POST",
        headers: { "content-type": "application/json", origin: "http://localhost" },
        body: JSON.stringify({ name: "无联系方式申请人" }),
      },
    ));
    assert(missingContactResponse.status === 400, "无联系方式的准入申请未被拒绝。");

    const badOriginResponse = await route.POST(new Request(
      "http://localhost/api/referees/admission-applications",
      {
        method: "POST",
        headers: { "content-type": "application/json", origin: "https://evil.example" },
        body: JSON.stringify({ name: "外部来源", phone: "13800000001" }),
      },
    ));
    assert(badOriginResponse.status === 403, "准入申请接口未拒绝非法 Origin。");
    assert(
      await verifier.refereeAdmissionApplication.count() === before.admissions + 1,
      "被拒绝的提交仍创建了准入申请。",
    );

    assert(
      await verifier.refereeApplication.count() === before.matchApplications,
      "准入提交错误创建或修改了比赛执裁申请。",
    );
    assert(
      await verifier.refereeAppointment.count() === before.appointments,
      "准入提交错误创建或修改了裁判选派。",
    );
    assert(
      await verifier.referee.count() === before.referees,
      "准入提交错误创建或启用了 Referee 账号。",
    );

    console.log("Referee admission application intake tests passed.");
  } finally {
    await verifier.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Referee admission test failed.");
  process.exit(1);
});
