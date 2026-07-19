import Image from "next/image";
import Link from "next/link";

import { DemoLabel } from "@/components/ui/demo-label";
import { demoNews, featuredVideos } from "@/data/content";

export function NewsMediaSection() {
  const [featuredNews, ...compactNews] = demoNews;
  const featuredVideo = featuredVideos[0];
  return (
    <section className="home-news-media" aria-labelledby="home-news-media-title">
      <div className="page-shell">
        <div className="home-section-bar">
          <div><p>STORIES &amp; MEDIA / 新闻与影像</p><h2 id="home-news-media-title">赛场故事，与影像并行</h2></div>
          <p>新闻内容为演示，影像资料待协会确认。</p>
        </div>
        <div className="news-media-layout">
          <div className="home-news-stream">
            <article className="home-featured-news">
              <div className="home-featured-news-image"><Image src={featuredNews.image} alt={featuredNews.imageAlt} fill sizes="(max-width: 760px) 100vw, 48vw" /><DemoLabel>重点新闻 · 演示</DemoLabel></div>
              <div><span>{featuredNews.category} · {featuredNews.dateLabel}</span><h3>{featuredNews.title}</h3><p>{featuredNews.summary}</p><Link href={featuredNews.href}>阅读演示详情 <span aria-hidden="true">→</span></Link></div>
            </article>
            <div className="home-compact-news-list">
              {compactNews.slice(0, 2).map((item) => (
                <Link href={item.href} key={item.id}><time>{item.dateLabel}</time><div><span>{item.category}</span><h3>{item.title}</h3></div><b aria-hidden="true">→</b></Link>
              ))}
            </div>
            <Link className="text-link" href="/news">更多新闻 <span aria-hidden="true">→</span></Link>
          </div>
          <aside className="home-media-feature" aria-labelledby="home-media-title">
            <div className="home-media-cover"><Image src={featuredVideo.image} alt={featuredVideo.imageAlt} fill sizes="(max-width: 760px) 100vw, 42vw" /><span aria-hidden="true">▶</span><DemoLabel>{featuredVideo.badge}</DemoLabel></div>
            <div><p>{featuredVideo.category} · 南航校园足球共享视频平台</p><h3 id="home-media-title">{featuredVideo.title}</h3><span>{featuredVideo.description}</span><a href={featuredVideo.href} target="_blank" rel="noopener noreferrer" aria-label="前往南航校园足球共享视频平台，将在新标签页打开">查看共享视频平台 <b aria-hidden="true">↗</b></a><Link href="/media">进入影像中心 <b aria-hidden="true">→</b></Link></div>
          </aside>
        </div>
      </div>
    </section>
  );
}
