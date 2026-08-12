import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PdfResourcePanel } from "@/components/participation/pdf-resource-panel";
import {
  footballChinaOperationAreas,
  matchdayRosterSteps,
  participationPdfResources,
  teamRegistrationSteps,
} from "@/data/participation-resources";
import { footballChinaPlatform } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/participation/team-manager-guide" },
  title: "球队负责人指南",
  description: "球队报名组建、比赛日名单提交及足球中国平台完整操作资料。",
};

function NumberedSteps({ steps }: { steps: readonly string[] }) {
  return (
    <ol className="participation-document-steps">
      {steps.map((step, index) => (
        <li key={step}>
          <strong>{String(index + 1).padStart(2, "0")}</strong>
          <span>{step}</span>
        </li>
      ))}
    </ol>
  );
}

export default function TeamManagerGuidePage() {
  const resources = participationPdfResources;

  return (
    <>
      <SiteHeader />
      <main className="detail-page participation-guide-page" id="main-content">
        <section className="detail-hero">
          <div className="page-shell detail-hero-inner">
            <p className="detail-eyebrow">TEAM MANAGER GUIDE</p>
            <h1>球队负责人指南</h1>
            <p className="detail-lead">依次完成球队报名与组建、比赛日名单提交，并通过完整操作手册核对平台赛事流程。</p>
            <a className="button button-light" href={footballChinaPlatform.href} rel="noopener noreferrer" target="_blank">打开足球中国平台 ↗</a>
          </div>
        </section>

        <section className="participation-guide-section participation-guide-section-tint">
          <div className="page-shell participation-document-stack">
            <PdfResourcePanel
              description="在足球中国平台选择当届正式开放报名的赛事，创建球队并完善球队与球员资料。"
              eyebrow="01 / TEAM REGISTRATION"
              fileLabel={resources.teamRegistration.fileLabel}
              href={resources.teamRegistration.href}
              title="球队报名与组建"
            >
              <NumberedSteps steps={teamRegistrationSteps} />
            </PdfResourcePanel>

            <PdfResourcePanel
              description="赛前由球队负责人按对应比赛完成首发、替补、队长与球队官员设置，并签名提交。"
              eyebrow="02 / MATCHDAY ROSTER"
              fileLabel={resources.matchdayRoster.fileLabel}
              href={resources.matchdayRoster.href}
              title="比赛日名单提交"
            >
              <aside className="participation-important-note" aria-label="比赛日名单重要提示">
                <strong>重要提示</strong>
                <ul>
                  <li>比赛开始前半小时提交比赛名单。</li>
                  <li>若需修改，请在比赛开始前向裁判员申请，由管理员后台删除签名后重新提交。</li>
                  <li>比赛开始后不允许修改比赛名单。</li>
                </ul>
              </aside>
              <NumberedSteps steps={matchdayRosterSteps} />
            </PdfResourcePanel>

            <PdfResourcePanel
              description="中国足球协会提供的足球中国赛事完整操作参考，覆盖从权限设置、报名管理到成绩确认和完结赛事的主要流程。"
              eyebrow="03 / COMPLETE OPERATIONS MANUAL"
              fileLabel={resources.footballChinaOperations.fileLabel}
              href={resources.footballChinaOperations.href}
              title="足球中国赛事完整操作手册"
            >
              <ul className="participation-resource-tags" aria-label="完整操作手册覆盖范围">
                {footballChinaOperationAreas.map((item) => <li key={item}>{item}</li>)}
              </ul>
              <p className="participation-operation-note">比赛首发名单由双方教练使用足球中国 APP 的实名账号提交；报名时登记的主教练、助理教练、领队账号具有提交权限。签名后如需修改，应先由后台删除签名，再重新填报。</p>
            </PdfResourcePanel>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
