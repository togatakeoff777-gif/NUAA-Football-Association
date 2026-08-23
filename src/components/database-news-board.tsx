import Link from "next/link";

import { NewsImage } from "@/components/news/news-image";
import { StatusBadge } from "@/components/ui/status-badge";

type PublicListItem = {
  type: "NEWS" | "ANNOUNCEMENT" | "DISCIPLINE";
  slug: string;
  title: string;
  summary: string;
  source: string | null;
  publishedAt: Date | null;
  pinned: boolean;
  cover: { url: string; altText: string | null } | null;
};

function dateLabel(value: Date | null) {
  if (!value) return "待确认";
  return new Intl.DateTimeFormat("zh-CN", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

export function DatabaseNewsBoard({ items, nextCursor }: { items: PublicListItem[]; nextCursor: string | null }) {
  const news = items.filter((item) => item.type === "NEWS");
  const notices = items.filter((item) => item.type !== "NEWS");
  const [lead, ...remaining] = news;
  return (
    <>
      <div className="list-filter-bar"><span>数据库内容 · 当前页 {items.length} 条</span></div>
      <div className={`news-list-layout${!news.length || !notices.length ? " is-single" : ""}`}>
        {news.length ? <div className="news-list-stream" id="news">
          {lead ? <article className="news-list-featured"><Link className="news-list-featured-link" href={`/news/${lead.slug}`}>
            <NewsImage alt={lead.cover?.altText ?? lead.title} sizes="(max-width: 720px) 100vw, 34vw" src={lead.cover?.url ?? "/brand/nuaa-fa-logo.jpg"} variant="featured" />
            <section><span>{lead.pinned ? "置顶 · " : ""}{dateLabel(lead.publishedAt)}</span><h2>{lead.title}</h2><p>{lead.summary}</p><span className="news-read-cta">阅读全文 →</span></section>
          </Link></article> : null}
          {remaining.map((item) => <article className="news-list-row" key={item.slug}><Link className="news-list-row-link" href={`/news/${item.slug}`}>
            <NewsImage alt={item.cover?.altText ?? item.title} sizes="(max-width: 720px) 100vw, 210px" src={item.cover?.url ?? "/brand/nuaa-fa-logo.jpg"} variant="list" />
            <section><div className="news-row-meta"><time>{dateLabel(item.publishedAt)}</time><span>{item.pinned ? "置顶 · " : ""}新闻</span></div><h2>{item.title}</h2><p>{item.summary}</p><span className="news-read-cta">阅读全文 →</span></section>
          </Link></article>)}
        </div> : null}
        {notices.length ? <aside aria-labelledby="notice-list-title" className="notice-list-panel" id="notices"><div><p>OFFICIAL NOTICES</p><h2 id="notice-list-title">通知公告</h2></div>
          {notices.map((item) => <article key={item.slug}><Link className="notice-list-link" href={`/news/${item.slug}`}><div><time>{dateLabel(item.publishedAt)}</time><StatusBadge tone="neutral">{item.pinned ? "置顶" : "最新"}</StatusBadge></div><span>{item.type === "DISCIPLINE" ? "纪律决定" : "通知公告"}</span><h3>{item.title}</h3><p>{item.summary}</p><span className="news-read-cta">{item.type === "DISCIPLINE" ? "查看决定" : "阅读全文"} →</span></Link></article>)}
        </aside> : null}
      </div>
      <nav aria-label="新闻数据库分页" className="admin-pagination news-database-pagination">
        <Link href="/news">返回第一页</Link>
        {nextCursor ? <Link href={`/news?cursor=${encodeURIComponent(nextCursor)}`}>下一页</Link> : <span>已到最后一页</span>}
      </nav>
    </>
  );
}
