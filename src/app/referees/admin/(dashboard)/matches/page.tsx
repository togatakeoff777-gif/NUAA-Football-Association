import Link from "next/link";

import { AdminMatchNavigation } from "@/components/referees/admin/admin-match-navigation";
import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatusBadge, appointmentStatusLabels, matchStatusLabels } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { formatRefereeDateTime } from "@/lib/referee-presenters";

export default async function AdminMatchesPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const competitionId = typeof query.competition === "string" ? query.competition : "";
  const rawMatchStatus = typeof query.matchStatus === "string" ? query.matchStatus : "";
  const matchStatus = ["SCHEDULED", "COMPLETED", "CANCELLED"].includes(rawMatchStatus) ? rawMatchStatus : "";
  const rawAppointmentStatus = typeof query.appointmentStatus === "string" ? query.appointmentStatus : "";
  const appointmentStatus = ["NONE", "DRAFT", "PUBLISHED", "WITHDRAWN", "COMPLETED", "CANCELLED"].includes(rawAppointmentStatus) ? rawAppointmentStatus : "";
  const date = typeof query.date === "string" ? query.date : "";
  const dateStart = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00+08:00`) : null;
  const [competitions, matches] = await Promise.all([
    prisma.competition.findMany({ select: { id: true, name: true }, orderBy: [{ year: "desc" }, { name: "asc" }] }),
    prisma.match.findMany({
      where: {
        ...(competitionId ? { competitionId } : {}),
        ...(matchStatus ? { status: matchStatus as "SCHEDULED" | "COMPLETED" | "CANCELLED" } : {}),
        ...(dateStart ? { kickoff: { gte: dateStart, lt: new Date(dateStart.getTime() + 86400000) } } : {}),
        ...(appointmentStatus === "NONE" ? { appointment: null } : appointmentStatus ? { appointment: { status: appointmentStatus as "DRAFT" | "PUBLISHED" | "WITHDRAWN" | "COMPLETED" | "CANCELLED" } } : {}),
      },
      select: { id: true, kickoff: true, venue: true, stage: true, status: true, competition: { select: { name: true } }, homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } }, appointment: { select: { status: true } } },
      orderBy: { kickoff: "desc" }, take: 250,
    }),
  ]);
  return <>
    <AdminPageHeader eyebrow="MATCHES & APPOINTMENTS" title="比赛与选派" description="先从比赛列表进入具体场次，再维护岗位与正式选派。" actions={<><Link className="admin-button admin-button-secondary" href="/referees/admin/matches/competitions">赛事管理</Link><Link className="admin-button" href="/referees/admin/matches/new">+ 新建比赛</Link></>} />
    <AdminMatchNavigation active="matches" />
    <form className="admin-filter-bar">
      <label><span>赛事</span><select defaultValue={competitionId} name="competition"><option value="">全部赛事</option>{competitions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label><span>日期</span><input defaultValue={date} name="date" type="date" /></label>
      <label><span>比赛状态</span><select defaultValue={matchStatus} name="matchStatus"><option value="">全部状态</option>{Object.entries(matchStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>选派状态</span><select defaultValue={appointmentStatus} name="appointmentStatus"><option value="">全部状态</option>{Object.entries(appointmentStatusLabels).map(([value,label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <button className="admin-button admin-button-secondary" type="submit">筛选</button>
      <Link className="admin-filter-reset" href="/referees/admin/matches">清除</Link>
    </form>
    <AdminPanel title={`比赛列表 · ${matches.length}`} description="默认按开球时间倒序，最多显示 250 场。">
      {matches.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>时间</th><th>比赛</th><th>赛事</th><th>场地</th><th>比赛状态</th><th>选派状态</th><th>操作</th></tr></thead><tbody>{matches.map((match) => <tr key={match.id}><td>{formatRefereeDateTime(match.kickoff)}</td><td><strong>{match.homeTeam.name} vs {match.awayTeam.name}</strong><small>{match.stage}</small></td><td>{match.competition.name}</td><td>{match.venue}</td><td><AdminStatusBadge status={match.status} label={matchStatusLabels[match.status]} /></td><td><AdminStatusBadge status={match.appointment?.status ?? "NONE"} label={appointmentStatusLabels[match.appointment?.status ?? "NONE"]} /></td><td><div className="admin-table-actions"><Link className="admin-row-action-primary" href={`/referees/admin/matches/${match.id}`}>{match.appointment?.status === "PUBLISHED" ? "查看选派" : "查看 / 选派"}</Link><Link href={`/referees/admin/matches/${match.id}/edit`}>编辑</Link></div></td></tr>)}</tbody></table></div> : <AdminEmptyState title="没有符合条件的比赛" description="调整筛选条件，或创建一场新比赛。" />}
    </AdminPanel>
  </>;
}
