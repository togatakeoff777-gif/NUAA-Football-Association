import type { Metadata } from "next";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { getPublicRefereeDirectory } from "@/lib/referee-public";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/directory" }, title: "裁判员名录", description: "展示允许公开的已登记裁判员编号、姓名及登记赛制。" };
export const dynamic = "force-dynamic";

export default async function RefereeDirectoryPage() {
  const referees = await getPublicRefereeDirectory();
  const updatedAt = referees.reduce<Date | null>((latest, item) => !latest || item.updatedAt > latest ? item.updatedAt : latest, null);
  return <><SiteHeader /><main className="functional-page" id="main-content"><section className="functional-hero"><div className="detail-shell"><p>REGISTERED REFEREES</p><h1>注册裁判员公开名录</h1><p>仅展示经协会授权公开的编号、姓名、登记赛制和公开简介，不展示联系方式、账号状态或内部备注。</p></div></section><RefereeSubnav /><section className="functional-section"><div className="detail-shell">{updatedAt ? <p className="functional-updated-at">最后更新时间：{formatRefereeDateTime(updatedAt)}</p> : null}{referees.length ? <div className="referee-directory-grid">{referees.map((referee) => <article key={referee.id}><span>{referee.publicCode}</span><h2>{referee.name}</h2><p>{[referee.elevenASide ? "十一人制" : null, referee.futsal ? "五人制" : null].filter(Boolean).join(" / ")}</p>{referee.publicBio ? <small>{referee.publicBio}</small> : null}</article>)}</div> : <div className="functional-empty"><strong>当前暂无经协会确认可公开的裁判员名录</strong><p>名录更新后将在此发布。</p></div>}</div></section></main><SiteFooter /></>;
}
