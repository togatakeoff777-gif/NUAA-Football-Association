import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  createRefereeApplication,
  publishAppointment,
  RefereeServiceError,
  reviewApplication,
  saveAppointmentDraft,
  withdrawAppointment,
} from "../src/lib/referee-service";

const url = process.env.DATABASE_URL ?? "file:./prisma/dev.db";
const verifier = new PrismaClient({ adapter: new PrismaLibSql({ url }) });

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const match = await verifier.match.findUniqueOrThrow({
    where: { slug: "local-referee-mvp-open-match" },
  });
  const referee = await verifier.referee.findUniqueOrThrow({ where: { publicCode: "R-001" } });

  await verifier.refereeApplication.deleteMany({ where: { matchId: match.id, refereeId: referee.id } });
  await verifier.refereeAppointment.deleteMany({ where: { matchId: match.id } });

  const application = await createRefereeApplication({
    matchId: match.id,
    refereeId: referee.id,
    preferredPositions: ["REFEREE"],
    note: "自动化闭环测试",
  });
  const persisted = await verifier.refereeApplication.findUnique({ where: { id: application.id } });
  assert(persisted?.note === "自动化闭环测试", "报名未持久化到 SQLite。" );

  let duplicateBlocked = false;
  try {
    await createRefereeApplication({ matchId: match.id, refereeId: referee.id, preferredPositions: ["REFEREE"] });
  } catch (error) {
    duplicateBlocked = error instanceof RefereeServiceError && error.status === 409;
  }
  assert(duplicateBlocked, "重复报名未被阻止。" );

  await reviewApplication(application.id, "APPROVED", "自动化测试审核");
  const referees = await verifier.referee.findMany({
    where: { status: "ACTIVE", elevenASide: true },
    orderBy: { publicCode: "asc" },
    take: 5,
  });
  assert(referees.length === 5, "岗位测试需要五名裁判员。" );
  await saveAppointmentDraft({
    matchId: match.id,
    publicationNote: "自动化闭环测试选派",
    positions: [
      { key: "REFEREE", refereeId: referees[0].id },
      { key: "ASSISTANT_REFEREE_1", refereeId: referees[1].id },
      { key: "ASSISTANT_REFEREE_2", refereeId: referees[2].id },
      { key: "FOURTH_OFFICIAL", refereeId: referees[3].id },
      { key: "RESERVE_ASSISTANT_REFEREE", refereeId: referees[4].id },
    ],
  });
  const draft = await verifier.refereeAppointment.findUnique({ where: { matchId: match.id }, include: { positions: true } });
  assert(draft?.status === "DRAFT" && draft.positions.length === 5, "选派草稿未正确保存。" );

  await publishAppointment(match.id);
  const publicCount = await verifier.refereeAppointment.count({ where: { matchId: match.id, status: "PUBLISHED" } });
  assert(publicCount === 1, "发布后公开查询不可见。" );

  await withdrawAppointment(match.id);
  const visibleAfterWithdrawal = await verifier.refereeAppointment.count({ where: { matchId: match.id, status: "PUBLISHED" } });
  const retainedHistory = await verifier.refereeAppointment.findUnique({ where: { matchId: match.id } });
  assert(visibleAfterWithdrawal === 0, "撤回后公开查询仍可见。" );
  assert(retainedHistory?.status === "WITHDRAWN" && retainedHistory.withdrawnAt, "撤回历史未保留。" );

  console.log(JSON.stringify({
    openMatchSeeded: true,
    applicationPersisted: true,
    duplicateBlocked,
    applicationReviewed: true,
    draftSaved: true,
    publishedVisible: true,
    withdrawnHidden: true,
    withdrawalHistoryRetained: true,
  }, null, 2));
}

main()
  .then(() => verifier.$disconnect())
  .catch(async (error) => {
    console.error(error instanceof Error ? error.message : "Referee flow test failed.");
    await verifier.$disconnect();
    process.exit(1);
  });
