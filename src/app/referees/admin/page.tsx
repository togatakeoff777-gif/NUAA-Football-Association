import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { ApplicationStatus } from "@/generated/prisma/client";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminRefereePanel } from "@/components/referees/mvp/admin-referee-panel";
import { getAdminSession } from "@/lib/referee-auth";
import { applicationStatusLabels, appointmentStatusLabels, formatRefereeDateTime, parsePreferredPositions } from "@/lib/referee-presenters";
import { getPositionTemplate } from "@/lib/referee-roles";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "裁判管理后台", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const allowedStatuses = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"] as const;

export default async function RefereeAdminPage({ searchParams }: { searchParams: Promise<{ competition?: string; match?: string; status?: string }> }) {
  if (!(await getAdminSession())) redirect("/referees/admin/login");
  const query = await searchParams;
  const status = allowedStatuses.includes(query.status as ApplicationStatus) ? query.status as ApplicationStatus : undefined;
  const competitions = await prisma.competition.findMany({ orderBy: [{ year: "desc" }, { name: "asc" }] });
  const matchOptions = await prisma.match.findMany({ include: { competition: true, homeTeam: true, awayTeam: true }, orderBy: { kickoff: "desc" } });
  const applications = await prisma.refereeApplication.findMany({
    where: { ...(status ? { status } : {}), ...(query.match ? { matchId: query.match } : {}), ...(query.competition ? { match: { competitionId: query.competition } } : {}) },
    include: { referee: true, match: { include: { competition: true, homeTeam: true, awayTeam: true } } },
    orderBy: { createdAt: "desc" },
  });
  const editableMatches = await prisma.match.findMany({
    where: { status: "SCHEDULED" },
    include: { competition: true, homeTeam: true, awayTeam: true, appointment: { include: { positions: true } } },
    orderBy: { kickoff: "asc" },
  });
  const referees = await prisma.referee.findMany({ where: { status: "ACTIVE" }, orderBy: { publicCode: "asc" } });
  const appointmentHistory = await prisma.refereeAppointment.findMany({
    include: { match: { include: { competition: true, homeTeam: true, awayTeam: true } } },
    orderBy: { updatedAt: "desc" },
  });

  return <><SiteHeader /><main className="functional-page" id="main-content"><section className="functional-hero"><div className="detail-shell"><p>REFEREE OPERATIONS</p><h1>裁判管理后台</h1><p>审核执裁意向、配置岗位、保存草稿、发布或撤回选派，并保留操作历史。</p></div></section><section className="functional-section referee-admin-page"><div className="detail-shell"><form className="referee-admin-filters" method="get"><label><span>赛事</span><select defaultValue={query.competition ?? ""} name="competition"><option value="">全部赛事</option>{competitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><label><span>比赛</span><select defaultValue={query.match ?? ""} name="match"><option value="">全部比赛</option>{matchOptions.map((item) => <option key={item.id} value={item.id}>{item.homeTeam.name} vs {item.awayTeam.name}</option>)}</select></label><label><span>报名状态</span><select defaultValue={status ?? ""} name="status"><option value="">全部状态</option>{allowedStatuses.map((value) => <option key={value} value={value}>{applicationStatusLabels[value]}</option>)}</select></label><button type="submit">应用筛选</button></form><AdminRefereePanel applications={applications.map((item) => ({ id: item.id, referee: `${item.referee.publicCode} · ${item.referee.name}`, match: `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`, competition: item.match.competition.name, status: applicationStatusLabels[item.status], preferred: parsePreferredPositions(item.preferredPositions).map((key) => getPositionTemplate(item.match.competition.format).find((position) => position.key === key)?.label ?? key).join(" / "), note: item.note, createdAt: formatRefereeDateTime(item.createdAt) }))} matches={editableMatches.map((item) => ({ id: item.id, label: `${item.competition.name} · ${item.homeTeam.name} vs ${item.awayTeam.name}`, status: item.appointment ? appointmentStatusLabels[item.appointment.status] : "未建草稿", publicationNote: item.appointment?.publicationNote ?? "", format: item.competition.format, template: getPositionTemplate(item.competition.format).map(({ key, label }) => ({ key, label })), positions: item.appointment?.positions.map(({ key, refereeId }) => ({ key, refereeId })) ?? [] }))} referees={referees.map((item) => ({ id: item.id, label: `${item.publicCode} · ${item.name}`, elevenASide: item.elevenASide, futsal: item.futsal }))} history={appointmentHistory.map((item) => ({ id: item.id, match: `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`, competition: item.match.competition.name, status: appointmentStatusLabels[item.status], updatedAt: formatRefereeDateTime(item.updatedAt) }))} /></div></section></main><SiteFooter /></>;
}
