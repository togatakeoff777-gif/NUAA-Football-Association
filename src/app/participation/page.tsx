import type { Metadata } from "next";

import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { footballChinaPlatform } from "@/data/platforms";
import { freshmanParticipationFaq, freshmanParticipationPath } from "@/data/participation";

export const metadata: Metadata = {
  alternates: { canonical: "/participation" },
  title: "参赛指南",
  description: "天目湖校园足球参赛、报名与团队加入指南入口。",
};

export default function ParticipationPage() {
  return (
    <>
      <SiteHeader />
      <main className="detail-page participation-v25" id="main-content">
        <section className="detail-hero" aria-labelledby="participation-title">
          <div className="page-shell detail-hero-inner">
            <p className="detail-eyebrow">PARTICIPATION</p>
            <h1 id="participation-title">参赛指南</h1>
            <p className="detail-lead">球员注册、球队组建、赛事报名及相关参赛资格管理统一通过足球中国平台完成。</p>
            <span className="detail-status">2026 新生杯 · 筹备工作已启动</span>
          </div>
        </section>

        <section className="participation-path-section" aria-labelledby="freshman-path-title">
          <div className="page-shell">
            <div className="v25-section-heading"><div><p>FRESHMAN PARTICIPATION PATH</p><h2 id="freshman-path-title">新生参赛路径</h2></div><p>当前报名尚未开放，报名时间、材料清单与具体要求待正式通知。</p></div>
            <ol className="participation-path">
              {freshmanParticipationPath.map((step, index) => <li key={step.id}><strong>{String(index + 1).padStart(2, "0")}</strong><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}
            </ol>
          </div>
        </section>

        <section className="index-section participation-services" aria-labelledby="participation-services-title">
          <div className="page-shell index-shell">
            <div className="index-heading"><div><p className="index-eyebrow">SERVICE ENTRANCES</p><h2 id="participation-services-title">参赛服务入口</h2></div><p>正式要求以各赛事最新竞赛规程和赛事组委会通知为准。</p></div>
            <div className="participation-service-grid">
              <a
                className="participation-platform-card"
                href={footballChinaPlatform.href}
                rel="noopener noreferrer"
                target="_blank"
              >
                <div>
                  <span>OFFICIAL REGISTRATION PLATFORM / 外部平台</span>
                  <h3>足球中国官方平台</h3>
                  <p>校内足球赛事使用的外部报名与竞赛管理平台。具体开放时间与报名要求以当届赛事通知为准。</p>
                </div>
                <strong>前往足球中国注册报名 <span aria-hidden="true">↗</span></strong>
              </a>
              <div className="participation-guide-grid">
                <Link className="participation-guide-card" href="/participation/event-guide">
                  <div><span>PLAYER GUIDE</span><h3>个人球员报名指南</h3><p>查看个人参赛流程、资格确认方式及足球中国平台操作参考。</p></div>
                  <strong>查看指南 <span aria-hidden="true">→</span></strong>
                </Link>
                <Link className="participation-guide-card" href="/participation/team-manager-guide">
                  <div><span>TEAM MANAGER GUIDE</span><h3>球队负责人指南</h3><p>查看球队报名组建、比赛日名单提交与平台完整操作资料。</p></div>
                  <strong>查看指南 <span aria-hidden="true">→</span></strong>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="participation-faq-section" aria-labelledby="participation-faq-title">
          <div className="page-shell"><div className="v25-section-heading"><div><p>FAQ / NOTES</p><h2 id="participation-faq-title">新生参赛常见问题</h2></div><p>未正式公布的信息不作为报名或参赛依据。</p></div><div className="participation-faq-list">{freshmanParticipationFaq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}</div></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
