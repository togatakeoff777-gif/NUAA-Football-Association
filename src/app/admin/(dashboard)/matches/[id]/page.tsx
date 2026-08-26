import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminMatchDangerActions } from "@/components/referees/admin/admin-match-danger-actions";
import { AdminPanel, appointmentStatusLabels, matchStatusLabels } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { hasUnifiedAdminPermission } from "@/lib/unified-admin-rbac";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

export default async function UnifiedMatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const actor = await guardUnifiedAdminPage("competitions:read", "matches");
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      id: true,
      stage: true,
      round: true,
      kickoff: true,
      endAt: true,
      venue: true,
      status: true,
      applicationWindowStatus: true,
      applicationDeadline: true,
      publicNote: true,
      internalNote: true,
      competition: { select: { name: true } },
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
      appointment: {
        select: {
          status: true,
          revision: true,
          publishedAt: true,
          withdrawnAt: true,
          completedAt: true,
          cancelledAt: true,
          _count: { select: { versions: true, acknowledgements: true, conflictReports: true } },
        },
      },
      applications: { select: { status: true } },
    },
  });
  if (!match) notFound();
  const canWrite = hasUnifiedAdminPermission(actor.roles, "competitions:write");
  const deletionProtected = match.status !== "SCHEDULED" ||
    match.applications.some(({ status }) => status === "APPOINTED" || status === "NOT_SELECTED") ||
    Boolean(match.appointment && (
      match.appointment.status !== "DRAFT" ||
      match.appointment.revision > 0 ||
      match.appointment.publishedAt ||
      match.appointment.withdrawnAt ||
      match.appointment.completedAt ||
      match.appointment.cancelledAt ||
      match.appointment._count.versions > 0 ||
      match.appointment._count.acknowledgements > 0 ||
      match.appointment._count.conflictReports > 0
    ));
  const matchLabel = `${match.homeTeam.name} vs ${match.awayTeam.name}`;

  return <>
    <section className="admin-detail-hero">
      <div><span>{match.competition.name}</span><h1>{matchLabel}</h1><p>{match.round ? `${match.round} · ` : ""}{match.stage}</p>
        <dl className="admin-detail-meta">
          <div><dt>开球时间</dt><dd>{formatRefereeDateTime(match.kickoff)}</dd></div>
          <div><dt>比赛场地</dt><dd>{match.venue}</dd></div>
          <div><dt>比赛状态</dt><dd>{matchStatusLabels[match.status]}</dd></div>
          <div><dt>选派状态</dt><dd>{appointmentStatusLabels[match.appointment?.status ?? "NONE"]}</dd></div>
        </dl>
      </div>
      {canWrite ? <div className="admin-detail-actions">
        <Link className="admin-button admin-button-secondary" href={`/admin/matches/${match.id}/edit`}>编辑比赛</Link>
        <AdminMatchDangerActions matchId={match.id} matchLabel={matchLabel} protectedReason={deletionProtected ? "该比赛已经存在正式选派或历史记录，不能直接删除。请使用“取消比赛”保留业务历史。" : undefined} />
      </div> : null}
    </section>
    <AdminPanel title="比赛资料" description="赛事管理员仅维护比赛运营资料；裁判选派位于裁判中心。">
      <dl className="admin-detail-meta">
        <div><dt>报名窗口</dt><dd>{match.applicationWindowStatus}</dd></div>
        <div><dt>报名截止</dt><dd>{match.applicationDeadline ? formatRefereeDateTime(match.applicationDeadline) : "—"}</dd></div>
        <div><dt>结束时间</dt><dd>{match.endAt ? formatRefereeDateTime(match.endAt) : "—"}</dd></div>
        <div><dt>公开说明</dt><dd>{match.publicNote || "—"}</dd></div>
        <div><dt>内部备注</dt><dd>{match.internalNote || "—"}</dd></div>
      </dl>
    </AdminPanel>
  </>;
}
