import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { refereeTrainingResources } from "@/data/referee-training-resources";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/resources/training" },
  title: "裁判培训资料",
  description: "裁判员基础培训、五人制专项学习、第四官员工作与比赛分析报告资料。",
};

const resourceLevels = ["基础", "专项", "进阶"] as const;
const resourceLevelEyebrows = {
  基础: "FOUNDATION",
  专项: "SPECIALIST",
  进阶: "ADVANCED",
} as const;

export default function RefereeTrainingResourcesPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>REFEREE DEVELOPMENT</p>
            <h1>裁判培训资料</h1>
            <p>从基础职责到专项执裁与比赛分析，集中查阅协会裁判员业务学习资料。</p>
          </div>
        </section>
        <section className="functional-section referee-training-library">
          <div className="detail-shell">
            <div className="functional-section-head">
              <div><span>TRAINING LIBRARY</span><h2>基础、专项与进阶学习</h2></div>
              <p>原始培训文件保持完整，PDF资料支持在线查看，演示文稿提供原文件下载。</p>
            </div>
            <div className="referee-training-levels">
              {resourceLevels.map((level) => (
                <section key={level} aria-labelledby={`training-level-${level}`}>
                  <header><span>{resourceLevelEyebrows[level]}</span><h3 id={`training-level-${level}`}>{level}学习</h3></header>
                  <div className="referee-training-resource-grid">
                    {refereeTrainingResources.filter((resource) => resource.level === level).map((resource) => (
                      <article className="referee-training-resource-card" key={resource.id}>
                        <header>
                          <span>{resource.order}</span>
                          <div><small>{resource.fileType}</small><h4>{resource.title}</h4></div>
                        </header>
                        <p>{resource.description}</p>
                        <ul aria-label="资料标签">{resource.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
                        {resource.versionNote ? <div className="referee-training-version-note"><strong>版本提示</strong><p>{resource.versionNote}</p></div> : null}
                        {resource.previewHref ? (
                          <div className="referee-training-preview">
                            <iframe loading="lazy" src={resource.previewHref} title={`${resource.title}在线预览`} />
                            <p>如浏览器无法显示内嵌文档，可使用下方“在线查看”或“下载原文件”。</p>
                          </div>
                        ) : null}
                        <footer>
                          {resource.previewHref ? <a href={resource.previewHref} rel="noopener noreferrer" target="_blank">在线查看 →</a> : null}
                          <a download href={resource.fileHref}>下载原文件 ↓</a>
                        </footer>
                      </article>
                    ))}
                  </div>
                </section>
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
