import Link from "next/link";

import { AdminEmptyState, AdminPageHeader, AdminPanel, AdminStatusBadge, appointmentStatusLabels } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { getPositionTemplate } from "@/lib/referee-roles";

function shanghaiDayRange(now = new Date()) {
  const shifted = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  const start = new Date(Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - 8 * 60 * 60 * 1000);
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

const auditActionLabels: Record<string, string> = {
  APPOINTMENT_PUBLISHED: "发布选派",
  APPOINTMENT_REPUBLISHED: "重新发布选派",
  APPOINTMENT_WITHDRAWN: "撤回选派",
  APPOINTMENT_COMPLETED: "完成选派",
  APPOINTMENT_CANCELLED: "取消选派",
  REFEREE_ACCOUNT_CREATED: "创建裁判员",
  REFEREE_ACCOUNT_UPDATED: "更新裁判员",
  MATCH_CREATED: "创建比赛",
  MATCH_UPDATED: "更新比赛",
  APPOINTMENT_CONFLICT_REPORT_RESOLVED: "处理冲突报告",
};

export default async function RefereeAdminDashboard() {
  const { start, end } = shanghaiDayRange();
  const [
    todayMatches,
    awaitingAssignment,
    publishedCount,
    pendingReportCount,
    pendingReports,
    upcomingMatches,
    publishedAppointments,
    recentAudit,
    adminAccounts,
    referees,
  ] = await Promise.all([
    prisma.match.findMany({
      where: { kickoff: { gte: start, lt: end }, status: { not: "CANCELLED" } },
      select: {
        id: true, kickoff: true, venue: true,
        competition: { select: { format: true } },
        homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } },
        positionRequirements: { select: { count: true } },
        appointment: {
          select: {
            id: true, status: true,
            positions: { select: { refereeId: true } },
            versions: {
              where: { status: "PUBLISHED" }, orderBy: { revision: "desc" }, take: 1,
              select: { acknowledgements: { select: { refereeId: true } } },
            },
          },
        },
      },
      orderBy: { kickoff: "asc" },
    }),
    prisma.match.count({
      where: {
        status: "SCHEDULED",
        OR: [{ appointment: null }, { appointment: { status: { in: ["DRAFT", "WITHDRAWN"] } } }],
      },
    }),
    prisma.refereeAppointment.count({ where: { status: "PUBLISHED" } }),
    prisma.appointmentConflictReport.count({ where: { status: "PENDING" } }),
    prisma.appointmentConflictReport.findMany({
      where: { status: "PENDING" },
      select: {
        id: true, reason: true, reportedAt: true,
        referee: { select: { id: true, publicCode: true, name: true } },
        appointment: {
          select: {
            matchId: true,
            match: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
            positions: { select: { refereeId: true, label: true } },
          },
        },
      },
      orderBy: { reportedAt: "asc" },
      take: 6,
    }),
    prisma.match.findMany({
      where: { status: "SCHEDULED", kickoff: { gte: new Date() } },
      select: {
        id: true,
        competition: { select: { format: true } },
        homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } },
        positionRequirements: { select: { count: true } },
        appointment: { select: { id: true, status: true, positions: { select: { refereeId: true } } } },
      },
      orderBy: { kickoff: "asc" },
      take: 12,
    }),
    prisma.refereeAppointment.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true, matchId: true,
        match: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } },
        positions: { where: { refereeId: { not: null } }, select: { refereeId: true } },
        versions: {
          where: { status: "PUBLISHED" }, orderBy: { revision: "desc" }, take: 1,
          select: { acknowledgements: { select: { refereeId: true } } },
        },
      },
      orderBy: { publishedAt: "desc" },
      take: 12,
    }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
    prisma.adminAccount.findMany({ select: { id: true, displayName: true } }),
    prisma.referee.findMany({ select: { id: true, name: true } }),
  ]);

  const incompleteMatches = upcomingMatches.filter((match) => {
    const required = match.positionRequirements.length
      ? match.positionRequirements.reduce((sum, item) => sum + item.count, 0)
      : getPositionTemplate(match.competition.format).length;
    const assigned = match.appointment?.positions.filter((item) => item.refereeId).length ?? 0;
    return !match.appointment || assigned < required || match.appointment.status !== "PUBLISHED";
  }).slice(0, 5);
  const unacknowledged = publishedAppointments.map((appointment) => {
    const appointed = new Set(appointment.positions.flatMap((item) => item.refereeId ? [item.refereeId] : []));
    const acknowledged = new Set(appointment.versions[0]?.acknowledgements.map((item) => item.refereeId) ?? []);
    return { appointment, missing: [...appointed].filter((id) => !acknowledged.has(id)).length, total: appointed.size };
  }).filter((item) => item.missing > 0).slice(0, 5);
  const actorLabels = new Map([
    ...adminAccounts.map((item) => [item.id, item.displayName] as const),
    ...referees.map((item) => [item.id, item.name] as const),
  ]);

  return (
    <>
      <AdminPageHeader eyebrow="OVERVIEW" title="概览" description="聚焦今天需要处理的比赛、选派确认与冲突反馈。" />
      <section className="admin-kpi-grid" aria-label="后台关键指标">
        <article className="admin-kpi-card"><span>今日比赛</span><strong>{todayMatches.length}</strong><small>Asia/Shanghai</small></article>
        <article className="admin-kpi-card"><span>待选派</span><strong>{awaitingAssignment}</strong><small>未发布或仍为草稿</small></article>
        <article className="admin-kpi-card"><span>已发布</span><strong>{publishedCount}</strong><small>当前有效正式选派</small></article>
        <article className="admin-kpi-card"><span>待处理冲突报告</span><strong>{pendingReportCount}</strong><small>需要管理员反馈</small></article>
      </section>
      <div className="admin-dashboard-grid">
        <div className="admin-dashboard-stack">
          <AdminPanel title="待处理事项" description="按优先级汇总需要进入业务页处理的项目。">
            <div className="admin-task-list">
              {pendingReports.map((report) => {
                const position = report.appointment.positions.find((item) => item.refereeId === report.referee.id)?.label;
                return <article className="admin-task-item" key={report.id}><i /><div><strong>{report.referee.name}提交了冲突报告</strong><p>{report.appointment.match.homeTeam.name} vs {report.appointment.match.awayTeam.name}{position ? ` · ${position}` : ""} · {report.reason}</p></div><Link href={`/referees/admin/conflicts?status=PENDING&focus=${report.id}`}>查看报告</Link></article>;
              })}
              {incompleteMatches.map((match) => <article className="admin-task-item" key={match.id}><i /><div><strong>{match.homeTeam.name} vs {match.awayTeam.name} 尚未完成选派</strong><p>{match.appointment ? appointmentStatusLabels[match.appointment.status] : "尚未建立选派草稿"}</p></div><Link href={`/referees/admin/matches/${match.id}`}>立即选派</Link></article>)}
              {unacknowledged.map(({ appointment, missing, total }) => <article className="admin-task-item" key={appointment.id}><i /><div><strong>{appointment.match.homeTeam.name} vs {appointment.match.awayTeam.name} 尚有 {missing} 人未确认</strong><p>当前确认 {total - missing} / {total}</p></div><Link href={`/referees/admin/matches/${appointment.matchId}`}>查看选派</Link></article>)}
              {!pendingReports.length && !incompleteMatches.length && !unacknowledged.length ? <AdminEmptyState title="当前没有待处理事项" description="新的冲突报告、未完成选派和待确认任务会出现在这里。" /> : null}
            </div>
          </AdminPanel>
          <AdminPanel title="今日比赛" description="比赛时间统一按 Asia/Shanghai 展示。">
            {todayMatches.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>时间</th><th>比赛</th><th>场地</th><th>选派状态</th><th>裁判组</th><th>确认知悉</th><th>操作</th></tr></thead><tbody>{todayMatches.map((match) => {
              const required = match.positionRequirements.length
                ? match.positionRequirements.reduce((sum, item) => sum + item.count, 0)
                : getPositionTemplate(match.competition.format).length;
              const assigned = match.appointment?.positions.filter((item) => item.refereeId).length ?? 0;
              const acknowledged = match.appointment?.versions[0]?.acknowledgements.length ?? 0;
              return <tr key={match.id}><td>{formatRefereeDateTime(match.kickoff).slice(11)}</td><td><strong>{match.homeTeam.name} vs {match.awayTeam.name}</strong></td><td>{match.venue}</td><td><AdminStatusBadge status={match.appointment?.status ?? "NONE"} label={appointmentStatusLabels[match.appointment?.status ?? "NONE"]} /></td><td>{assigned}/{required}</td><td>{acknowledged}/{assigned}</td><td><div className="admin-table-actions"><Link href={`/referees/admin/matches/${match.id}`}>查看选派</Link></div></td></tr>;
            })}</tbody></table></div> : <AdminEmptyState title="今天没有比赛" description="今日赛程为空。" />}
          </AdminPanel>
        </div>
        <AdminPanel className="admin-recent-panel" title="最近操作" description="最新 8 条后台与裁判员业务留痕。" actions={<Link className="admin-button admin-button-quiet" href="/referees/admin/audit-log">全部日志</Link>}>
          <div className="admin-activity-list">{recentAudit.map((item) => <article className="admin-activity-item" key={item.id}><time>{formatRefereeDateTime(item.createdAt)}</time><div><strong>{auditActionLabels[item.action] ?? item.action}</strong><p>{actorLabels.get(item.actorId ?? "") ?? (item.actorType === "ADMIN" ? "兼容管理员" : "系统")} · {item.summary}</p></div></article>)}</div>
        </AdminPanel>
      </div>
    </>
  );
}
