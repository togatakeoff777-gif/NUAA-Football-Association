import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PdfResourcePanel } from "@/components/participation/pdf-resource-panel";
import {
  footballChinaOperationAreas,
  individualPlayerGuideSteps,
  participationPdfResources,
} from "@/data/participation-resources";
import { footballChinaPlatform } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/participation/event-guide" },
  title: "个人球员报名指南",
  description: "个人球员参赛流程、资格确认方式及足球中国平台操作参考。",
};

export default function EventGuidePage() {
  const resource = participationPdfResources.footballChinaOperations;

  return (
    <>
      <SiteHeader />
      <main className="detail-page participation-guide-page" id="main-content">
        <section className="detail-hero">
          <div className="page-shell detail-hero-inner">
            <p className="detail-eyebrow">PLAYER PARTICIPATION GUIDE</p>
            <h1>个人球员报名指南</h1>
            <p className="detail-lead">先确认赛事通知与球队安排，再按要求完成足球中国平台相关操作并等待资格确认。</p>
            <span className="detail-status">报名开放时间以当届赛事通知为准</span>
          </div>
        </section>

        <section className="participation-guide-section" aria-labelledby="player-guide-flow-title">
          <div className="page-shell">
            <div className="v25-section-heading">
              <div><p>PLAYER FLOW</p><h2 id="player-guide-flow-title">个人参赛流程</h2></div>
              <a href={footballChinaPlatform.href} rel="noopener noreferrer" target="_blank">打开足球中国平台 ↗</a>
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
            <PdfResourcePanel
              description="本站目前暂未取得专门面向个人球员的足球中国注册操作手册。以下为中国足球协会提供的《足球中国赛事操作说明》，主要介绍足球中国平台的赛事管理、报名、赛程及比赛操作流程，可作为了解平台使用方式的参考资料。个人球员实际报名方式及赛事入口，请以当届赛事通知和球队负责人通知为准。"
              eyebrow="PLATFORM REFERENCE"
              fileLabel={resource.fileLabel}
              href={resource.href}
              title="足球中国平台操作参考"
            >
              <ul className="participation-resource-tags" aria-label="操作手册覆盖范围">
                {footballChinaOperationAreas.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </PdfResourcePanel>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
