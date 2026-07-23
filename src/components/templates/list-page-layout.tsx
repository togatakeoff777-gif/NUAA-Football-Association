import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageIntro } from "@/components/templates/page-intro";

type ListPageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  listTitle: string;
  listDescription: string;
  statusLabel?: string;
  filters?: React.ReactNode;
  children: React.ReactNode;
};

export function ListPageLayout({ eyebrow, title, description, listTitle, listDescription, statusLabel = "公开内容列表", filters, children }: ListPageLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main className="template-page template-list-page" id="main-content">
        <PageIntro eyebrow={eyebrow} title={title} description={description} statusLabel={statusLabel} variant="list" />
        <section className="template-section" aria-labelledby="list-page-title">
          <div className="page-shell">
            <div className="template-section-heading template-section-heading-compact">
              <div><p>CONTENT STREAM</p><h2 id="list-page-title">{listTitle}</h2></div>
              <span>{listDescription}</span>
            </div>
            {filters ? <div className="list-filter-bar" aria-label="内容分类">{filters}</div> : null}
            {children}
            <Link className="template-back-link" href="/">← 返回首页</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
