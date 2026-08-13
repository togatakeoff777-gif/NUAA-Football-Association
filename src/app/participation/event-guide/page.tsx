import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { individualPlayerGuideSteps, participationPdfResources } from "@/data/participation-resources";
import { footballChinaPlatform } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/participation/event-guide" },
  title: "个人球员报名指南",
  description: "个人球员参赛流程、资格确认方式及足球中国平台操作参考。",
};

const referenceMaterials = [
  {
    id: "team-registration",
    title: "球队报名与组建操作说明",
    audience: "球队负责人 / 组队人员",
    description: "介绍进入学校足球协会、选择开放报名赛事、创建球队并完善球队与球员资料的操作。",
    guideHref: "/participation/team-manager-guide#team-registration",
    resource: participationPdfResources.teamRegistration,
  },
  {
    id: "matchday-roster",
    title: "比赛日名单提交操作说明",
    audience: "报名登记的主教练、助理教练、领队",
    description: "介绍比赛日球员、队长与球队官员设置，以及签名提交和名单修改限制。",
    guideHref: "/participation/team-manager-guide#matchday-roster",
    resource: participationPdfResources.matchdayRoster,
  },
  {
    id: "platform-operations",
    title: "足球中国赛事操作说明 2025",
    audience: "赛事组织方 / 管理员",
    description: "赛事管理与平台操作参考，涵盖权限、报名、赛程、比赛官员、比赛报告和成绩确认等内容。",
    guideHref: "/participation/team-manager-guide#platform-operations",
    resource: participationPdfResources.footballChinaOperations,
  },
] as const;

export default function EventGuidePage() {
  return (
    <>
      <SiteHeader />
      <main className="detail-page participation-guide-page" id="main-content">
        <section className="detail-hero">
          <div className="page-shell detail-hero-inner">
            <p className="detail-eyebrow">PLAYER PARTICIPATION GUIDE</p>
            <h1>个人球员报名指南</h1>
            <p className="detail-lead">先确认赛事通知与球队安排，再按要求完成足球中国平台相关操作并等待资格确认。</p>
            <div className="participation-player-hero-actions">
              <a className="button button-light" href={footballChinaPlatform.href} rel="noopener noreferrer" target="_blank">前往足球中国注册报名 ↗</a>
              <span className="detail-status">报名开放时间以当届赛事通知为准</span>
            </div>
          </div>
        </section>

        <section className="participation-guide-section" aria-labelledby="player-guide-flow-title">
          <div className="page-shell">
            <div className="v25-section-heading">
              <div><p>PLAYER FLOW</p><h2 id="player-guide-flow-title">个人参赛流程</h2></div>
              <p>按赛事通知与球队负责人安排完成对应步骤。</p>
            </div>
            <ol className="participation-guide-steps">
              {individualPlayerGuideSteps.map((step, index) => (
                <li key={step.id}>
                  <strong>{String(index + 1).padStart(2, "0")}</strong>
                  <div><h3>{step.title}</h3><p>{step.description}</p></div>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="participation-guide-section participation-guide-section-tint" aria-labelledby="platform-reference-title">
          <div className="page-shell">
            <div className="v25-section-heading">
              <div><p>PLATFORM REFERENCES</p><h2 id="platform-reference-title">足球中国平台参考资料</h2></div>
              <p>按使用场景查阅操作说明与 PDF 原件。</p>
            </div>
            <div className="participation-reference-list">
              {referenceMaterials.map((entry, index) => (
                <article key={entry.id}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <div>
                    <h3>{entry.title}</h3>
                    <strong>适用对象：{entry.audience}</strong>
                    <p>{entry.description}</p>
                  </div>
                  <div className="participation-reference-actions">
                    <Link href={entry.guideHref}>阅读网页指南 →</Link>
                    <a href={entry.resource.href} target="_blank" rel="noopener noreferrer">下载 PDF 原件 ↗</a>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
