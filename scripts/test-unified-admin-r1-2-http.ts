type RoleName = "super" | "content" | "competition" | "referee";

const baseUrl = process.env.R1_2_SMOKE_BASE_URL ?? "http://localhost:3102";
const password = process.env.R1_2_SMOKE_PASSWORD ?? "Smoke-Password-2026!";
const usernames: Record<RoleName, string> = {
  super: "smoke-super",
  content: "smoke-content",
  competition: "smoke-competition",
  referee: "smoke-referee",
};

function expectStatus(label: string, actual: number, expected: number) {
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`);
  console.log(`PASS ${label}: ${actual}`);
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

async function mutate(path: string, cookie?: string, origin = baseUrl) {
  return fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(cookie ? { cookie } : {}),
      ...(origin ? { origin } : {}),
    },
    body: "{}",
    redirect: "manual",
  });
}

async function main() {
  const health = await fetch(`${baseUrl}/api/health`, { cache: "no-store" });
  expectStatus("isolated app health", health.status, 200);

  const cookies = Object.fromEntries(await Promise.all(
    (Object.keys(usernames) as RoleName[]).map(async (role) => [role, await login(role)] as const),
  )) as Record<RoleName, string>;

  const matrix = [
    { path: "/api/referees/admin/competitions", permission: "competition", allowed: ["super", "competition"] as RoleName[] },
    { path: "/api/referees/admin/applications", permission: "referee", allowed: ["super", "referee"] as RoleName[] },
    { path: "/api/referees/admin/admin-accounts", permission: "system", allowed: ["super"] as RoleName[] },
  ];
  for (const route of matrix) {
    expectStatus(`${route.permission} unauthenticated`, (await mutate(route.path)).status, 401);
    expectStatus(`${route.permission} Origin/CSRF`, (await mutate(route.path, cookies.super, "https://attacker.invalid")).status, 403);
    for (const role of Object.keys(cookies) as RoleName[]) {
      const expected = route.allowed.includes(role) ? 400 : 403;
      expectStatus(`${route.permission} ${role} authorization`, (await mutate(route.path, cookies[role])).status, expected);
    }
  }

  const publicMediaId = process.env.R1_2_PUBLIC_MEDIA_ID;
  if (publicMediaId) {
    const response = await fetch(`${baseUrl}/media/${publicMediaId}`);
    expectStatus("PUBLIC media", response.status, 200);
    if (response.headers.get("x-content-type-options") !== "nosniff") throw new Error("PUBLIC media missing nosniff");
    if (!response.headers.get("cache-control")?.includes("max-age=300")) throw new Error("PUBLIC media cache policy mismatch");
    if (!response.headers.get("content-disposition")?.includes("filename*=UTF-8''")) throw new Error("PUBLIC media RFC 5987 filename missing");
    console.log("PASS PUBLIC media headers");
  }

  const privateMediaId = process.env.R1_2_PRIVATE_MEDIA_ID;
  if (privateMediaId) {
    expectStatus("PRIVATE media unauthenticated", (await fetch(`${baseUrl}/media/${privateMediaId}`)).status, 401);
    const response = await fetch(`${baseUrl}/media/${privateMediaId}`, { headers: { cookie: cookies.content } });
    expectStatus("PRIVATE media authorized", response.status, 200);
    if (response.headers.get("cache-control") !== "private, no-store") throw new Error("PRIVATE media cache policy mismatch");
    console.log("PASS PRIVATE media headers");
  }

  const privateSlug = process.env.R1_2_PRIVATE_NEWS_SLUG;
  if (privateSlug) {
    expectStatus("unpublished public detail is uniform 404", (await fetch(`${baseUrl}/api/content/posts/${privateSlug}`)).status, 404);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
