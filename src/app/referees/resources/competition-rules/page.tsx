import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { publicCompetitionFiles } from "@/data/competition-center";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/resources/competition-rules" },
  title: "竞赛规则",
  description: "集中查阅十一人制、五人制足球竞赛规则及现有规则变更说明。",
};

const ruleGroups = [
  {
    id: "eleven-a-side",
    eyebrow: "ELEVEN-A-SIDE",
    title: "十一人制竞赛规则",
    description: "查阅十一人制足球竞赛规则中文文件及现有规则变更说明。",
    fileIds: ["football-laws-2025-26", "football-laws-changes-2026-27"],
  },
  {
    id: "futsal",
    eyebrow: "FUTSAL",
    title: "五人制竞赛规则",
    description: "查阅五人制足球竞赛规则中文文件。",
    fileIds: ["futsal-laws-2025-26"],
  },
] as const;

export default function CompetitionRulesPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page referee-rules-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>COMPETITION RULES</p>
            <h1>竞赛规则</h1>
            <p>集中查阅十一人制、五人制足球竞赛规则及现有规则变更说明。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell referee-rule-groups">
            {ruleGroups.map((group) => {
              const files = group.fileIds
                .map((fileId) => publicCompetitionFiles.find((file) => file.id === fileId))
                .filter((file) => file !== undefined);

              return (
                <section id={group.id} key={group.id} aria-labelledby={`${group.id}-title`}>
                  <header>
                    <span>{group.eyebrow}</span>
                    <h2 id={`${group.id}-title`}>{group.title}</h2>
                    <p>{group.description}</p>
                  </header>
                  <div className="referee-resource-file-list">
                    {files.map((file) => (
                      <article key={file.id}>
                        <span>{file.fileType}</span>
                        <div>
                          <h3>{file.title}</h3>
                          <p>{file.scope} · {file.source}</p>
                          <small>{file.versionStatusLabel} · {file.versionNote}</small>
                        </div>
                        <a href={file.href} target="_blank" rel="noopener noreferrer">查看规则文件</a>
                      </article>
                    ))}
                  </div>
                </section>
              );
            })}
            <Link className="functional-back-link" href="/referees#referee-resources">← 返回学习与资料</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
