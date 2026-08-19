import Link from "next/link";

import { ConflictReportsManager } from "@/components/referees/admin/admin-data-managers";
import { AdminPageHeader } from "@/components/referees/admin/admin-ui";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { prisma } from "@/lib/prisma";

export default async function AdminConflictReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const rawStatus = typeof query.status === "string" ? query.status : "PENDING";
  const status = ["PENDING", "HANDLED", "ALL"].includes(rawStatus) ? rawStatus : "PENDING";
  const reports = await prisma.appointmentConflictReport.findMany({
    where: status === "HANDLED" ? { status: { in: ["RESOLVED", "DISMISSED"] } } : status && status !== "ALL" ? { status: status as "PENDING" | "RESOLVED" | "DISMISSED" } : {},
    include: { referee: { select: { id: true, publicCode: true, name: true } }, appointment: { select: { match: { select: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } } }, positions: { select: { refereeId: true, label: true } } } } },
    orderBy: { reportedAt: "desc" }, take: 300,
  });
  return <>
    <AdminPageHeader eyebrow="CONFLICT REPORTS" title="冲突报告" description="处理正式发布版本上的裁判员反馈，不与报名意向混用。" />
    <nav className="admin-tabs admin-route-tabs">{[["PENDING","待处理"],["HANDLED","已处理"],["ALL","全部"]].map(([value,label]) => <Link aria-current={status === value ? "page" : undefined} href={`/referees/admin/conflicts?status=${value}`} key={value}>{label}</Link>)}</nav>
    <section className="admin-panel"><ConflictReportsManager reports={reports.map((report) => ({ id: report.id, referee: `${report.referee.publicCode} · ${report.referee.name}`, match: `${report.appointment.match.homeTeam.name} vs ${report.appointment.match.awayTeam.name}`, position: report.appointment.positions.find((position) => position.refereeId === report.referee.id)?.label ?? "", reason: report.reason, reportedAt: formatRefereeDateTime(report.reportedAt), status: report.status, resolutionNote: report.resolutionNote ?? "" }))} /></section>
  </>;
}
