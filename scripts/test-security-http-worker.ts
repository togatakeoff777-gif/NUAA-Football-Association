import { createHash } from "node:crypto";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required.`);
  return value;
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

const baseUrl = required("SECURITY_HTTP_BASE_URL");
const password = required("SECURITY_HTTP_PASSWORD");
const matchId = required("SECURITY_HTTP_MATCH_ID");
const refereeId = required("SECURITY_HTTP_REFEREE_ID");
const mutationOrigin = "https://nuaafa.cn";

async function expectStatus(label: string, response: Response, expected: number) {
  if (response.status !== expected) {
    throw new Error(`${label}: expected ${expected}, received ${response.status}: ${await response.text()}`);
  }
  console.log(`PASS ${label}: ${expected}`);
  return response;
}

async function loginMember() {
  const response = await expectStatus("required member login", await fetch(`${baseUrl}/api/referees/login`, {
    method: "POST",
    headers: { origin: mutationOrigin, "content-type": "application/json", "x-real-ip": "203.0.113.10" },
    body: JSON.stringify({ publicCode: "SMOKE-R1-001", password }),
  }), 200);
  const body = await response.json() as { mustChangePassword?: boolean };
  assert(body.mustChangePassword === true, "Required member login did not report mustChangePassword.");
  const cookie = response.headers.get("set-cookie")?.match(/nuaa_referee_member=[^;]+/u)?.[0];
  assert(cookie, "Required member login did not set a cookie.");
  return cookie;
}

async function memberMutation(pathname: string, method: string, cookie: string, body: unknown) {
  return fetch(`${baseUrl}${pathname}`, {
    method,
    headers: { origin: mutationOrigin, cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
    redirect: "manual",
  });
}

async function expectMemberGate(label: string, response: Response) {
  await expectStatus(label, response, 403);
  const body = await response.json() as { code?: string };
  assert(body.code === "MEMBER_PASSWORD_CHANGE_REQUIRED", `${label}: canonical code mismatch.`);
}

async function main() {
  process.env.DATABASE_URL = `file:${required("SECURITY_HTTP_DATABASE_PATH").replaceAll("\\", "/")}`;
  const { prisma } = await import("../src/lib/prisma");
  try {
    const memberCookie = await loginMember();
    const snapshot = async () => JSON.stringify({
      referee: await prisma.referee.findUniqueOrThrow({ where: { id: refereeId }, select: { phone: true, qq: true, mustChangePassword: true, updatedAt: true } }),
      availability: await prisma.refereeAvailability.count({ where: { refereeId } }),
      applications: await prisma.refereeApplication.count({ where: { refereeId } }),
      acknowledgements: await prisma.appointmentAcknowledgement.count({ where: { refereeId } }),
      conflicts: await prisma.appointmentConflictReport.count({ where: { refereeId } }),
    });
    const beforeBlocked = await snapshot();
    await expectMemberGate("member profile blocked", await memberMutation("/api/referees/account/profile", "PATCH", memberCookie, { phone: "13900000000", qq: "99887766" }));
    await expectMemberGate("member availability create blocked", await memberMutation("/api/referees/availability", "POST", memberCookie, { startAt: "2030-01-01T10:00", endAt: "2030-01-01T12:00", kind: "AVAILABLE", note: "blocked" }));
    await expectMemberGate("member availability delete blocked", await memberMutation("/api/referees/availability", "DELETE", memberCookie, { id: "missing" }));
    await expectMemberGate("member application create blocked", await memberMutation("/api/referees/applications", "POST", memberCookie, { matchId, preferredPositions: ["REFEREE"], note: "blocked" }));
    await expectMemberGate("member application withdraw blocked", await memberMutation("/api/referees/applications/missing", "DELETE", memberCookie, {}));
    await expectMemberGate("member appointment acknowledge blocked", await memberMutation("/api/referees/appointments/missing/acknowledge", "POST", memberCookie, {}));
    await expectMemberGate("member appointment conflict blocked", await memberMutation("/api/referees/appointments/missing/conflict", "POST", memberCookie, { reason: "blocked" }));
    assert(await snapshot() === beforeBlocked, "Blocked member business APIs changed business state.");

    const passwordAllowed = await memberMutation("/api/referees/account/password", "POST", memberCookie, { currentPassword: "wrong-password", newPassword: "Security-R1-New-Password-2026" });
    assert(passwordAllowed.status === 401, `Password-change allow-path returned ${passwordAllowed.status}, expected typed 401 rather than required-password 403.`);
    await prisma.referee.update({ where: { id: refereeId }, data: { mustChangePassword: false } });
    await expectStatus("member malformed JSON typed error", await fetch(`${baseUrl}/api/referees/account/profile`, {
      method: "PATCH",
      headers: { origin: mutationOrigin, cookie: memberCookie, "content-type": "application/json" },
      body: "{",
    }), 400);
    await expectStatus("member normal business path after password gate", await memberMutation("/api/referees/account/profile", "PATCH", memberCookie, { phone: "13900000000", qq: "99887766" }), 200);

    const adminLogin = await expectStatus("referee admin login", await fetch(`${baseUrl}/api/referees/admin/login`, {
      method: "POST",
      headers: { origin: mutationOrigin, "content-type": "application/json", "x-real-ip": "203.0.113.11" },
      body: JSON.stringify({ username: "smoke-referee", password }),
    }), 200);
    const adminCookie = adminLogin.headers.get("set-cookie")?.match(/nuaa_referee_admin=[^;]+/u)?.[0];
    assert(adminCookie, "Referee admin login did not set a cookie.");

    const appointment = await prisma.refereeAppointment.create({
      data: {
        matchId,
        status: "COMPLETED",
        revision: 1,
        completedAt: new Date("2030-01-01T00:00:00Z"),
        positions: { create: { key: "REFEREE", label: "裁判员", sortOrder: 10, slot: 1, refereeId } },
      },
    });
    const terminalSnapshot = async () => JSON.stringify(await prisma.refereeAppointment.findUniqueOrThrow({
      where: { id: appointment.id },
      include: { positions: true, versions: true },
    }));
    const beforeTerminal = await terminalSnapshot();
    await expectStatus("completed direct draft API blocked", await fetch(`${baseUrl}/api/referees/admin/appointments/${matchId}`, {
      method: "PUT",
      headers: { origin: mutationOrigin, cookie: adminCookie, "content-type": "application/json" },
      body: JSON.stringify({ positions: [{ key: "REFEREE", slot: 1, refereeId }], publicationNote: "blocked", changeReason: "blocked" }),
    }), 409);
    await expectStatus("completed direct publish API blocked", await fetch(`${baseUrl}/api/referees/admin/appointments/${matchId}`, {
      method: "POST",
      headers: { origin: mutationOrigin, cookie: adminCookie, "content-type": "application/json" },
      body: JSON.stringify({ action: "publish", reason: "blocked" }),
    }), 409);
    assert(await terminalSnapshot() === beforeTerminal, "Direct terminal appointment API changed row/version/timestamps.");

    const admissionHeaders = { origin: mutationOrigin, "content-type": "application/json", "x-real-ip": "203.0.113.77" };
    const admissionBody = { name: "HTTP Security Applicant", studentId: "sec-http-1", phone: "13911112222", qq: "76543210" };
    await expectStatus("public admission create", await fetch(`${baseUrl}/api/referees/admission-applications`, { method: "POST", headers: admissionHeaders, body: JSON.stringify(admissionBody) }), 201);
    const beforeDuplicate = await prisma.refereeAdmissionApplication.count();
    await expectStatus("public admission duplicate", await fetch(`${baseUrl}/api/referees/admission-applications`, { method: "POST", headers: admissionHeaders, body: JSON.stringify(admissionBody) }), 409);
    assert(await prisma.refereeAdmissionApplication.count() === beforeDuplicate, "HTTP duplicate created a business row.");
    const blockedAddress = "203.0.113.78";
    const blockedKey = createHash("sha256").update(`referee-admission:${blockedAddress}`).digest("hex");
    await prisma.loginAttempt.create({ data: { scope: "referee-admission-address", keyHash: blockedKey, failures: 30, blockedUntil: new Date(Date.now() + 900_000) } });
    const beforeRate = await prisma.refereeAdmissionApplication.count();
    await expectStatus("public admission rate limit", await fetch(`${baseUrl}/api/referees/admission-applications`, {
      method: "POST",
      headers: { ...admissionHeaders, "x-real-ip": blockedAddress },
      body: JSON.stringify({ name: "HTTP Rate Applicant", phone: "13911113333" }),
    }), 429);
    assert(await prisma.refereeAdmissionApplication.count() === beforeRate, "HTTP rate limit created a business row.");

    for (let attempt = 1; attempt <= 6; attempt += 1) {
      const response = await fetch(`${baseUrl}/api/referees/login`, {
        method: "POST",
        headers: {
          origin: mutationOrigin,
          "content-type": "application/json",
          "x-real-ip": "203.0.113.90",
          "x-forwarded-for": `${attempt}.${attempt}.${attempt}.${attempt}`,
        },
        body: JSON.stringify({ publicCode: "SMOKE-R1-001", password: "wrong-password" }),
      });
      assert(response.status === (attempt === 6 ? 429 : 401), `Spoof attempt ${attempt} returned ${response.status}.`);
    }
    console.log("PASS rotating XFF cannot evade login rate-limit identity: 429");
    await expectStatus("member logout allow-path", await memberMutation("/api/referees/logout", "POST", memberCookie, {}), 200);
    console.log("F-001/F-003/F-007/F-011 direct HTTP security regressions passed.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : error);
  process.exitCode = 1;
});
