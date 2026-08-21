import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminAppointmentEditor, type AppointmentMatchView } from "@/components/referees/admin/admin-appointment-editor";
import { AdminStatusBadge, appointmentStatusLabels, matchStatusLabels } from "@/components/referees/admin/admin-ui";
import { adminRefereeSelect } from "@/lib/referee-dto";
import { detectAppointmentWarnings } from "@/lib/referee-conflicts";
import { applicationStatusLabels, formatRefereeDateTime, parsePreferredPositions } from "@/lib/referee-presenters";
import { getPositionTemplate } from "@/lib/referee-roles";
import { getCompletedRefereeStatistics } from "@/lib/referee-r1-service";
import { prisma } from "@/lib/prisma";

export default async function AdminMatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [match, referees, statistics] = await Promise.all([
    prisma.match.findUnique({
      where: { id },
      include: {
        competition: true, homeTeam: true, awayTeam: true,
        positionRequirements: { orderBy: { sortOrder: "asc" } },
        applications: { include: { referee: { select: { publicCode: true, name: true } } }, orderBy: { createdAt: "desc" } },
        appointment: {
          include: {
            positions: { orderBy: [{ sortOrder: "asc" }, { slot: "asc" }] },
            versions: { include: { createdByAdmin: { select: { displayName: true, username: true } }, acknowledgements: { select: { refereeId: true } } }, orderBy: { revision: "desc" } },
          },
        },
      },
    }),
    prisma.referee.findMany({ where: { status: "ACTIVE" }, select: adminRefereeSelect, orderBy: { publicCode: "asc" } }),
    getCompletedRefereeStatistics(),
  ]);
  if (!match) notFound();
  const configured = match.positionRequirements.length ? match.positionRequirements : getPositionTemplate(match.competition.format).map((position) => ({ ...position, count: 1 }));
  const template = configured.flatMap((position) => Array.from({ length: position.count }, (_, index) => ({ key: position.key, label: position.label, slot: index + 1 })));
  const currentPositions = match.appointment?.positions.map(({ key, slot, refereeId }) => ({ key, slot, refereeId })) ?? [];
  const initialWarnings = currentPositions.length ? await detectAppointmentWarnings(match.id, currentPositions) : [];
  const completedCounts = new Map(statistics.map((item) => [item.refereeId, item.totalMatches]));
  const appointmentView: AppointmentMatchView = {
    id: match.id, appointmentId: match.appointment?.id ?? null, statusKey: match.appointment?.status ?? "NONE",
    format: match.competition.format, publicationNote: match.appointment?.publicationNote ?? "", template, positions: currentPositions,
  };
  return <>
    <section className="admin-detail-hero">
      <div><span>{match.competition.name}</span><h1>{match.homeTeam.name} vs {match.awayTeam.name}</h1><p>{match.round ? `${match.round} · ` : ""}{match.stage}</p>
        <dl className="admin-detail-meta"><div><dt>开球时间</dt><dd>{formatRefereeDateTime(match.kickoff)}</dd></div><div><dt>比赛场地</dt><dd>{match.venue}</dd></div><div><dt>比赛状态</dt><dd>{matchStatusLabels[match.status]}</dd></div><div><dt>当前选派</dt><dd>{appointmentStatusLabels[match.appointment?.status ?? "NONE"]}</dd></div></dl>
      </div>
      <div className="admin-detail-actions"><Link className="admin-button admin-button-secondary" href={`/referees/admin/matches/${match.id}/edit`}>编辑比赛</Link></div>
    </section>
    <AdminAppointmentEditor
      applications={match.applications.map((item) => ({ id: item.id, referee: `${item.referee.publicCode} · ${item.referee.name}`, status: item.status, statusLabel: applicationStatusLabels[item.status], preferred: parsePreferredPositions(item.preferredPositions).map((key) => getPositionTemplate(match.competition.format).find((position) => position.key === key)?.label ?? key).join(" / "), note: item.note, createdAt: formatRefereeDateTime(item.createdAt) }))}
      initialWarnings={initialWarnings.map((warning) => ({ code: warning.code, refereeId: warning.refereeId, refereeName: warning.refereeName, message: warning.message, overridable: warning.overridable }))}
      match={appointmentView}
      referees={referees.map((item) => ({ id: item.id, label: `${item.publicCode} · ${item.name}`, elevenASide: item.elevenASide, futsal: item.futsal, capabilities: item.capabilities.map((capability) => `${capability.format}:${capability.positionKey}:${capability.status}`), completedCount: completedCounts.get(item.id) ?? 0 }))}
    />
    <section className="admin-panel admin-history-panel"><details className="admin-history-details"><summary><div><h2>版本历史（{match.appointment?.versions.length ?? 0}）</h2><p>确认知悉绑定具体发布版本，重新发布后须重新确认。</p></div><span aria-hidden="true" className="admin-history-action" /></summary><div className="admin-history-content">
      {match.appointment?.versions.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>版本</th><th>状态</th><th>操作人</th><th>修改原因</th><th>冲突覆盖原因</th><th>确认人数</th><th>时间</th></tr></thead><tbody>{match.appointment.versions.map((version) => <tr key={version.id}><td><strong>R{version.revision}</strong></td><td><AdminStatusBadge status={version.status} label={appointmentStatusLabels[version.status]} /></td><td>{version.createdByAdmin ? `${version.createdByAdmin.displayName} (${version.createdByAdmin.username})` : "Legacy / 未记录"}</td><td>{version.reason || "—"}</td><td>{version.overrideReason || "—"}</td><td>{version.acknowledgements.length}</td><td>{formatRefereeDateTime(version.createdAt)}</td></tr>)}</tbody></table></div> : <div className="admin-empty-state"><strong>暂无版本记录</strong><p>首次保存或发布后会形成版本留痕。</p></div>}
    </div></details></section>
  </>;
}
