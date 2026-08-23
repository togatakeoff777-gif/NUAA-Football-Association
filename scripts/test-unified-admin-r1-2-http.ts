type RoleName = "super" | "content" | "competition" | "referee";
type Permission = "dashboard" | "content" | "media" | "competition" | "referee" | "system";

const baseUrl = process.env.R1_2_SMOKE_BASE_URL ?? "http://localhost:3102";
const password = process.env.R1_2_SMOKE_PASSWORD ?? "Smoke-Password-2026!";
const usernames: Record<RoleName, string> = {
  super: "smoke-super",
  content: "smoke-content",
  competition: "smoke-competition",
  referee: "smoke-referee",
};

const allowedRoles: Record<Permission, readonly RoleName[]> = {
  dashboard: ["super", "content", "competition", "referee"],
  content: ["super", "content"],
  media: ["super", "content"],
  competition: ["super", "competition"],
  referee: ["super", "referee"],
  system: ["super"],
};

function expectStatus(label: string, actual: number, expected: number) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`);
  console.log(`PASS ${label}: ${actual}`);
}

function expectAllowedStatus(label: string, status: number) {
  if (status === 401 || status === 403 || status >= 500) throw new Error(`${label}: expected authorized application response, received ${status}`);
  console.log(`PASS ${label}: authorized (${status})`);
}

async function login(role: RoleName) {
  const response = await fetch(`${baseUrl}/api/referees/admin/login`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseUrl },
    body: JSON.stringify({ username: usernames[role], password }),
    redirect: "manual",
  });
  expectStatus(`${role} AdminAccount login reuse`, response.status, 200);
  const cookie = response.headers.get("set-cookie")?.match(/nuaa_referee_admin=[^;]+/)?.[0];
  if (!cookie) throw new Error(`${role}: login response did not set the administrator cookie`);
  return cookie;
}

async function apiRequest(input: { path: string; method: string; cookie?: string; origin?: string | null; body?: BodyInit }) {
  const body = input.body ?? (input.method === "GET" ? undefined : "{}");
  return fetch(`${baseUrl}${input.path}`, {
    method: input.method,
    headers: {
      ...(body === undefined ? {} : { "content-type": "application/json" }),
      ...(input.cookie ? { cookie: input.cookie } : {}),
      ...(input.origin === null ? {} : { origin: input.origin ?? baseUrl }),
    },
    body,
    redirect: "manual",
  });
}

async function verifyLegacyApiMatrix(cookies: Record<RoleName, string>) {
  const routes: Array<{ method: string; path: string; permission: Permission }> = [
    { method: "POST", path: "/api/referees/admin/account/password", permission: "dashboard" },
    { method: "POST", path: "/api/referees/admin/accounts", permission: "referee" },
    { method: "PATCH", path: "/api/referees/admin/accounts/missing-account", permission: "referee" },
    { method: "POST", path: "/api/referees/admin/accounts/missing-account", permission: "referee" },
    { method: "POST", path: "/api/referees/admin/admin-accounts", permission: "system" },
    { method: "PATCH", path: "/api/referees/admin/admin-accounts", permission: "system" },
    { method: "POST", path: "/api/referees/admin/affiliation-units", permission: "competition" },
    { method: "POST", path: "/api/referees/admin/applications", permission: "referee" },
    { method: "PATCH", path: "/api/referees/admin/applications/missing-application", permission: "referee" },
    { method: "PUT", path: "/api/referees/admin/appointments/missing-match", permission: "referee" },
    { method: "POST", path: "/api/referees/admin/appointments/missing-match", permission: "referee" },
    { method: "POST", path: "/api/referees/admin/availability", permission: "referee" },
    { method: "DELETE", path: "/api/referees/admin/availability", permission: "referee" },
    { method: "POST", path: "/api/referees/admin/colleges", permission: "competition" },
    { method: "POST", path: "/api/referees/admin/competitions", permission: "competition" },
    { method: "PATCH", path: "/api/referees/admin/competitions/missing-competition", permission: "competition" },
    { method: "PATCH", path: "/api/referees/admin/conflict-reports/missing-report", permission: "referee" },
    { method: "GET", path: "/api/referees/admin/exports/invalid-kind", permission: "referee" },
    { method: "POST", path: "/api/referees/admin/matches", permission: "competition" },
    { method: "PATCH", path: "/api/referees/admin/matches/missing-match", permission: "competition" },
    { method: "POST", path: "/api/referees/admin/matches/missing-match", permission: "competition" },
    { method: "DELETE", path: "/api/referees/admin/matches/missing-match", permission: "competition" },
    { method: "PUT", path: "/api/referees/admin/team-affiliations", permission: "competition" },
    { method: "POST", path: "/api/referees/admin/teams", permission: "competition" },
  ];
  for (const route of routes) {
    const label = `${route.method} ${route.path}`;
    expectStatus(`${label} unauthenticated`, (await apiRequest({ ...route })).status, 401);
    if (route.method !== "GET") {
      expectStatus(`${label} Origin/CSRF`, (await apiRequest({ ...route, cookie: cookies.super, origin: "https://attacker.invalid" })).status, 403);
    }
    for (const role of Object.keys(cookies) as RoleName[]) {
      const response = await apiRequest({ ...route, cookie: cookies[role] });
      if (allowedRoles[route.permission].includes(role)) expectAllowedStatus(`${label} ${role}`, response.status);
      else expectStatus(`${label} ${role}`, response.status, 403);
    }
  }
}

async function verifyAdminPageMatrix(cookies: Record<RoleName, string>) {
  const pages: Array<{ path: string; permission: Permission }> = [
    { path: "/admin", permission: "dashboard" },
    { path: "/admin/content/news", permission: "content" },
    { path: "/admin/media", permission: "media" },
    { path: "/admin/competitions", permission: "dashboard" },
    { path: "/admin/matches", permission: "dashboard" },
    { path: "/admin/organizations", permission: "dashboard" },
    { path: "/admin/referees", permission: "referee" },
    { path: "/admin/referees/availability", permission: "referee" },
    { path: "/admin/appointments", permission: "referee" },
    { path: "/admin/conflicts", permission: "referee" },
    { path: "/admin/statistics", permission: "referee" },
    { path: "/admin/system/admins", permission: "system" },
    { path: "/admin/system/audit", permission: "system" },
    { path: "/referees/admin", permission: "dashboard" },
    { path: "/referees/admin/matches", permission: "dashboard" },
    { path: "/referees/admin/matches/new", permission: "competition" },
    { path: "/referees/admin/matches/competitions", permission: "dashboard" },
    { path: "/referees/admin/matches/competitions/new", permission: "competition" },
    { path: "/referees/admin/affiliations", permission: "dashboard" },
    { path: "/referees/admin/referees", permission: "referee" },
    { path: "/referees/admin/referees/new", permission: "referee" },
    { path: "/referees/admin/availability", permission: "referee" },
    { path: "/referees/admin/conflicts", permission: "referee" },
    { path: "/referees/admin/statistics", permission: "referee" },
    { path: "/referees/admin/admins", permission: "system" },
    { path: "/referees/admin/audit-log", permission: "system" },
  ];
  for (const page of pages) {
    const unauthenticated = await fetch(`${baseUrl}${page.path}`, { redirect: "manual" });
    if (![303, 307, 308].includes(unauthenticated.status) || !unauthenticated.headers.get("location")?.includes("/referees/admin/login")) {
      throw new Error(`${page.path} unauthenticated direct URL did not redirect to login`);
    }
    for (const role of Object.keys(cookies) as RoleName[]) {
      const response = await fetch(`${baseUrl}${page.path}`, { headers: { cookie: cookies[role] }, redirect: "manual" });
      if (allowedRoles[page.permission].includes(role)) expectStatus(`${page.path} ${role} page`, response.status, 200);
      else if (![303, 307, 308].includes(response.status) || !response.headers.get("location")?.includes("/admin?denied=")) {
        throw new Error(`${page.path} ${role}: denied direct URL did not fail closed (${response.status})`);
      } else console.log(`PASS ${page.path} ${role} denied direct URL`);
    }
  }
}

async function verifyDatabaseNews() {
  const first = await fetch(`${baseUrl}/api/content/posts?pageSize=3`, { cache: "no-store" });
  expectStatus("database news list API", first.status, 200);
  const firstPage = await first.json() as { items: Array<Record<string, unknown>>; nextCursor: string | null };
  if (firstPage.items.length !== 3 || firstPage.items.some((item) => item.pinned !== true || "content" in item || "id" in item || "featured" in item)) {
    throw new Error("Database news first page did not honor pinned/List DTO rules.");
  }
  const second = await fetch(`${baseUrl}/api/content/posts?pageSize=3&cursor=${encodeURIComponent(firstPage.nextCursor ?? "")}`, { cache: "no-store" });
  expectStatus("database news cursor page", second.status, 200);
  const secondPage = await second.json() as { items: Array<Record<string, unknown>> };
  if (secondPage.items.filter((item) => item.pinned === true).length !== 2 || secondPage.items.filter((item) => item.pinned === false).length !== 1) {
    throw new Error("Database news pinned-to-normal cursor transition failed.");
  }
  expectStatus("malformed public cursor", (await fetch(`${baseUrl}/api/content/posts?cursor=not-a-valid-cursor`)).status, 400);

  const detail = await fetch(`${baseUrl}/api/content/posts/smoke-news-01`, { cache: "no-store" });
  expectStatus("database news Detail DTO", detail.status, 200);
  const detailDto = await detail.json() as Record<string, unknown>;
  if (!("content" in detailDto) || "id" in detailDto || "authorAdminId" in detailDto) throw new Error("Public Detail DTO contract failed over HTTP.");
  const discipline = await fetch(`${baseUrl}/api/content/posts/smoke-discipline`, { cache: "no-store" });
  expectStatus("database Discipline detail", discipline.status, 200);
  const disciplineDto = await discipline.json() as { discipline?: { officialMedia?: { url?: string } } };
  if (!disciplineDto.discipline?.officialMedia?.url) throw new Error("Discipline PDF relationship missing from public detail.");
  for (const slug of ["smoke-draft", "smoke-archived", "smoke-future", "missing-slug", "bad%20slug"]) {
    expectStatus(`${slug} public detail hidden`, (await fetch(`${baseUrl}/api/content/posts/${slug}`)).status, 404);
  }
  for (const page of ["/news", "/news/smoke-news-01", "/news/smoke-discipline"]) {
    expectStatus(`${page} database page`, (await fetch(`${baseUrl}${page}`, { cache: "no-store" })).status, 200);
  }
  expectStatus("/news missing slug page", (await fetch(`${baseUrl}/news/missing-slug`)).status, 404);
}

async function verifyMedia(cookies: Record<RoleName, string>) {
  const publicMediaId = process.env.R1_2_PUBLIC_MEDIA_ID;
  if (!publicMediaId) throw new Error("R1_2_PUBLIC_MEDIA_ID is required for the R1-2 HTTP gate.");
  const publicResponse = await fetch(`${baseUrl}/media/${publicMediaId}`);
  expectStatus("PUBLIC media", publicResponse.status, 200);
  if (publicResponse.headers.get("x-content-type-options") !== "nosniff") throw new Error("PUBLIC media missing nosniff");
  if (!publicResponse.headers.get("cache-control")?.includes("max-age=300")) throw new Error("PUBLIC media cache policy mismatch");
  if (!publicResponse.headers.get("content-disposition")?.includes("filename*=UTF-8''")) throw new Error("PUBLIC media RFC 5987 filename missing");

  const pdf = new Uint8Array(20 * 1024 * 1024);
  pdf.set(new TextEncoder().encode("%PDF-1.7\n"));
  const upload = await fetch(`${baseUrl}/api/admin/media`, {
    method: "POST",
    headers: {
      cookie: cookies.content,
      origin: baseUrl,
      "content-type": "application/pdf",
      "x-nuaafa-filename": encodeURIComponent("R1-2 处罚决定（测试）.pdf"),
      "x-nuaafa-visibility": "PRIVATE",
      "x-nuaafa-alt-text": encodeURIComponent("20 MB streaming HTTP proof"),
    },
    body: pdf,
  });
  expectStatus("20 MB streaming media HTTP upload", upload.status, 201);
  const uploaded = await upload.json() as { asset?: { id?: string; size?: number } };
  if (!uploaded.asset?.id || uploaded.asset.size !== pdf.length) throw new Error("Streaming upload response metadata mismatch.");
  expectStatus("PRIVATE media unauthenticated", (await fetch(`${baseUrl}/media/${uploaded.asset.id}`)).status, 401);
  expectStatus("PRIVATE media role denied", (await fetch(`${baseUrl}/media/${uploaded.asset.id}`, { headers: { cookie: cookies.competition } })).status, 403);
  const privateResponse = await fetch(`${baseUrl}/media/${uploaded.asset.id}`, { headers: { cookie: cookies.content } });
  expectStatus("PRIVATE media authorized", privateResponse.status, 200);
  if (privateResponse.headers.get("cache-control") !== "private, no-store") throw new Error("PRIVATE media cache policy mismatch");
  if (privateResponse.headers.get("x-content-type-options") !== "nosniff") throw new Error("PRIVATE media missing nosniff");
  if (!privateResponse.headers.get("content-disposition")?.includes("filename*=UTF-8''R1-2%20")) throw new Error("PRIVATE media RFC 5987 Unicode filename mismatch");
  if ((await privateResponse.arrayBuffer()).byteLength !== pdf.length) throw new Error("Streamed PRIVATE media length mismatch.");
  console.log("PASS PUBLIC / PRIVATE media headers and streaming body");
}

async function main() {
  const health = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
  expectStatus("isolated app health", health.status, 200);
  const cookies = Object.fromEntries(await Promise.all(
    (Object.keys(usernames) as RoleName[]).map(async (role) => [role, await login(role)] as const),
  )) as Record<RoleName, string>;
  await verifyLegacyApiMatrix(cookies);
  await verifyAdminPageMatrix(cookies);
  await verifyDatabaseNews();
  await verifyMedia(cookies);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
