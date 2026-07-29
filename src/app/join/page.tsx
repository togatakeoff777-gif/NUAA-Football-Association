import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { ASSOCIATION_EMAIL } from "@/data/platforms";
import { refereeRecruitment } from "@/data/referee-recruitment";

export const metadata: Metadata = {
  alternates: { canonical: "/join" },
  title: "加入我们",
  description: "天目湖足球协会运营、裁判与摄影宣传方向的公开招新说明。",
};

const directions = [
  {
    id: "operations",
    title: "协会运营",
    description: "参与竞赛组织、现场支持、后勤协作、对外联络与协会日常运营。",
    status: "具体岗位与招募时间待正式公告",
  },
  {
    id: "referees",
    title: "裁判队伍",
    description: "面向希望学习竞赛规则、参与实践培训和校园赛事执裁的同学；已有证书者也可关注公开招募。",
    status: refereeRecruitment.statusLabel,
    href: "/referees/recruitment",
  },
  {
    id: "media",
    title: "摄影与宣传",
    description: "参与赛事摄影、视频记录、图文编辑、赛后报道与校园足球内容传播。",
    status: "具体岗位与招募时间待正式公告",
  },
] as const;

export default function JoinPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page join-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>JOIN THE ASSOCIATION</p>
            <h1>加入我们</h1>
            <p>这里集中说明协会运营、裁判队伍和摄影宣传方向；当前不建设在线报名表，也不收集个人敏感信息。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell">
            <div className="functional-section-head">
              <div><span>RECRUITMENT DIRECTIONS</span><h2>参与方向</h2></div>
              <p>招募状态、岗位、时间和群入口必须经协会确认后更新，未确认内容不作推测。</p>
            </div>
            <div className="join-direction-list">
              {directions.map((direction, index) => (
                <article key={direction.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div><h3>{direction.title}</h3><p>{direction.description}</p></div>
                  <strong>{direction.status}</strong>
                  {"href" in direction ? <Link href={direction.href}>查看公开流程 →</Link> : null}
                </article>
              ))}
            </div>
            <aside className="join-contact-panel">
              <div><span>RECRUITMENT STATUS</span><h2>当前招募尚未开放</h2></div>
              <p>招新QQ群待创建。开放后将在本页或协会官方平台公布经确认的群名称、适用年度和有效期。</p>
              <a href={`mailto:${ASSOCIATION_EMAIL}`}>公开邮箱：{ASSOCIATION_EMAIL}</a>
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
