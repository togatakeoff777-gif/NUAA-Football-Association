import Image from "next/image";
import Link from "next/link";

import { DemoLabel } from "@/components/ui/demo-label";
import { homeNews } from "@/data/content";

export function NewsMediaSection() {
  const [featuredNews, ...compactNews] = homeNews;
  return (
    <section className="home-news-media home-screen" data-home-screen="news" id="home-news" aria-labelledby="home-news-media-title">
      <div className="page-shell home-news-shell">
        <div className="home-section-bar" data-home-reveal data-home-delay="0">
          <div><p>LATEST STORIES / 新闻动态</p><h2 id="home-news-media-title">赛场故事，持续更新</h2></div>
        </div>
        <div className="home-news-stream">
            <article className="home-featured-news" data-home-reveal data-home-delay="1">
              <div className="home-featured-news-image"><Image src={featuredNews.image} alt={featuredNews.imageAlt} fill sizes="(max-width: 760px) 100vw, 48vw" /><DemoLabel>重点新闻 · 官方数据</DemoLabel></div>
              <div><span>{featuredNews.category} · {featuredNews.dateLabel}</span><h3>{featuredNews.title}</h3><p>{featuredNews.summary}</p><Link href={featuredNews.href}>阅读全文 <span aria-hidden="true">→</span></Link></div>
            </article>
            <div className="home-compact-news-list">
              {compactNews.slice(0, 2).map((item) => (
                <Link href={item.href} key={item.id} data-home-reveal data-home-delay="2"><time>{item.dateLabel}</time><div><span>{item.category}</span><h3>{item.title}</h3></div><b aria-hidden="true">→</b></Link>
              ))}
            </div>
            <div className="home-news-actions" data-home-reveal data-home-delay="3">
              <Link className="button button-secondary" href="/news">更多新闻 <span aria-hidden="true">→</span></Link>
              <Link className="button button-secondary" href="/media">影像资料 <span aria-hidden="true">→</span></Link>
            </div>
          </div>
      </div>
    </section>
  );
}
