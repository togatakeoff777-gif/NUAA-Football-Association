import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageIntro } from "@/components/templates/page-intro";

type ProcessPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusPanel: React.ReactNode;
  children: React.ReactNode;
};

export function ProcessPageLayout({ eyebrow, title, description, statusPanel, children }: ProcessPageLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main className="template-page template-process-page" id="main-content">
        <PageIntro eyebrow={eyebrow} title={title} description={description} statusLabel="公开流程 · 不收集个人信息" variant="process" aside={statusPanel} />
        <section className="template-section process-body">
          <div className="page-shell">{children}<Link className="template-back-link" href="/referees">← 返回裁判中心</Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
