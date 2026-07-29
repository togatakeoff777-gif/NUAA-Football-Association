import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { refereeWorkFiles } from "@/data/referees";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/resources/work-files" },
  title: "裁判工作资料",
  description: "裁判组与比赛官员使用的真实工作文件下载。",
};

export default function RefereeWorkFilesPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>OFFICIALS&apos; WORK FILES</p>
            <h1>裁判工作资料</h1>
            <p>集中提供已核验的比赛成绩报告单与裁判报告模板；发布日期未确认的文件保持明确标注。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell">
            <div className="functional-section-head">
              <div><span>VERIFIED FILES</span><h2>工作文件下载</h2></div>
              <p>文件版本、适用范围、来源与日期状态直接复用裁判中心现有真实数据。</p>
            </div>
            <div className="referee-work-file-list">
              {refereeWorkFiles.map((file) => (
                <article key={file.id}>
                  <span>{file.fileType}</span>
                  <div><h3>{file.title}</h3><p>{file.scope}</p></div>
                  <dl>
                    <div><dt>版本</dt><dd>{file.version}</dd></div>
                    <div><dt>发布日期</dt><dd>{file.publishedAt}</dd></div>
                    <div><dt>来源</dt><dd>{file.source}</dd></div>
                  </dl>
                  <a download href={file.href}>下载原文件</a>
                </article>
              ))}
            </div>
            <Link className="functional-back-link" href="/referees">← 返回裁判中心</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
