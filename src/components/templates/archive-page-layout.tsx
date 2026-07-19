import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { PageIntro } from "@/components/templates/page-intro";

type ArchivePageLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  identity: React.ReactNode;
  children: React.ReactNode;
};

export function ArchivePageLayout({ eyebrow, title, description, identity, children }: ArchivePageLayoutProps) {
  return (
    <>
      <SiteHeader />
      <main className="template-page template-archive-page" id="main-content">
        <PageIntro eyebrow={eyebrow} title={title} description={description} statusLabel="协会公开档案 · V2.1" variant="archive" aside={identity} />
        <section className="template-section archive-body">
          <div className="page-shell">{children}<Link className="template-back-link" href="/">← 返回首页</Link></div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
