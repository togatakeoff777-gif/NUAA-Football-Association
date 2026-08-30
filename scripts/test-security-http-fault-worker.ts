export {};

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const baseUrl = process.env.SECURITY_HTTP_BASE_URL;
  if (!baseUrl) throw new Error("SECURITY_HTTP_BASE_URL is required.");
  const origin = "https://nuaafa.cn";
  const requests = [
    ["member login database failure", "/api/referees/login", { publicCode: "SMOKE-R1-001", password: "not-a-secret" }],
    ["admin login database failure", "/api/referees/admin/login", { username: "smoke-referee", password: "not-a-secret" }],
    ["public admission database failure", "/api/referees/admission-applications", { name: "Fault Applicant", phone: "13999998888" }],
    ["legacy authorization database failure", "/api/referees/admin/competitions", {}],
  ] as const;
  for (const [label, pathname, body] of requests) {
    const response = await fetch(`${baseUrl}${pathname}`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/json",
        "x-real-ip": "203.0.113.200",
        ...(label.startsWith("legacy") ? { cookie: "nuaa_referee_admin=fault-session-token" } : {}),
      },
      body: JSON.stringify(body),
    });
    const text = await response.text();
    assert(response.status === 500, `${label}: expected 500, received ${response.status}: ${text}`);
    if (label !== "public admission database failure") {
      assert(text.includes("INTERNAL_ERROR"), `${label}: missing fixed INTERNAL_ERROR code.`);
    } else {
      assert(text === '{"error":"申请提交失败，请稍后重试。"}', `${label}: frozen fixed error contract changed.`);
    }
    for (const forbidden of ["Prisma", "SQLite", "SQLITE", "table", "AdminSession", "LoginAttempt", "not-a-directory", "fault.db", "stack", "password", "cookie", "Authorization"]) {
      assert(!text.includes(forbidden), `${label}: leaked ${forbidden}.`);
    }
    console.log(`PASS ${label}: safe 500`);
  }
  console.log("F-004 real HTTP database-failure leakage regressions passed.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
