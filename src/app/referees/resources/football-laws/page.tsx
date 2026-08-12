import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { refereeFootballLawFiles } from "@/data/referees";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/resources/football-laws" },
  title: "足球竞赛规则",
  description: "足球竞赛规则及现有规则修改说明。",
};

export default function RefereeFootballLawsPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>LAWS OF THE GAME</p>
            <h1>足球竞赛规则</h1>
            <p>查阅现有足球竞赛规则中文文件及规则修改说明。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell">
            <div className="functional-section-head">
              <div><span>RULE DOCUMENTS</span><h2>规则文件</h2></div>
              <p>选择对应文件查看完整内容，具体赛事执行要求以赛事规程与正式通知为准。</p>
            </div>
            <div className="referee-resource-file-list">
              {refereeFootballLawFiles.map((file) => (
                <article key={file.id}>
                  <span>PDF</span>
                  <div><h3>{file.title}</h3><p>{file.description}</p></div>
                  <a href={file.href} target="_blank" rel="noopener noreferrer">查看规则文件</a>
                </article>
              ))}
            </div>
            <Link className="functional-back-link" href="/referees#referee-resources">← 返回裁判学习资料</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
