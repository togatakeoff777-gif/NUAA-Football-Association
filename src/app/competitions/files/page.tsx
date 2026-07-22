import type { Metadata } from "next";

import { CompetitionFileCenter } from "@/components/competitions/competition-file-center";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { publicCompetitionFiles } from "@/data/competition-center";

export const metadata: Metadata = {
  title: "赛事文件中心",
  description: "竞赛规则、秩序册、纪律决定和赛事工作表单下载。",
};

export default function CompetitionFilesPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell"><p>COMPETITION DOCUMENTS</p><h1>赛事文件中心</h1><p>按文件类型、版本、发布日期和适用范围发布任务包中的真实原文件；未提供的类别显示正式空状态。</p></div>
        </section>
        <section className="functional-section">
          <div className="detail-shell">
            <div className="functional-notice"><strong>文件治理说明</strong><p>下载文件保持原始内容，不提取或公开身份证号、手机号等敏感字段。使用前请确认适用赛事与版本。</p></div>
            <CompetitionFileCenter files={publicCompetitionFiles} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
