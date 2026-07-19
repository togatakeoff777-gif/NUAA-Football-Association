import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { ListPageLayout } from "@/components/templates/list-page-layout";
import { DemoLabel } from "@/components/ui/demo-label";
import { StatusBadge } from "@/components/ui/status-badge";
import { contentDemoNotice, demoAnnouncements, demoNews } from "@/data/content";

export const metadata: Metadata = { title: "新闻与公告", description: "南航天目湖足协新闻与通知公告入口。" };

export default function NewsPage() {
  const [featured, ...news] = demoNews;
  const filters = <><span aria-current="true">全部</span><span>新闻</span><span>通知公告</span><span>赛事</span><small>筛选功能待内容系统接入后开放</small></>;
  return (
    <ListPageLayout eyebrow="NEWS & NOTICES" title="新闻与公告" description="用高密度列表连接比赛战报、协会动态和正式公告，并为未来筛选与分页预留结构。" listTitle="最新发布" listDescription={contentDemoNotice} filters={filters}>
      <div className="news-list-layout">
        <div className="news-list-stream">
          <article className="news-list-featured">
            <div><Image src={featured.image} alt={featured.imageAlt} fill sizes="(max-width: 720px) 100vw, 48vw" /><DemoLabel>重点新闻 · 演示</DemoLabel></div>
            <section><span>{featured.category} · {featured.dateLabel}</span><h2>{featured.title}</h2><p>{featured.summary}</p><Link href={featured.href}>查看演示详情 →</Link></section>
          </article>
          {news.map((item) => <article className="news-list-row" key={item.id}><div><Image src={item.image} alt={item.imageAlt} fill sizes="150px" /></div><time>{item.dateLabel}</time><section><span>{item.category}</span><h2>{item.title}</h2><p>{item.summary}</p></section><Link href={item.href} aria-label={`查看：${item.title}`}>→</Link></article>)}
        </div>
        <aside className="notice-list-panel" id="notices" aria-labelledby="notice-list-title">
          <div><p>OFFICIAL NOTICES</p><h2 id="notice-list-title">通知公告</h2></div>
          {demoAnnouncements.map((item) => <article key={item.id}><div><time>{item.dateLabel}</time><StatusBadge tone={item.publicationStatus === "置顶" ? "warning" : "neutral"}>{item.publicationStatus} · 演示</StatusBadge></div><span>{item.category}</span><h3>{item.title}</h3><p>{item.summary}</p></article>)}
          <small>公告均为界面演示，不构成真实报名、规程或赛程通知。</small>
        </aside>
      </div>
    </ListPageLayout>
  );
}
