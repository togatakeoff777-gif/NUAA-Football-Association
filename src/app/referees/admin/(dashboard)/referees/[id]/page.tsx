import { notFound } from "next/navigation";

import { RefereeEditForm, type AdminRefereeRecord } from "@/components/referees/admin/admin-referee-forms";
import { AdminEmptyState, AdminPanel, AdminStatusBadge, refereeStatusLabels } from "@/components/referees/admin/admin-ui";
import { adminRefereeSelect } from "@/lib/referee-dto";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { prisma } from "@/lib/prisma";

export default async function AdminRefereeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [referee, colleges, availability, history] = await Promise.all([
    prisma.referee.findUnique({ where: { id }, select: adminRefereeSelect }),
    prisma.college.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.refereeAvailability.findMany({ where: { refereeId: id }, orderBy: { startAt: "desc" }, take: 30 }),
    prisma.appointmentPosition.findMany({
      where: { refereeId: id, appointment: { status: "COMPLETED" } },
      select: {
        id: true,
        label: true,
        appointment: {
          select: {
            match: {
              select: {
                kickoff: true,
                competition: { select: { name: true } },
                homeTeam: { select: { name: true } },
                awayTeam: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { appointment: { match: { kickoff: "desc" } } },
      take: 30,
    }),
  ]);
  if (!referee) notFound();
  const record: AdminRefereeRecord = {
    id: referee.id, publicCode: referee.publicCode, name: referee.name, studentId: referee.studentId ?? "", collegeId: referee.collegeId ?? "",
    grade: referee.grade ?? "", phone: referee.phone ?? "", qq: referee.qq ?? "", refereeLevel: referee.refereeLevel ?? "",
    joinedAt: referee.joinedAt ? referee.joinedAt.toISOString().slice(0, 10) : "", status: referee.status,
    elevenASide: referee.elevenASide, futsal: referee.futsal, certificateNote: referee.certificateNote ?? "", trainingStatus: referee.trainingStatus,
    publicDirectoryEnabled: referee.publicDirectoryEnabled, publicBio: referee.publicBio ?? "", internalNote: referee.internalNote ?? "",
    mustChangePassword: referee.mustChangePassword, capabilities: referee.capabilities.map((item) => `${item.format}:${item.positionKey}`),
  };
  return <>
    <section className="admin-detail-hero"><div><span>{referee.publicCode}</span><h1>{referee.name}</h1><p>{referee.college?.name ?? "学院待确认"} · {referee.refereeLevel || "裁判等级未登记"}</p><dl className="admin-detail-meta"><div><dt>账号状态</dt><dd>{refereeStatusLabels[referee.status]}</dd></div><div><dt>岗位能力</dt><dd>{referee.capabilities.length} 项</dd></div><div><dt>最近登录</dt><dd>{referee.lastLoginAt ? formatRefereeDateTime(referee.lastLoginAt) : "从未登录"}</dd></div><div><dt>执裁历史</dt><dd>{history.length} 条岗位记录</dd></div></dl></div><AdminStatusBadge status={referee.status} label={refereeStatusLabels[referee.status]} /></section>
    <AdminPanel title="裁判员档案" description="通过分区编辑完整资料；保存时沿用现有管理员 API。"><RefereeEditForm account={record} colleges={colleges} /></AdminPanel>
    <div className="admin-two-column">
      <AdminPanel title="可执裁时间" description="最近 30 条，可到可执裁时间页代为维护。">{availability.length ? <div className="admin-compact-list">{availability.map((item) => <article className="admin-compact-row" key={item.id}><div><strong>{item.kind === "AVAILABLE" ? "可执裁" : "不可执裁"}</strong><span>{formatRefereeDateTime(item.startAt)} — {formatRefereeDateTime(item.endAt)}</span></div><p>{item.note || "—"}</p></article>)}</div> : <AdminEmptyState title="暂无可执裁时间" description="裁判员或管理员尚未添加记录。" />}</AdminPanel>
      <AdminPanel title="执裁历史" description="只显示已完成的正式选派。">{history.length ? <div className="admin-compact-list">{history.map((item) => <article className="admin-compact-row" key={item.id}><div><strong>{item.appointment.match.homeTeam.name} vs {item.appointment.match.awayTeam.name}</strong><span>{item.appointment.match.competition.name} · {formatRefereeDateTime(item.appointment.match.kickoff)}</span></div><p>{item.label}</p></article>)}</div> : <AdminEmptyState title="暂无已完成执裁" description="选派完成后会进入这里。" />}</AdminPanel>
    </div>
    <AdminPanel title="账号安全" description="安全字段不通过任何公共 DTO 返回。"><dl className="admin-security-grid"><div><dt>首次登录改密</dt><dd>{referee.mustChangePassword ? "需要" : "已完成"}</dd></div><div><dt>登录锁定</dt><dd>{referee.lockedUntil ? `至 ${formatRefereeDateTime(referee.lockedUntil)}` : "未锁定"}</dd></div><div><dt>密码最近修改</dt><dd>{referee.passwordChangedAt ? formatRefereeDateTime(referee.passwordChangedAt) : "未记录"}</dd></div></dl></AdminPanel>
  </>;
}
