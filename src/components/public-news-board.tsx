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
  const visibleNews = filter === "events" ? news.filter((item) => item.category === "比赛战报" || item.category === "赛事新闻") : news;
  const showNews = filter !== "notices";
  const showNotices = filter === "all" || filter === "notices";
  const [featured, ...remainingNews] = visibleNews;

  return (
    <>
      <div className="list-filter-bar" aria-label="内容分类">
        {filters.map((item) => <button aria-pressed={filter === item.id} key={item.id} onClick={() => setFilter(item.id)} type="button">{item.label}</button>)}
      </div>
      <div className={`news-list-layout${showNews && showNotices ? "" : " is-single"}`}>
        {showNews ? (
          <div className="news-list-stream" id="news">
            {featured ? (
              <article className="news-list-featured">
                <Link className="news-list-featured-link" href={featured.href}>
                  <NewsImage src={featured.image} alt={featured.imageAlt} variant="featured" sizes="(max-width: 720px) 100vw, 34vw"><DemoLabel>重点新闻 · {featured.badge}</DemoLabel></NewsImage>
                  <section><span>{featured.category} · {featured.dateLabel}</span><h2>{featured.title}</h2><p>{featured.summary}</p><span className="news-read-cta">阅读全文 →</span></section>
                </Link>
              </article>
            ) : null}
            {remainingNews.map((item) => (
              <article className="news-list-row" key={item.id}>
                <Link className="news-list-row-link" href={item.href}>
                  <NewsImage src={item.image} alt={item.imageAlt} variant="list" sizes="(max-width: 720px) 100vw, 210px" />
                  <section>
                    <div className="news-row-meta"><time>{item.dateLabel}</time><span>{item.category} · {item.badge}</span></div>
                    <h2>{item.title}</h2><p>{item.summary}</p><span className="news-read-cta">阅读全文 →</span>
                  </section>
                </Link>
              </article>
            ))}
          </div>
        ) : null}
        {showNotices ? (
          <aside className="notice-list-panel" id="notices" aria-labelledby="notice-list-title">
            <div><p>OFFICIAL NOTICES</p><h2 id="notice-list-title">通知公告</h2></div>
            {notices.map((item) => (
              <article key={item.id}>
                <Link className="notice-list-link" href={item.href}>
                  <div><time>{item.dateLabel}</time><StatusBadge tone="neutral">{item.badge}</StatusBadge></div>
                  <span>{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p>
                  <span className="news-read-cta">{item.category === "纪律决定" ? "查看决定" : "阅读全文"} →</span>
                </Link>
              </article>
            ))}
            <small>通知公告按发布日期排列。</small>
          </aside>
        ) : null}
      </div>
    </>
  );
}
