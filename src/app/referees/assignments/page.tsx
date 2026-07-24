import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PublicAppointmentList, RefereeSubnav, type PublicAppointment } from "@/components/referees/mvp/public-appointment-list";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "裁判员选派公告", description: "仅展示已发布且未撤回的裁判组选派。" };
export const dynamic = "force-dynamic";

async function getItems(): Promise<PublicAppointment[]> {
  const appointments = await prisma.refereeAppointment.findMany({ where: { status: "PUBLISHED", match: { kickoff: { gt: new Date() } } }, include: { match: { include: { competition: true, homeTeam: true, awayTeam: true } }, positions: { include: { referee: true }, orderBy: { sortOrder: "asc" } } }, orderBy: { publishedAt: "desc" } });
  return appointments.map((item) => ({ id: item.id, competition: item.match.competition.name, match: `${item.match.homeTeam.name} vs ${item.match.awayTeam.name}`, stage: item.match.stage, kickoff: formatRefereeDateTime(item.match.kickoff), venue: item.match.venue, publishedAt: item.publishedAt ? formatRefereeDateTime(item.publishedAt) : "—", note: item.publicationNote, positions: item.positions.flatMap((position) => position.referee ? [{ key: position.key, label: position.label, referee: position.referee.name }] : []) }));
}

export default async function RefereeAssignmentsPage() { const items = await getItems(); return <><SiteHeader /><main className="functional-page" id="main-content"><section className="functional-hero"><div className="detail-shell"><p>PUBLISHED APPOINTMENTS</p><h1>裁判员选派公告</h1><p>公开页只读取状态为“已发布”的记录；管理员撤回后立即从此页面隐藏。</p></div></section><RefereeSubnav /><section className="functional-section"><div className="detail-shell"><PublicAppointmentList emptyTitle="当前暂无未来比赛的已发布选派" items={items} /></div></section></main><SiteFooter /></>; }
