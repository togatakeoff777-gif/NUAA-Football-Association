"use client";

import Link from "next/link";
import { useState } from "react";

import { NewsImage } from "@/components/news/news-image";
import { DemoLabel } from "@/components/ui/demo-label";
import { StatusBadge } from "@/components/ui/status-badge";
import type { NewsItem, NoticeItem } from "@/types";

type NewsFilter = "all" | "news" | "notices" | "events";

const filters: readonly { id: NewsFilter; label: string }[] = [
  { id: "all", label: "全部" },
  { id: "news", label: "新闻" },
  { id: "notices", label: "通知公告" },
  { id: "events", label: "赛事" },
];

export function PublicNewsBoard({ news, notices }: { news: readonly NewsItem[]; notices: readonly NoticeItem[] }) {
  const [filter, setFilter] = useState<NewsFilter>("all");
  const visibleNews = filter === "events" ? news.filter((item) => item.category === "比赛战报") : news;
  const showNews = filter !== "notices";
  const showNotices = filter === "all" || filter === "notices";
  const [featured, ...remainingNews] = visibleNews;

  return (
    <>
      <div className="list-filter-bar" aria-label="内容分类">
        {filters.map((item) => <button aria-pressed={filter === item.id} key={item.id} onClick={() => setFilter(item.id)} type="button">{item.label}</button>)}
        <small>仅展示已核验的正式报道与公开决定</small>
      </div>
      <div className={`news-list-layout${showNews && showNotices ? "" : " is-single"}`}>
        {showNews ? (
          <div className="news-list-stream" id="news">
            {featured ? (
              <article className="news-list-featured">
                <NewsImage src={featured.image} alt={featured.imageAlt} variant="featured" sizes="(max-width: 720px) 100vw, 48vw"><DemoLabel>重点新闻 · {featured.badge}</DemoLabel></NewsImage>
                <section><span>{featured.category} · {featured.dateLabel}</span><h2>{featured.title}</h2><p>{featured.summary}</p><Link href={featured.href}>阅读全文 →</Link></section>
              </article>
            ) : null}
            {remainingNews.map((item) => <article className="news-list-row" key={item.id}><NewsImage src={item.image} alt={item.imageAlt} variant="list" sizes="150px" /><time>{item.dateLabel}</time><section><span>{item.category} · {item.badge}</span><h2>{item.title}</h2><p>{item.summary}</p></section><Link href={item.href} aria-label={`查看：${item.title}`}>→</Link></article>)}
          </div>
        ) : null}
        {showNotices ? (
          <aside className="notice-list-panel" id="notices" aria-labelledby="notice-list-title">
            <div><p>OFFICIAL NOTICES</p><h2 id="notice-list-title">通知公告</h2></div>
            {notices.map((item) => <article key={item.id}><div><time>{item.dateLabel}</time><StatusBadge tone="neutral">{item.badge}</StatusBadge></div><span>{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p><Link href={item.href}>查看决定原件 →</Link></article>)}
            <small>发布日期按公开决定原件核验；决定内容以原 PDF 为准。</small>
          </aside>
        ) : null}
      </div>
    </>
  );
}
