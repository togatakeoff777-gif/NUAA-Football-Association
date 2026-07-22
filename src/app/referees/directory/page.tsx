import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "注册裁判员公开名录", description: "公开展示已核验的裁判员编号、姓名及登记赛制。" };
export const dynamic = "force-dynamic";

export default async function RefereeDirectoryPage() {
  const referees = await prisma.referee.findMany({ where: { status: "ACTIVE" }, orderBy: { publicCode: "asc" } });
  return <><SiteHeader /><main className="functional-page" id="main-content"><section className="functional-hero"><div className="detail-shell"><p>REGISTERED REFEREES</p><h1>注册裁判员公开名录</h1><p>仅公开赛事来源可核验的姓名、公开编号与登记赛制，不展示联系方式或其他个人敏感信息。</p></div></section><RefereeSubnav /><section className="functional-section"><div className="detail-shell"><div className="referee-directory-grid">{referees.map((referee) => <article key={referee.id}><span>{referee.publicCode}</span><h2>{referee.name}</h2><p>{[referee.elevenASide ? "十一人制" : null, referee.futsal ? "五人制" : null].filter(Boolean).join(" / ")}</p></article>)}</div></div></section></main><SiteFooter /></>;
}
