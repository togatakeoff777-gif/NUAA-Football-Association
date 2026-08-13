import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export type SectionIndexItem = {
  id?: string;
  title: string;
  description: string;
  meta?: string;
  status?: string;
  href?: string;
  external?: boolean;
  openInNewTab?: boolean;
  actionLabel?: string;
};

type SectionIndexPageProps = {
  eyebrow: string;
  title: string;
  description: string;
  sectionTitle?: string;
  sectionDescription?: string;
  notice?: string;
  statusLabel?: string;
  pageClassName?: string;
  items: SectionIndexItem[];
};

function IndexCard({ item }: { item: SectionIndexItem }) {
  const content = (
    <>
      <div className="index-card-topline">
        {item.meta ? <span className="index-card-meta">{item.meta}</span> : null}
        {item.status ? (
          <span className="index-card-status">{item.status}</span>
        ) : null}
      </div>
      <h3 className="index-card-title">{item.title}</h3>
      <p className="index-card-description">{item.description}</p>
      {item.href ? (
        <span className="index-card-action">
          {item.actionLabel ?? "查看入口"}
          {item.openInNewTab ? "（新窗口）" : ""}
          <span aria-hidden="true">→</span>
        </span>
      ) : null}
    </>
  );

  if (!item.href) {
    return <article className="index-card" id={item.id}>{content}</article>;
  }

  if (item.external) {
    return (
      <a
        className="index-card index-card-link"
        id={item.id}
        href={item.href}
        target={item.openInNewTab ? "_blank" : undefined}
        rel={item.openInNewTab ? "noopener noreferrer" : undefined}
        aria-label={item.openInNewTab ? `${item.title}，将在新标签页打开` : undefined}
      >
        {content}
      </a>
    );
  }

  return (
    <Link className="index-card index-card-link" href={item.href} id={item.id}>
      {content}
    </Link>
  );
}

export function SectionIndexPage({
  eyebrow,
  title,
  description,
  sectionTitle = "页面入口",
  sectionDescription,
  notice,
  statusLabel = "公开信息",
  pageClassName,
  items,
}: SectionIndexPageProps) {
  return (
    <>
      <SiteHeader />
      <main className={`detail-page${pageClassName ? ` ${pageClassName}` : ""}`} id="main-content">
        <section className="detail-hero" aria-labelledby="detail-page-title">
          <div className="page-shell detail-hero-inner">
            <p className="detail-eyebrow">{eyebrow}</p>
            <h1 id="detail-page-title">{title}</h1>
            <p className="detail-lead">{description}</p>
            <span className="detail-status">{statusLabel}</span>
          </div>
        </section>

        <section className="index-section" aria-labelledby="section-index-title">
          <div className="page-shell index-shell">
            <div className="index-heading">
              <div>
                <p className="index-eyebrow">SECTION INDEX</p>
                <h2 id="section-index-title">{sectionTitle}</h2>
              </div>
              {sectionDescription ? <p>{sectionDescription}</p> : null}
            </div>

            {notice ? (
              <p className="index-notice" role="note">
                {notice}
              </p>
            ) : null}

            <div className="index-grid">
              {items.map((item) => (
                <IndexCard item={item} key={item.title} />
              ))}
            </div>

            <div className="index-actions">
              <Link className="index-home-link" href="/">
                <span aria-hidden="true">←</span>
                返回首页
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
