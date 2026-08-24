import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const smokeRoot = process.argv[2];
  const baseUrl = process.argv[3] ?? "http://127.0.0.1:3102";
  const mutationOrigin = process.env.R1_3A_SMOKE_ORIGIN ?? baseUrl;
  if (!smokeRoot || !path.isAbsolute(smokeRoot)) {
    throw new Error("An absolute isolated smoke root is required.");
  }
  process.env.DATABASE_URL = `file:${path.join(smokeRoot, "smoke.db").replaceAll("\\", "/")}`;
  const { prisma } = await import("../src/lib/prisma");
  const service = await import("../src/lib/referee-service");
  const oldPassword = "Smoke-Password-2026!";
  const newPassword = "Smoke-New-Password-2026!";
  try {
    const referee = await prisma.referee.findUniqueOrThrow({ where: { publicCode: "SMOKE-R1-001" } });
    if (referee.mustChangePassword) {
      await service.changeRefereePassword(referee.id, oldPassword, newPassword);
    }
    const changed = await prisma.referee.findUniqueOrThrow({ where: { id: referee.id } });
    assert(!changed.mustChangePassword, "Password change did not clear mustChangePassword.");

    const login = async (password: string) => fetch(`${baseUrl}/api/referees/login`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: mutationOrigin },
      body: JSON.stringify({ publicCode: "SMOKE-R1-001", password }),
      redirect: "manual",
    });
    assert((await login(oldPassword)).status === 401, "Old initial password remained valid.");
    const loginResponse = await login(newPassword);
    assert(loginResponse.status === 200, `New password login failed with ${loginResponse.status}.`);
    const cookie = loginResponse.headers.get("set-cookie")?.match(/nuaa_referee_member=[^;]+/)?.[0];
    assert(cookie, "Referee login did not set member cookie.");

    const workspace = await fetch(`${baseUrl}/referees/workspace`, {
      headers: { cookie },
      redirect: "manual",
    });
    assert(workspace.status === 200, `Changed-password workspace returned ${workspace.status}.`);
    const openMatch = await prisma.match.findUniqueOrThrow({ where: { slug: "r1-3a-smoke-open-match" } });
    await prisma.$transaction([
      prisma.match.update({ where: { id: openMatch.id }, data: { isTestData: false } }),
      prisma.competition.update({ where: { id: openMatch.competitionId }, data: { isTestData: false } }),
    ]);
    const matchPage = await fetch(`${baseUrl}/referees/open-matches/${openMatch.slug}`, {
      headers: { cookie },
    });
    const matchHtml = await matchPage.text();
    assert(
      matchPage.status === 200 &&
        matchHtml.includes("尚未获得正式选派资格"),
      "NOT_ELIGIBLE match page did not expose the fail-closed eligibility message.",
    );
    const forcedApplication = await fetch(`${baseUrl}/api/referees/applications`, {
      method: "POST",
      headers: { cookie, origin: mutationOrigin, "content-type": "application/json" },
      body: JSON.stringify({ matchId: openMatch.id, preferredPositions: ["REFEREE"], note: "强制 API smoke" }),
    });
    const forcedBody = await forcedApplication.json() as { error?: string };
    assert(
      forcedApplication.status === 403 && forcedBody.error?.includes("尚未获得正式选派资格"),
      `NOT_ELIGIBLE forced API returned ${forcedApplication.status}/${forcedBody.error ?? "no error"}.`,
    );

    console.log(JSON.stringify({
      passwordChangeCompletedInIsolatedDatabase: true,
      oldPasswordRejected: true,
      newPasswordLogin: true,
      workspaceAfterPasswordChange: true,
      notEligibleUiFailClosed: true,
      notEligibleForcedApiStatus: forcedApplication.status,
    }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : "R1-3A HTTP smoke failed.");
  process.exit(1);
});
