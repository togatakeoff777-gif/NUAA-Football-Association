import Link from "next/link";

import { AvailabilityManager } from "@/components/referees/admin/admin-data-managers";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { prisma } from "@/lib/prisma";

export default async function AdminAvailabilityPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const refereeId = typeof query.referee === "string" ? query.referee : "";
  const rawKind = typeof query.kind === "string" ? query.kind : "";
  const kind = ["AVAILABLE", "UNAVAILABLE"].includes(rawKind) ? rawKind : "";
  const date = typeof query.date === "string" ? query.date : "";
  const dateStart = /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T00:00:00+08:00`) : null;
  const [referees, records] = await Promise.all([
    prisma.referee.findMany({ where: { status: { not: "ARCHIVED" } }, select: { id: true, publicCode: true, name: true }, orderBy: { publicCode: "asc" } }),
    prisma.refereeAvailability.findMany({ where: { ...(refereeId ? { refereeId } : {}), ...(kind ? { kind: kind as "AVAILABLE" | "UNAVAILABLE" } : {}), ...(dateStart ? { startAt: { lt: new Date(dateStart.getTime() + 86400000) }, endAt: { gt: dateStart } } : {}) }, include: { referee: { select: { publicCode: true, name: true } } }, orderBy: { startAt: "desc" }, take: 300 }),
  ]);
  return <>
    <AdminPageHeader eyebrow="AVAILABILITY" title="可执裁时间" description="按日期和裁判员查看；管理员代录通过弹窗完成。" />
    <form className="admin-filter-bar"><label><span>日期</span><input defaultValue={date} name="date" type="date" /></label><label><span>裁判员</span><select defaultValue={refereeId} name="referee"><option value="">全部裁判员</option>{referees.map((item) => <option key={item.id} value={item.id}>{item.publicCode} · {item.name}</option>)}</select></label><label><span>类型</span><select defaultValue={kind} name="kind"><option value="">全部类型</option><option value="AVAILABLE">可执裁</option><option value="UNAVAILABLE">不可执裁</option></select></label><button className="admin-button admin-button-secondary" type="submit">筛选</button><Link className="admin-filter-reset" href="/referees/admin/availability">清除</Link></form>
    <AdminPanel title={`时间记录 · ${records.length}`} description="时间按 Asia/Shanghai 展示，最多显示 300 条。"><AvailabilityManager records={records.map((item) => ({ id: item.id, refereeId: item.refereeId, referee: `${item.referee.publicCode} · ${item.referee.name}`, kind: item.kind, startAt: formatRefereeDateTime(item.startAt), endAt: formatRefereeDateTime(item.endAt), note: item.note ?? "" }))} referees={referees.map((item) => ({ id: item.id, label: `${item.publicCode} · ${item.name}` }))} /></AdminPanel>
  </>;
}
