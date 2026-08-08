import type { Metadata } from "next";

import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { FOOTBALL_CHINA_URL } from "@/data/platforms";
import { freshmanParticipationFaq, freshmanParticipationPath } from "@/data/participation";

export const metadata: Metadata = {
  alternates: { canonical: "/participation" },
  title: "参赛指南",
  description: "天目湖校园足球参赛、报名与团队加入指南入口。",
};

const items = [
  {
    title: "前往足球中国注册报名",
    description:
      "足球中国为校内足球赛事使用的外部平台入口，并非天目湖专属赛事页面。",
    meta: "外部平台",
    status: "注册与竞赛管理",
    href: FOOTBALL_CHINA_URL,
    external: true,
    openInNewTab: true,
    actionLabel: "打开足球中国",
  },
  {
    title: "赛事报名指南",
    description: "了解报名入口、基本流程及正式竞赛规程的查看方式。",
    meta: "参赛说明",
    status: "参赛指南",
    href: "/participation/event-guide",
    actionLabel: "查看指南",
  },
  {
    title: "球队负责人指南",
    description: "为球队组建、信息核对和参赛事务提供基础说明。",
    meta: "球队事务",
    status: "参赛指南",
    href: "/participation/team-manager-guide",
    actionLabel: "查看指南",
  },
];

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
            <p className="index-notice" role="note">本站仅提供参赛说明，不直接办理报名，也不收集身份证、学号、手机号等敏感个人信息。</p>
            <div className="index-grid">
              {items.map((item) => item.external ? <a className="index-card index-card-link" href={item.href} key={item.title} rel="noopener noreferrer" target="_blank"><div className="index-card-topline"><span className="index-card-meta">{item.meta}</span><span className="index-card-status">{item.status}</span></div><h3 className="index-card-title">{item.title}</h3><p className="index-card-description">{item.description}</p><span className="index-card-action">{item.actionLabel}（新窗口）<span aria-hidden="true">→</span></span></a> : <Link className="index-card index-card-link" href={item.href} key={item.title}><div className="index-card-topline"><span className="index-card-meta">{item.meta}</span><span className="index-card-status">{item.status}</span></div><h3 className="index-card-title">{item.title}</h3><p className="index-card-description">{item.description}</p><span className="index-card-action">{item.actionLabel}<span aria-hidden="true">→</span></span></Link>)}
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
