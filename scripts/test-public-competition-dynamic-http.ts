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

function homepageCards(html: string) {
  return [...html.matchAll(/<article class="next-match-forecast-card"[\s\S]*?<\/article>/gu)]
    .map((match) => match[0]);
}

function assertHomepageCardCount(html: string, count: number, label: string) {
  const cards = homepageCards(html);
  assert(cards.length === count, `${label} rendered ${cards.length} homepage Competition cards instead of ${count}.`);
}

function assertOneHomepageCardIncludes(html: string, marker: string, label: string) {
  const matchingCards = homepageCards(html).filter((card) => card.includes(marker));
  assert(matchingCards.length === 1, `${label} did not appear in exactly one homepage Competition card.`);
}

function assertHomepageEmptyState(html: string, label: string) {
  assertHomepageCardCount(html, 0, label);
  assert(html.includes("当前暂无首页重点赛事"), `${label} omitted the intentional empty-state title.`);
  assert(html.includes("请前往赛事中心查看全部赛事与最新安排。"), `${label} omitted the intentional empty-state guidance.`);
  assert(html.includes("进入赛事中心 →"), `${label} omitted the existing Competition center action.`);
}

function assertPublicFooter(html: string, route: string) {
  const footer = html.match(/<footer class="site-footer[^"]*" data-public-footer="shared">[\s\S]*?<\/footer>/u)?.[0];
  assert(footer, `${route} did not render the shared public footer.`);
  const currentYear = new Date().getFullYear();
  assert(
    footer.includes(`© ${2021}–${currentYear} 南京航空航天大学天目湖足球协会`),
    `${route} did not render the dynamic Association copyright range.`,
  );
  assert(footer.includes("网站建设与维护：HAN"), `${route} did not render the exact developer credit.`);
  assert(footer.includes(">鲁ICP备2026052413号</a>"), `${route} did not render the exact ICP filing number.`);
  assert(
    /<a[^>]*href="https:\/\/beian\.miit\.gov\.cn\/"[^>]*target="_blank"[^>]*rel="noopener noreferrer"[^>]*>\s*鲁ICP备2026052413号\s*<\/a>/u.test(footer),
    `${route} did not render the secure official MIIT filing link.`,
  );
  for (const placeholder of ["公安备案待补充", "公安备案号待确认", "XXXX号"]) {
    assert(!footer.includes(placeholder), `${route} rendered a Public Security filing placeholder.`);
  }
  assert(!footer.includes("footer-public-security-filing"), `${route} rendered an unset Public Security filing item.`);
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

async function expectError(
  response: Response | Promise<Response>,
  status: number,
  message: string,
  label: string,
) {
  const result = await response;
  assert(result.status === status, `${label}: expected ${status}, received ${result.status}.`);
  const body = await result.json() as { error?: string };
  assert(body.error === message, `${label}: expected exact error "${message}", received "${body.error ?? ""}".`);
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
    const publicFooterPages = [
      ["/", zeroHome],
      ["/competitions", zeroCenter],
      ["/competitions/freshman-cup", zeroFreshman],
      ["/news", await pageHtml(origin, "/news")],
      ["/news/2026-freshman-cup-preparation-notice", await pageHtml(origin, "/news/2026-freshman-cup-preparation-notice")],
      ["/referees", await pageHtml(origin, "/referees")],
      ["/association", await pageHtml(origin, "/association")],
    ] as const;
    for (const [route, html] of publicFooterPages) assertPublicFooter(html, route);
    assertHomepageEmptyState(zeroHome, "Zero-row homepage");
    assert(
      !homepageCards(zeroHome).join("\n").includes("2026南京航空航天大学新生杯足球赛事")
      && !homepageCards(zeroHome).join("\n").includes("2026天目湖五人制联赛"),
      "Zero-row homepage rendered static Competition filler cards.",
    );
    assert(zeroCenter.includes("筹备工作已启动") && zeroCenter.includes("2026天目湖五人制联赛"), "Zero-row Competition center fallback failed.");
    assert(zeroFreshman.includes("面向新生开展的院系十一人制足球赛事") && !zeroFreshman.includes("赛事公告："), "Freshman Cup static fallback failed.");
    assert(zeroFutsal.includes("2026赛季具体安排尚未公布"), "Futsal static fallback failed.");
    assert(historicalMen.includes("2026男子足球院际杯") && historicalWomen.includes("2026女子足球院际杯"), "Historical archive routes regressed.");

    const [competitionCookie, contentCookie, superCookie] = await Promise.all([
      login(origin, "dynamic-competition"),
      login(origin, "dynamic-content"),
      login(origin, "dynamic-super"),
    ]);
    const adminCreate = await pageHtml(origin, "/admin/competitions/new", competitionCookie);
    assert(
      adminCreate.includes("在首页赛事预告中展示")
      && adminCreate.includes("开启后，该赛事将显示在官网首页“赛事预告”区域，并自动同步当前赛事状态及下一场公开比赛信息。")
      && adminCreate.includes("请先开启“公开发布”后再设置首页展示。")
      && /<input(?=[^>]*name="homepageFeatured")(?=[^>]*disabled)[^>]*>/u.test(adminCreate),
      "Admin create did not render the exact disabled homepage feature dependency.",
    );
    const draftFreshman = competitionPayload({
      slug: "freshman-cup",
      name: "R1动态新生杯",
      format: "ELEVEN_A_SIDE",
      status: "REGISTRATION",
      publicPublished: false,
      homepageFeatured: false,
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
    await expectError(
      apiRequest(
        origin,
        "/api/referees/admin/competitions",
        "POST",
        { ...draftFreshman, homepageFeatured: true },
        competitionCookie,
      ),
      409,
      "只有已公开发布的赛事才能在首页赛事预告中展示。",
      "unpublished featured create",
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
    const unpublishedHome = await pageHtml(origin, "/");
    assert(!unpublishedHome.includes("R1动态新生杯"), "Unpublished Competition reached the homepage.");
    assertHomepageEmptyState(unpublishedHome, "Unpublished Competition homepage");
    assert(!(await pageHtml(origin, "/competitions")).includes("动态新生杯赛事简介"), "Unpublished Competition replaced center fallback.");
    assert(!(await pageHtml(origin, "/competitions/freshman-cup")).includes("动态新生杯球场"), "Unpublished Competition replaced detail fallback.");

    await expectStatus(
      apiRequest(origin, `/api/referees/admin/competitions/${freshmanId}`, "PATCH", draftFreshman, competitionCookie),
      409,
      "read-only slug",
    );
    const { slug: freshmanSlug, ...freshmanEditable } = draftFreshman;
    assert(freshmanSlug === "freshman-cup", "Freshman fixture slug changed unexpectedly.");
    const publishedFreshman = {
      ...freshmanEditable,
      publicPublished: true,
      homepageFeatured: false,
      status: "REGISTRATION",
    };
    await expectStatus(
      apiRequest(origin, `/api/referees/admin/competitions/${freshmanId}`, "PATCH", publishedFreshman, competitionCookie),
      200,
      "COMPETITION_ADMIN publish",
    );
    const publishedUnfeaturedHome = await pageHtml(origin, "/");
    const dynamicCenter = await pageHtml(origin, "/competitions");
    const dynamicFreshman = await pageHtml(origin, "/competitions/freshman-cup");
    assertHomepageEmptyState(publishedUnfeaturedHome, "Published unfeatured Competition homepage");
    assert(!homepageCards(publishedUnfeaturedHome).join("\n").includes("R1动态新生杯"), "Unfeatured Competition reached a homepage card.");
    assert(dynamicCenter.includes("R1动态新生杯") && dynamicCenter.includes("报名中"), "Competition center dynamic title/status failed.");
    assert(dynamicCenter.includes("报名进行中，赛程待正式发布。"), "Competition center did not show status-appropriate safe no-Match wording.");
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
    assert(dynamicFreshman.includes("报名进行中，赛程待正式发布。"), "Competition detail did not show status-appropriate safe no-Match wording.");
    const adminEdit = await pageHtml(origin, `/admin/competitions/${freshmanId}/edit`, competitionCookie);
    assert(adminEdit.includes("freshman-cup") && adminEdit.includes("北京时间（UTC+8）"), "Admin edit did not show read-only slug and timezone labels.");
    assert(
      adminEdit.includes("在首页赛事预告中展示")
      && adminEdit.includes("开启后，该赛事将显示在官网首页“赛事预告”区域，并自动同步当前赛事状态及下一场公开比赛信息。")
      && !adminEdit.includes("首页赛事预告展示"),
      "Admin edit did not render the exact homepage feature label and guidance.",
    );
    await expectStatus(
      apiRequest(
        origin,
        `/api/referees/admin/competitions/${freshmanId}`,
        "PATCH",
        { ...publishedFreshman, homepageFeatured: true },
        competitionCookie,
      ),
      200,
      "enable first homepage feature",
    );
    const oneFreshmanHome = await pageHtml(origin, "/");
    assertHomepageCardCount(oneFreshmanHome, 1, "One-featured Freshman Cup homepage");
    assertOneHomepageCardIncludes(oneFreshmanHome, "R1动态新生杯", "One-featured dynamic Freshman Cup");
    assert(oneFreshmanHome.includes("is-single"), "One-featured homepage did not use the intentional single-card layout.");
    assert(
      !homepageCards(oneFreshmanHome).join("\n").includes("2026天目湖五人制联赛"),
      "One-featured homepage added a static filler card.",
    );

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
    await verifier.match.create({ data: {
      slug: "past-match-must-not-drive-public",
      competitionId: freshmanId,
      stage: "过往比赛不得显示",
      kickoff: new Date("2020-09-01T10:00:00.000Z"),
      venue: "过往比赛不得显示场地",
      homeTeamId: teams[0].id,
      awayTeamId: teams[1].id,
      status: "SCHEDULED",
    } });
    const noEligibleMatchCenter = await pageHtml(origin, "/competitions");
    const noEligibleMatchDetail = await pageHtml(origin, "/competitions/freshman-cup");
    assert(
      noEligibleMatchCenter.includes("报名进行中，赛程待正式发布。")
      && noEligibleMatchDetail.includes("报名进行中，赛程待正式发布。")
      && !noEligibleMatchCenter.includes("过往比赛不得显示")
      && !noEligibleMatchDetail.includes("过往比赛不得显示"),
      "Past or test Match incorrectly replaced the safe pending presentation.",
    );
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
    const firstCenter = await pageHtml(origin, "/competitions");
    const firstDetail = await pageHtml(origin, "/competitions/freshman-cup");
    for (const [label, html] of [["homepage", firstHome], ["Competition center", firstCenter], ["Competition detail", firstDetail]] as const) {
      assert(
        html.includes("动态主队")
        && html.includes("动态客队")
        && html.includes("2030.09.25")
        && html.includes("18:30")
        && html.includes("动态第一场球场"),
        `First future Match did not reach the ${label}.`,
      );
      assert(!html.includes("测试比赛不得显示") && !html.includes("PUBLIC DTO MUST NOT EXPOSE"), `${label} exposed test or internal Match data.`);
    }

    const secondBody = matchBody("dynamic-match-two", "动态第二场", "2030-10-02T19:00");
    const secondResponse = await apiRequest(origin, "/api/referees/admin/matches", "POST", secondBody, competitionCookie);
    await expectStatus(secondResponse, 201, "second Match create");
    const secondMatchId = (await secondResponse.json() as { matchId?: string }).matchId;
    assert(secondMatchId, "Second Match response omitted its ID.");
    for (const route of ["/", "/competitions", "/competitions/freshman-cup"]) {
      assert((await pageHtml(origin, route)).includes("2030.09.25"), `Later Match incorrectly displaced the first future Match on ${route}.`);
    }
    const { homeTeamSelection, awayTeamSelection, ...firstPatchBody } = firstBody;
    assert(homeTeamSelection && awayTeamSelection, "Match fixture selections are missing.");
    const editedFirst = {
      ...firstPatchBody,
      homeTeamId: teams[0].id,
      awayTeamId: teams[1].id,
      kickoff: "2030-09-26T20:15",
      venue: "动态调整后场地",
    };
    await expectStatus(
      apiRequest(origin, `/api/referees/admin/matches/${firstMatchId}`, "PATCH", editedFirst, competitionCookie),
      200,
      "edit first Match",
    );
    for (const route of ["/", "/competitions", "/competitions/freshman-cup"]) {
      const editedHtml = await pageHtml(origin, route);
      assert(
        editedHtml.includes("2030.09.26")
        && editedHtml.includes("20:15")
        && editedHtml.includes("动态调整后场地")
        && !editedHtml.includes("2030.09.25"),
        `${route} did not immediately reflect the edited next Match.`,
      );
    }

    await expectStatus(
      apiRequest(
        origin,
        `/api/referees/admin/matches/${firstMatchId}`,
        "PATCH",
        { ...editedFirst, status: "CANCELLED", cancellationReason: "赛程调整" },
        competitionCookie,
      ),
      200,
      "cancel first Match",
    );
    for (const route of ["/", "/competitions", "/competitions/freshman-cup"]) {
      const advancedHtml = await pageHtml(origin, route);
      assert(
        advancedHtml.includes("2030.10.02")
        && advancedHtml.includes("19:00")
        && advancedHtml.includes("动态第二场球场")
        && !advancedHtml.includes("2030.09.26"),
        `${route} did not immediately advance after the first Match was cancelled.`,
      );
    }

    const { homeTeamSelection: secondHomeSelection, awayTeamSelection: secondAwaySelection, ...secondPatchBody } = secondBody;
    assert(secondHomeSelection && secondAwaySelection, "Second Match fixture selections are missing.");
    await expectStatus(
      apiRequest(
        origin,
        `/api/referees/admin/matches/${secondMatchId}`,
        "PATCH",
        {
          ...secondPatchBody,
          homeTeamId: teams[0].id,
          awayTeamId: teams[1].id,
          status: "CANCELLED",
          cancellationReason: "赛程取消",
        },
        competitionCookie,
      ),
      200,
      "cancel second Match",
    );
    for (const route of ["/", "/competitions", "/competitions/freshman-cup"]) {
      const pendingHtml = await pageHtml(origin, route);
      assert(
        pendingHtml.includes("报名进行中，赛程待正式发布。")
        && !pendingHtml.includes("2030.10.02"),
        `${route} did not return to safe pending wording after all eligible Matches were cancelled.`,
      );
    }

    for (const status of ["PREPARING", "REGISTRATION", "ONGOING", "COMPLETED"] as const) {
      await expectStatus(
        apiRequest(
          origin,
          `/api/referees/admin/competitions/${freshmanId}`,
          "PATCH",
          { ...publishedFreshman, status, homepageFeatured: true },
          competitionCookie,
        ),
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
    const unfeaturedPublishedHome = await pageHtml(origin, "/");
    assertHomepageEmptyState(unfeaturedPublishedHome, "Published unfeatured Competition homepage");
    assert(!unfeaturedPublishedHome.includes("R1动态新生杯"), "Unfeatured Competition remained on the homepage.");
    const unfeaturedPublishedCenter = await pageHtml(origin, "/competitions");
    const unfeaturedPublishedDetail = await pageHtml(origin, "/competitions/freshman-cup");
    assert(
      unfeaturedPublishedCenter.includes("R1动态新生杯")
      && unfeaturedPublishedCenter.includes("当前暂无已正式发布的下一场比赛，请关注赛事公告。")
      && unfeaturedPublishedDetail.includes("R1动态新生杯")
      && unfeaturedPublishedDetail.includes("当前暂无已正式发布的下一场比赛，请关注赛事公告。"),
      "homepageFeatured incorrectly changed dynamic overview/detail or Match presentation.",
    );

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
    const oneFeaturedHome = await pageHtml(origin, "/");
    const oneFeaturedCards = homepageCards(oneFeaturedHome).join("\n");
    assert(
      oneFeaturedCards.includes("R1动态天目湖五人制联赛")
      && !oneFeaturedCards.includes("R1动态新生杯")
      && !oneFeaturedCards.includes("2026南京航空航天大学新生杯足球赛事")
      && !oneFeaturedCards.includes("2026天目湖五人制联赛"),
      "One-featured homepage did not render only the eligible dynamic card.",
    );
    assertHomepageCardCount(oneFeaturedHome, 1, "One featured Futsal Competition");
    assert(oneFeaturedHome.includes("is-single"), "One-featured Futsal homepage did not use the intentional single-card layout.");

    const futsalTeams = await Promise.all([
      verifier.team.create({ data: { competitionId: futsalId, name: "五人制主队" } }),
      verifier.team.create({ data: { competitionId: futsalId, name: "五人制客队" } }),
    ]);
    await verifier.match.create({ data: {
      slug: "dynamic-futsal-match",
      competitionId: futsalId,
      stage: "五人制独立场次",
      kickoff: new Date("2030-09-20T10:00:00.000Z"),
      venue: "五人制独立球场",
      homeTeamId: futsalTeams[0].id,
      awayTeamId: futsalTeams[1].id,
      status: "SCHEDULED",
    } });
    const thirdFreshmanMatchResponse = await apiRequest(
      origin,
      "/api/referees/admin/matches",
      "POST",
      matchBody("dynamic-match-three", "动态第三场", "2030-11-01T18:00"),
      competitionCookie,
    );
    await expectStatus(thirdFreshmanMatchResponse, 201, "third Freshman Match create for isolation");
    const isolatedFreshmanDetail = await pageHtml(origin, "/competitions/freshman-cup");
    const isolatedFutsalDetail = await pageHtml(origin, "/competitions/tianmuhu-futsal-league");
    assert(
      isolatedFreshmanDetail.includes("动态主队")
      && isolatedFreshmanDetail.includes("动态客队")
      && !isolatedFreshmanDetail.includes("五人制主队")
      && !isolatedFreshmanDetail.includes("五人制客队"),
      "Freshman Cup detail leaked Futsal Teams or Match data.",
    );
    assert(
      isolatedFutsalDetail.includes("五人制主队")
      && isolatedFutsalDetail.includes("五人制客队")
      && isolatedFutsalDetail.includes("2030.09.20")
      && isolatedFutsalDetail.includes("五人制独立球场")
      && !isolatedFutsalDetail.includes("动态主队")
      && !isolatedFutsalDetail.includes("动态客队"),
      "Futsal detail leaked Freshman Cup Teams or Match data.",
    );
    const { slug: futsalSlug, ...futsalEditable } = futsalDraft;
    assert(futsalSlug === "tianmuhu-futsal-league", "Futsal fixture slug changed unexpectedly.");
    await expectStatus(
      apiRequest(origin, `/api/referees/admin/competitions/${futsalId}`, "PATCH", { ...futsalEditable, status: "ONGOING" }, superCookie),
      200,
      "SUPER_ADMIN edit",
    );

    await expectStatus(
      apiRequest(origin, `/api/referees/admin/competitions/${freshmanId}`, "PATCH", { ...publishedFreshman, status: "ONGOING", homepageFeatured: true }, competitionCookie),
      200,
      "restore Freshman Cup homepage feature",
    );
    const twoFeaturedHome = await pageHtml(origin, "/");
    const twoFeaturedCards = homepageCards(twoFeaturedHome).join("\n");
    assert(
      twoFeaturedCards.includes("R1动态新生杯")
      && twoFeaturedCards.includes("R1动态天目湖五人制联赛")
      && twoFeaturedCards.includes("动态主队")
      && twoFeaturedCards.includes("五人制主队")
      && !twoFeaturedCards.includes("2026南京航空航天大学新生杯足球赛事")
      && !twoFeaturedCards.includes("2026天目湖五人制联赛"),
      "Two-featured homepage did not render both dynamic Competition cards without static duplicates.",
    );
    assertHomepageCardCount(twoFeaturedHome, 2, "Two featured Competitions");

    const thirdDraft = competitionPayload({
      slug: "third-homepage-competition",
      name: "首页第三项赛事",
      format: "ELEVEN_A_SIDE",
      status: "PREPARING",
      publicPublished: true,
      homepageFeatured: false,
      marker: "第三项赛事",
    });
    const thirdResponse = await apiRequest(
      origin,
      "/api/referees/admin/competitions",
      "POST",
      thirdDraft,
      competitionCookie,
    );
    await expectStatus(thirdResponse, 201, "third unfeatured Competition create");
    const thirdId = (await thirdResponse.json() as { competitionId?: string }).competitionId;
    assert(thirdId, "Third Competition response omitted its ID.");
    const { slug: thirdSlug, ...thirdEditable } = thirdDraft;
    assert(thirdSlug === "third-homepage-competition", "Third fixture slug changed unexpectedly.");
    await expectError(
      apiRequest(
        origin,
        `/api/referees/admin/competitions/${thirdId}`,
        "PATCH",
        { ...thirdEditable, homepageFeatured: true },
        competitionCookie,
      ),
      409,
      "首页最多同时展示 2 项赛事，请先关闭一项现有首页赛事。",
      "third homepage feature",
    );
    const featuredFlagsAfterLimit = await verifier.competition.findMany({
      where: { id: { in: [freshmanId, futsalId, thirdId] } },
      select: { id: true, homepageFeatured: true },
    });
    const featuredById = new Map(featuredFlagsAfterLimit.map((row) => [row.id, row.homepageFeatured]));
    assert(
      featuredById.get(freshmanId) === true
      && featuredById.get(futsalId) === true
      && featuredById.get(thirdId) === false,
      "Rejecting a third homepage feature changed an existing feature flag.",
    );
    await expectError(
      apiRequest(
        origin,
        `/api/referees/admin/competitions/${thirdId}`,
        "PATCH",
        { ...thirdEditable, publicPublished: false, homepageFeatured: true },
        competitionCookie,
      ),
      409,
      "只有已公开发布的赛事才能在首页赛事预告中展示。",
      "unpublished featured update",
    );
    assertHomepageCardCount(await pageHtml(origin, "/"), 2, "Rejected third homepage feature");

    await verifier.referee.create({ data: {
      publicCode: "901",
      name: "隐私边界测试裁判",
      studentId: "PRIVATE-STUDENT-ID-MARKER",
      phone: "PRIVATE-PHONE-MARKER",
      qq: "PRIVATE-QQ-MARKER",
      passwordHash: "PRIVATE-PASSWORD-HASH-MARKER",
      sourceNote: "PRIVATE-SOURCE-NOTE-MARKER",
      internalNote: "PRIVATE-REFEREE-INTERNAL-NOTE-MARKER",
    } });
    await verifier.auditLog.create({ data: {
      actorType: "SYSTEM",
      action: "PRIVATE_AUDIT_MARKER",
      entityType: "Competition",
      entityId: freshmanId,
      summary: "PRIVATE-AUDIT-SUMMARY-MARKER",
      metadata: "PRIVATE-ADMIN-METADATA-MARKER",
    } });
    const publicPrivacyHtml = [
      await pageHtml(origin, "/"),
      await pageHtml(origin, "/competitions"),
      await pageHtml(origin, "/competitions/freshman-cup"),
      await pageHtml(origin, "/competitions/tianmuhu-futsal-league"),
    ].join("\n");
    for (const privateMarker of [
      "PRIVATE-STUDENT-ID-MARKER",
      "PRIVATE-PHONE-MARKER",
      "PRIVATE-QQ-MARKER",
      "PRIVATE-PASSWORD-HASH-MARKER",
      "PRIVATE-SOURCE-NOTE-MARKER",
      "PRIVATE-REFEREE-INTERNAL-NOTE-MARKER",
      "PUBLIC DTO MUST NOT EXPOSE THIS INTERNAL NOTE",
      "PRIVATE-AUDIT-SUMMARY-MARKER",
      "PRIVATE-ADMIN-METADATA-MARKER",
      competitionCookie,
      contentCookie,
      superCookie,
    ]) {
      assert(!publicPrivacyHtml.includes(privateMarker), `Public Competition HTML exposed private marker: ${privateMarker}`);
    }

    const auditRows = await verifier.auditLog.findMany({ where: { entityType: "Competition" } });
    const auditText = auditRows.map((row) => row.metadata ?? "").join("\n");
    assert(auditRows.some((row) => row.actorId && row.action === "COMPETITION_CREATED"), "Competition create audit is missing.");
    assert(auditText.includes("statusChange") && auditText.includes("publicPublishedChange") && auditText.includes("homepageFeaturedChange"), "Competition audit change metadata is incomplete.");
    assert(!auditText.includes("动态新生杯赛事简介") && !auditText.includes("动态新生杯赛事公告"), "Audit metadata copied long public text.");
    const foreignKeyCheck = await createClient({ url: databaseUrl }).execute("PRAGMA foreign_key_check");
    assert(foreignKeyCheck.rows.length === 0, "HTTP data flow produced foreign key violations.");
    assert(runningServer.exitCode === null && runningServer.pid === serverPid, "The local server restarted during admin-to-public propagation.");

    console.log(JSON.stringify({
      zeroRowEmptyState: "PASS",
      unpublishedHidden: "PASS",
      dynamicPublish: "PASS",
      homepageZeroFeatured: "PASS",
      homepageOneFeatured: "PASS",
      homepageTwoFeatured: "PASS",
      homepageNoDuplicates: "PASS",
      homepageDynamic: "PASS",
      homepageFeatureLimit: "PASS",
      homepagePublishedInvariant: "PASS",
      competitionCenterDynamic: "PASS",
      freshmanCupDynamic: "PASS",
      futsalDynamic: "PASS",
      noEligibleMatchPending: "PASS",
      nextMatch: "PASS",
      nextMatchEdit: "PASS",
      nextMatchAdvance: "PASS",
      nextMatchCancelToPending: "PASS",
      sameProcessFreshness: "PASS",
      competitionIsolation: "PASS",
      beijingTimezone: "PASS",
      statusLifecycle: "PASS",
      registrationUrl: "PASS",
      rbac: "PASS",
      publicDto: "PASS",
      publicFooter: "PASS",
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
