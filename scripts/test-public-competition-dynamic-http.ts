import { spawn, type ChildProcess } from "node:child_process";
import { access, mkdir, mkdtemp, rm } from "node:fs/promises";
import { createServer } from "node:net";
import os from "node:os";
import path from "node:path";

import { createClient } from "@libsql/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma-v29/client";
import { hashPassword } from "../src/lib/referee-security";

const password = "Public-Dynamic-R1-Test-Only-2026!";
const mutationOrigin = "https://nuaafa.cn";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function findPort() {
  return new Promise<number>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      if (!address || typeof address === "string") {
        probe.close();
        reject(new Error("Failed to allocate an isolated port."));
        return;
      }
      probe.close((error) => error ? reject(error) : resolve(address.port));
    });
  });
}

function runPrismaMigrate(databaseUrl: string) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [path.resolve("node_modules/prisma/build/index.js"), "migrate", "deploy"],
      { cwd: process.cwd(), env: { ...process.env, DATABASE_URL: databaseUrl, RUST_LOG: "trace" }, stdio: "inherit" },
    );
    child.once("error", reject);
    child.once("exit", (code) => code === 0
      ? resolve()
      : reject(new Error(`Prisma migrate deploy exited ${code ?? "unknown"}.`)));
  });
}

async function stopServer(server: ChildProcess) {
  if (server.exitCode !== null) return;
  server.kill();
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 5_000);
    server.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

async function waitForHealth(origin: string, server: ChildProcess) {
  for (let attempt = 0; attempt < 160; attempt += 1) {
    if (server.exitCode !== null) throw new Error(`Next server exited before health was ready (${server.exitCode}).`);
    try {
      const response = await fetch(`${origin}/api/health`, { cache: "no-store" });
      if (response.status === 200) return;
    } catch {
      // The isolated server is still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Timed out waiting for the isolated Next server.");
}

async function seedAdministrators(databaseUrl: string) {
  const prisma = new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl }) });
  try {
    const passwordHash = await hashPassword(password);
    const [competition, content, superAdmin] = await Promise.all([
      prisma.adminAccount.create({ data: { username: "dynamic-competition", displayName: "动态赛事管理员", passwordHash, role: "REFEREE_MANAGER" } }),
      prisma.adminAccount.create({ data: { username: "dynamic-content", displayName: "动态内容管理员", passwordHash, role: "REFEREE_MANAGER" } }),
      prisma.adminAccount.create({ data: { username: "dynamic-super", displayName: "动态超级管理员", passwordHash, role: "SUPER_ADMIN" } }),
    ]);
    await prisma.adminRoleAssignment.createMany({ data: [
      { adminAccountId: competition.id, role: "COMPETITION_ADMIN" },
      { adminAccountId: content.id, role: "CONTENT_EDITOR" },
      { adminAccountId: superAdmin.id, role: "SUPER_ADMIN" },
    ] });
  } finally {
    await prisma.$disconnect();
  }
}

async function login(origin: string, username: string) {
  const response = await fetch(`${origin}/api/referees/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: mutationOrigin },
    body: JSON.stringify({ username, password }),
    redirect: "manual",
  });
  assert(response.status === 200, `${username} login failed with ${response.status}.`);
  const cookie = response.headers.get("set-cookie")?.match(/nuaa_referee_admin=[^;]+/u)?.[0];
  assert(cookie, `${username} login did not return an administrator cookie.`);
  return cookie;
}

function apiRequest(origin: string, pathName: string, method: string, body: unknown, cookie?: string) {
  return fetch(`${origin}${pathName}`, {
    method,
    headers: {
      "content-type": "application/json",
      origin: mutationOrigin,
      ...(cookie ? { cookie } : {}),
    },
    body: JSON.stringify(body),
    redirect: "manual",
  });
}

let proofRequest = 0;
async function pageHtml(origin: string, pathName: string, cookie?: string) {
  proofRequest += 1;
  const separator = pathName.includes("?") ? "&" : "?";
  const response = await fetch(`${origin}${pathName}${separator}dynamicProof=${proofRequest}`, {
    cache: "no-store",
    headers: cookie ? { cookie } : undefined,
  });
  assert(response.status === 200, `${pathName} returned ${response.status}.`);
  return response.text();
}

function competitionPayload(input: {
  slug?: string;
  name: string;
  format: "ELEVEN_A_SIDE" | "FUTSAL";
  status: "PREPARING" | "REGISTRATION" | "ONGOING" | "COMPLETED";
  publicPublished: boolean;
  homepageFeatured: boolean;
  marker: string;
}) {
  return {
    ...(input.slug ? { slug: input.slug } : {}),
    name: input.name,
    shortName: `${input.marker}简称`,
    year: 2026,
    campus: `${input.marker}校区`,
    format: input.format,
    status: input.status,
    semesterLabel: "上半学期",
    teamFormation: input.format === "FUTSAL" ? "自由组队" : "院系组队",
    publicPublished: input.publicPublished,
    homepageFeatured: input.homepageFeatured,
    publicOrder: input.format === "FUTSAL" ? 20 : 10,
    registrationStartAt: "2026-09-25T18:30",
    registrationEndAt: "2026-09-30T20:00",
    matchStartAt: "2026-10-01T18:30",
    matchEndAt: "2026-10-31T20:30",
    venue: `${input.marker}球场`,
    host: `${input.marker}主办单位`,
    organizer: `${input.marker}承办单位`,
    summary: `${input.marker}赛事简介`,
    notice: `${input.marker}赛事公告`,
    registrationUrl: `https://example.edu.cn/${input.marker}`,
  };
}

async function expectStatus(response: Response | Promise<Response>, status: number, label: string) {
  const result = await response;
  assert(result.status === status, `${label}: expected ${status}, received ${result.status}.`);
}

async function main() {
  await access(path.resolve(".next/BUILD_ID"));
  const root = await mkdtemp(path.join(os.tmpdir(), "nuaafa-public-competition-http-"));
  const databasePath = path.join(root, "dynamic.db");
  const uploadRoot = path.join(root, "uploads");
  const databaseUrl = `file:${databasePath.replaceAll("\\", "/")}`;
  const port = await findPort();
  const origin = `http://127.0.0.1:${port}`;
  let server: ChildProcess | null = null;
  let verifier: PrismaClient | null = null;
  try {
    await mkdir(uploadRoot, { recursive: true });
    await runPrismaMigrate(databaseUrl);
    await seedAdministrators(databaseUrl);
    const serverEnvironment: NodeJS.ProcessEnv = {
      ...process.env,
      NODE_ENV: "production",
      DATABASE_URL: databaseUrl,
      NUAAFA_UPLOAD_DIR: uploadRoot,
      NUAAFA_CONTENT_SOURCE: "static",
      REFEREE_ADMIN_SESSION_SECRET: "public-competition-dynamic-r1-session-secret",
    };
    const runningServer: ChildProcess = spawn(
      process.execPath,
      [path.resolve("node_modules/next/dist/bin/next"), "start", "-H", "127.0.0.1", "-p", String(port)],
      { cwd: process.cwd(), env: serverEnvironment, stdio: ["ignore", "pipe", "pipe"] },
    );
    server = runningServer;
    runningServer.stdout?.pipe(process.stdout);
    runningServer.stderr?.pipe(process.stderr);
    await waitForHealth(origin, runningServer);
    const serverPid = runningServer.pid;

    const zeroHome = await pageHtml(origin, "/");
    const zeroCenter = await pageHtml(origin, "/competitions");
    const zeroFreshman = await pageHtml(origin, "/competitions/freshman-cup");
    const zeroFutsal = await pageHtml(origin, "/competitions/tianmuhu-futsal-league");
    const historicalMen = await pageHtml(origin, "/competitions/2026-mens-intercollege-cup");
    const historicalWomen = await pageHtml(origin, "/competitions/2026-womens-intercollege-cup");
    assert(zeroHome.includes("2026南京航空航天大学新生杯足球赛事") && zeroHome.includes("2026天目湖五人制联赛"), "Zero-row homepage fallback failed.");
    assert(zeroHome.includes("两项赛事，关注最新安排") && !zeroHome.includes("筹备中 · 赛程待发布"), "Zero-row homepage presentation changed.");
    assert(zeroCenter.includes("筹备工作已启动") && zeroCenter.includes("2026天目湖五人制联赛"), "Zero-row Competition center fallback failed.");
    assert(zeroFreshman.includes("面向新生开展的院系十一人制足球赛事") && !zeroFreshman.includes("赛事公告："), "Freshman Cup static fallback failed.");
    assert(zeroFutsal.includes("2026赛季具体安排尚未公布"), "Futsal static fallback failed.");
    assert(historicalMen.includes("2026男子足球院际杯") && historicalWomen.includes("2026女子足球院际杯"), "Historical archive routes regressed.");

    const [competitionCookie, contentCookie, superCookie] = await Promise.all([
      login(origin, "dynamic-competition"),
      login(origin, "dynamic-content"),
      login(origin, "dynamic-super"),
    ]);
    const draftFreshman = competitionPayload({
      slug: "freshman-cup",
      name: "R1动态新生杯",
      format: "ELEVEN_A_SIDE",
      status: "REGISTRATION",
      publicPublished: false,
      homepageFeatured: true,
      marker: "动态新生杯",
    });
    await expectStatus(apiRequest(origin, "/api/referees/admin/competitions", "POST", draftFreshman), 401, "anonymous mutation");
    await expectStatus(apiRequest(origin, "/api/referees/admin/competitions", "POST", draftFreshman, contentCookie), 403, "CONTENT_EDITOR mutation");

    for (const slug of ["Freshman-Cup", "freshman cup", "../freshman-cup", "https://evil.example", "新生杯"]) {
      await expectStatus(
        apiRequest(origin, "/api/referees/admin/competitions", "POST", { ...draftFreshman, slug }, competitionCookie),
        400,
        `invalid slug ${slug}`,
      );
    }
    await expectStatus(
      apiRequest(origin, "/api/referees/admin/competitions", "POST", { ...draftFreshman, registrationUrl: "javascript:alert(1)" }, competitionCookie),
      400,
      "unsafe registration URL",
    );
    await expectStatus(
      apiRequest(origin, "/api/referees/admin/competitions", "POST", { ...draftFreshman, summary: "x".repeat(2001) }, competitionCookie),
      400,
      "bounded summary",
    );
    await expectStatus(
      apiRequest(origin, "/api/referees/admin/competitions", "POST", { ...draftFreshman, registrationEndAt: "2026-09-20T18:00" }, competitionCookie),
      400,
      "invalid registration range",
    );

    const createResponse = await apiRequest(origin, "/api/referees/admin/competitions", "POST", draftFreshman, competitionCookie);
    await expectStatus(createResponse, 201, "COMPETITION_ADMIN create");
    const freshmanId = (await createResponse.json() as { competitionId?: string }).competitionId;
    assert(freshmanId, "Competition create response omitted its ID.");
    await expectStatus(
      apiRequest(origin, "/api/referees/admin/competitions", "POST", draftFreshman, competitionCookie),
      409,
      "duplicate stable slug",
    );
    assert(!(await pageHtml(origin, "/")).includes("R1动态新生杯"), "Unpublished Competition replaced homepage fallback.");
    assert(!(await pageHtml(origin, "/competitions")).includes("动态新生杯赛事简介"), "Unpublished Competition replaced center fallback.");
    assert(!(await pageHtml(origin, "/competitions/freshman-cup")).includes("动态新生杯球场"), "Unpublished Competition replaced detail fallback.");

    await expectStatus(
      apiRequest(origin, `/api/referees/admin/competitions/${freshmanId}`, "PATCH", draftFreshman, competitionCookie),
      409,
      "read-only slug",
    );
    const { slug: freshmanSlug, ...freshmanEditable } = draftFreshman;
    assert(freshmanSlug === "freshman-cup", "Freshman fixture slug changed unexpectedly.");
    const publishedFreshman = { ...freshmanEditable, publicPublished: true, status: "REGISTRATION" };
    await expectStatus(
      apiRequest(origin, `/api/referees/admin/competitions/${freshmanId}`, "PATCH", publishedFreshman, competitionCookie),
      200,
      "COMPETITION_ADMIN publish",
    );
    const dynamicHome = await pageHtml(origin, "/");
    const dynamicCenter = await pageHtml(origin, "/competitions");
    const dynamicFreshman = await pageHtml(origin, "/competitions/freshman-cup");
    assert(
      dynamicHome.includes("R1动态新生杯") && dynamicHome.includes("报名中"),
      `Published status did not reach homepage (name=${dynamicHome.includes("R1动态新生杯")}, status=${dynamicHome.includes("报名中")}, fallback=${dynamicHome.includes("面向新生开展的院系十一人制足球赛事")}).`,
    );
    assert(dynamicCenter.includes("R1动态新生杯") && dynamicCenter.includes("报名中"), "Competition center dynamic title/status failed.");
    assert(
      dynamicFreshman.includes("动态新生杯球场") &&
      dynamicFreshman.includes("动态新生杯主办单位") &&
      dynamicFreshman.includes("动态新生杯承办单位") &&
      dynamicFreshman.includes("动态新生杯赛事简介") &&
      dynamicFreshman.includes("动态新生杯赛事公告") &&
      dynamicFreshman.includes("立即报名") &&
      dynamicFreshman.includes("2026.09.25 18:30"),
      "Published Competition profile did not reach its detail page.",
    );
    const adminEdit = await pageHtml(origin, `/admin/competitions/${freshmanId}/edit`, competitionCookie);
    assert(adminEdit.includes("freshman-cup") && adminEdit.includes("北京时间（UTC+8）"), "Admin edit did not show read-only slug and timezone labels.");

    verifier = new PrismaClient({ adapter: new PrismaLibSql({ url: databaseUrl }) });
    const storedFreshman = await verifier.competition.findUniqueOrThrow({ where: { id: freshmanId } });
    assert(storedFreshman.registrationStartAt?.toISOString() === "2026-09-25T10:30:00.000Z", "Admin Beijing time stored the wrong instant.");
    const teams = await Promise.all([
      verifier.team.create({ data: { competitionId: freshmanId, name: "动态主队" } }),
      verifier.team.create({ data: { competitionId: freshmanId, name: "动态客队" } }),
      verifier.team.create({ data: { competitionId: freshmanId, name: "测试比赛不得显示主队" } }),
      verifier.team.create({ data: { competitionId: freshmanId, name: "测试比赛不得显示客队" } }),
    ]);
    await verifier.match.create({ data: {
      slug: "test-match-must-not-drive-public",
      competitionId: freshmanId,
      stage: "测试记录",
      kickoff: new Date("2029-09-01T10:00:00.000Z"),
      venue: "测试记录场地",
      homeTeamId: teams[2].id,
      awayTeamId: teams[3].id,
      status: "SCHEDULED",
      isTestData: true,
    } });
    const matchBody = (slug: string, stage: string, kickoff: string) => ({
      slug,
      competitionId: freshmanId,
      stage,
      kickoff,
      endAt: "",
      venue: `${stage}球场`,
      round: stage,
      source: "MANUAL",
      externalMatchId: "",
      homeTeamSelection: `team:${teams[0].id}`,
      awayTeamSelection: `team:${teams[1].id}`,
      status: "SCHEDULED",
      applicationWindowStatus: "CLOSED",
      applicationDeadline: "",
      publicNote: `${stage}公开说明`,
      internalNote: "PUBLIC DTO MUST NOT EXPOSE THIS INTERNAL NOTE",
      positionCounts: {},
    });
    const firstBody = matchBody("dynamic-match-one", "动态第一场", "2030-09-25T18:30");
    const firstResponse = await apiRequest(origin, "/api/referees/admin/matches", "POST", firstBody, competitionCookie);
    await expectStatus(firstResponse, 201, "first Match create");
    const firstMatchId = (await firstResponse.json() as { matchId?: string }).matchId;
    assert(firstMatchId, "First Match response omitted its ID.");
    const firstHome = await pageHtml(origin, "/");
    assert(firstHome.includes("动态主队") && firstHome.includes("动态客队") && firstHome.includes("2030.09.25") && firstHome.includes("18:30"), "First future Match did not reach homepage.");
    assert(!firstHome.includes("测试比赛不得显示") && !firstHome.includes("PUBLIC DTO MUST NOT EXPOSE"), "Public DTO exposed test or internal Match data.");

    const secondBody = matchBody("dynamic-match-two", "动态第二场", "2030-10-02T19:00");
    const secondResponse = await apiRequest(origin, "/api/referees/admin/matches", "POST", secondBody, competitionCookie);
    await expectStatus(secondResponse, 201, "second Match create");
    assert((await pageHtml(origin, "/")).includes("2030.09.25"), "Later Match incorrectly displaced the first future Match.");
    const { homeTeamSelection, awayTeamSelection, ...firstPatchBody } = firstBody;
    assert(homeTeamSelection && awayTeamSelection, "Match fixture selections are missing.");
    const completeFirst = {
      ...firstPatchBody,
      homeTeamId: teams[0].id,
      awayTeamId: teams[1].id,
      status: "COMPLETED",
    };
    await expectStatus(
      apiRequest(origin, `/api/referees/admin/matches/${firstMatchId}`, "PATCH", completeFirst, competitionCookie),
      200,
      "complete first Match",
    );
    const advancedHome = await pageHtml(origin, "/");
    assert(advancedHome.includes("2030.10.02") && advancedHome.includes("19:00") && !advancedHome.includes("2030.09.25"), "Homepage did not advance to the next future Match.");

    for (const status of ["PREPARING", "REGISTRATION", "ONGOING", "COMPLETED"] as const) {
      await expectStatus(
        apiRequest(origin, `/api/referees/admin/competitions/${freshmanId}`, "PATCH", { ...publishedFreshman, status }, competitionCookie),
        200,
        `status lifecycle ${status}`,
      );
      const html = await pageHtml(origin, "/competitions");
      const expected = { PREPARING: "筹备中", REGISTRATION: "报名中", ONGOING: "进行中", COMPLETED: "已结束" }[status];
      assert(html.includes(expected), `${status} did not reach the public Competition center.`);
    }
    const completedHome = await pageHtml(origin, "/");
    assert(completedHome.includes("赛事已结束") && !completedHome.includes("2030.10.02"), "Completed Competition rendered a fictitious next Match.");

    await expectStatus(
      apiRequest(origin, `/api/referees/admin/competitions/${freshmanId}`, "PATCH", { ...publishedFreshman, status: "ONGOING", homepageFeatured: false }, competitionCookie),
      200,
      "disable homepage feature",
    );
    assert(!(await pageHtml(origin, "/")).includes("R1动态新生杯"), "homepageFeatured=false did not remove the published Competition card.");
    assert((await pageHtml(origin, "/competitions")).includes("R1动态新生杯"), "homepageFeatured incorrectly removed the Competition from the center.");

    const futsalDraft = competitionPayload({
      slug: "tianmuhu-futsal-league",
      name: "R1动态天目湖五人制联赛",
      format: "FUTSAL",
      status: "REGISTRATION",
      publicPublished: true,
      homepageFeatured: true,
      marker: "动态五人制",
    });
    const futsalResponse = await apiRequest(origin, "/api/referees/admin/competitions", "POST", futsalDraft, competitionCookie);
    await expectStatus(futsalResponse, 201, "Futsal create/publish");
    const futsalId = (await futsalResponse.json() as { competitionId?: string }).competitionId;
    assert(futsalId, "Futsal create response omitted its ID.");
    assert((await pageHtml(origin, "/competitions")).includes("R1动态天目湖五人制联赛"), "Futsal dynamic profile did not reach Competition center.");
    assert((await pageHtml(origin, "/competitions/tianmuhu-futsal-league")).includes("动态五人制赛事简介"), "Futsal dynamic detail failed.");
    const { slug: futsalSlug, ...futsalEditable } = futsalDraft;
    assert(futsalSlug === "tianmuhu-futsal-league", "Futsal fixture slug changed unexpectedly.");
    await expectStatus(
      apiRequest(origin, `/api/referees/admin/competitions/${futsalId}`, "PATCH", { ...futsalEditable, status: "ONGOING" }, superCookie),
      200,
      "SUPER_ADMIN edit",
    );

    const auditRows = await verifier.auditLog.findMany({ where: { entityType: "Competition" } });
    const auditText = auditRows.map((row) => row.metadata ?? "").join("\n");
    assert(auditRows.some((row) => row.actorId && row.action === "COMPETITION_CREATED"), "Competition create audit is missing.");
    assert(auditText.includes("statusChange") && auditText.includes("publicPublishedChange") && auditText.includes("homepageFeaturedChange"), "Competition audit change metadata is incomplete.");
    assert(!auditText.includes("动态新生杯赛事简介") && !auditText.includes("动态新生杯赛事公告"), "Audit metadata copied long public text.");
    const foreignKeyCheck = await createClient({ url: databaseUrl }).execute("PRAGMA foreign_key_check");
    assert(foreignKeyCheck.rows.length === 0, "HTTP data flow produced foreign key violations.");
    assert(runningServer.exitCode === null && runningServer.pid === serverPid, "The local server restarted during admin-to-public propagation.");

    console.log(JSON.stringify({
      zeroRowFallback: "PASS",
      unpublishedFallback: "PASS",
      dynamicPublish: "PASS",
      homepageDynamic: "PASS",
      competitionCenterDynamic: "PASS",
      freshmanCupDynamic: "PASS",
      futsalDynamic: "PASS",
      nextMatch: "PASS",
      nextMatchAdvance: "PASS",
      beijingTimezone: "PASS",
      statusLifecycle: "PASS",
      registrationUrl: "PASS",
      rbac: "PASS",
      publicDto: "PASS",
      historicalArchives: "PASS",
      serverStarts: 1,
      serverPid,
      rebuildsAfterStart: 0,
      restartsAfterStart: 0,
      foreignKeyViolations: 0,
    }, null, 2));
  } finally {
    if (verifier) await verifier.$disconnect();
    if (server) await stopServer(server);
    await rm(root, { recursive: true, force: true, maxRetries: 20, retryDelay: 100 });
  }
}

main().then(
  () => process.exit(0),
  (error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exit(1);
  },
);
