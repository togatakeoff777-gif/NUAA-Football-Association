import type { Metadata } from "next";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import {
  GuideDownload,
  GuideScreenshotGallery,
  NumberedGuideSteps,
  OperationAreaList,
} from "@/components/participation/operation-guide-section";
import {
  footballChinaOperationAreas,
  footballChinaOperationScreenshots,
  matchdayRosterScreenshots,
  matchdayRosterSteps,
  participationPdfResources,
  teamRegistrationScreenshots,
  teamRegistrationSteps,
} from "@/data/participation-resources";
import { footballChinaPlatform } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/participation/team-manager-guide" },
  title: "球队负责人指南",
  description: "球队报名组建、比赛日名单提交及足球中国平台赛事操作指南。",
};

const guideNavigation = [
  { href: "#team-registration", label: "球队报名与组建", audience: "球队负责人" },
  { href: "#matchday-roster", label: "比赛日名单", audience: "球队官员" },
  { href: "#platform-operations", label: "赛事平台操作", audience: "赛事组织方" },
] as const;

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
            <p className="detail-lead">查看球队报名、比赛日名单提交与赛事平台管理的具体步骤，必要时下载 PDF 原件。</p>
            <a className="button button-light" href={footballChinaPlatform.href} rel="noopener noreferrer" target="_blank">打开足球中国平台 ↗</a>
          </div>
        </section>

        <nav className="participation-guide-navigation" aria-label="指南章节导航">
          <div className="page-shell">
            {guideNavigation.map((item, index) => (
              <a href={item.href} key={item.href}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.label}</strong><small>{item.audience}</small></a>
            ))}
          </div>
        </nav>

        <section className="participation-guide-section participation-guide-section-tint">
          <div className="page-shell participation-document-stack">
            <article className="participation-guide-module" id="team-registration" aria-labelledby="team-registration-title">
              <header><span>01 / TEAM REGISTRATION</span><h2 id="team-registration-title">A. 球队报名与组建</h2><p>面向球队负责人：在足球中国 APP 中进入学校足球协会，选择正式开放报名的赛事，创建球队并完善资料。</p></header>
              <NumberedGuideSteps steps={teamRegistrationSteps} />
              <GuideScreenshotGallery screenshots={teamRegistrationScreenshots} />
              <GuideDownload href={resources.teamRegistration.href} fileLabel={resources.teamRegistration.fileLabel} label="下载完整《球队报名与组建操作说明》PDF" />
            </article>

            <article className="participation-guide-module" id="matchday-roster" aria-labelledby="matchday-roster-title">
              <header><span>02 / MATCHDAY ROSTER</span><h2 id="matchday-roster-title">B. 比赛日名单</h2><p>面向报名时登记的主教练、助理教练与领队：在足球中国 APP 中完成对应场次的球员、队长与球队官员设置。</p></header>
              <aside className="participation-important-note" aria-label="比赛日名单重要提示">
                <strong>提交与修改要求</strong>
                <ul>
                  <li>比赛开始前半小时提交比赛名单。</li>
                  <li>比赛开始前如需修改，请向裁判员申请，由管理员在后台删除签名后重新提交。</li>
                  <li>比赛开始后不允许修改比赛名单。</li>
                </ul>
              </aside>
              <NumberedGuideSteps steps={matchdayRosterSteps} />
              <GuideScreenshotGallery screenshots={matchdayRosterScreenshots} />
              <GuideDownload href={resources.matchdayRoster.href} fileLabel={resources.matchdayRoster.fileLabel} label="下载完整《比赛日名单提交操作说明》PDF" />
            </article>

            <article className="participation-guide-module" id="platform-operations" aria-labelledby="platform-operations-title">
              <header><span>03 / COMPETITION OPERATIONS</span><h2 id="platform-operations-title">C. 足球中国赛事操作</h2><p>面向协会、部门和赛事管理员的赛事管理流程，与球队及教练在 APP 中的比赛日操作分开说明。</p></header>
              <aside className="participation-role-note"><strong>权限说明</strong><p>球队主教练、助理教练和领队使用本人实名 APP 账号提交比赛名单；赛事信息、报名审核、赛程和比赛官员由赛事组织方在相应管理权限下操作。</p></aside>
              <OperationAreaList areas={footballChinaOperationAreas} />
              <GuideScreenshotGallery screenshots={footballChinaOperationScreenshots} />
              <GuideDownload href={resources.footballChinaOperations.href} fileLabel={resources.footballChinaOperations.fileLabel} label="下载完整《足球中国赛事操作说明》PDF" />
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
