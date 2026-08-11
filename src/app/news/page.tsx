import type { Metadata } from "next";
import Link from "next/link";

import { PublicNewsBoard } from "@/components/public-news-board";
import { ListPageLayout } from "@/components/templates/list-page-layout";
import { newsFeed, publicAnnouncements } from "@/data/content";
import { ASSOCIATION_EMAIL } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/news" },
  title: "新闻公告",
  description: "南京航空航天大学天目湖足球协会新闻报道与通知公告。",
};

export default function NewsPage() {
  return (
    <ListPageLayout
      eyebrow="NEWS & NOTICES"
      title="新闻公告"
      description="集中发布赛事战报、协会动态与正式通知公告。"
      listTitle="最新发布"
      listDescription="2026新生杯筹备动态、男女子足球院际杯报道与纪律决定均可在此查阅。"
      statusLabel="新闻报道与通知公告"
    >
      <PublicNewsBoard news={newsFeed} notices={publicAnnouncements} />
      <aside className="news-contact-panel">
        <div>
          <span>SUBMISSIONS & CORRECTIONS</span>
          <h2>新闻投稿与内容纠错</h2>
        </div>
        <Link href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</Link>
      </aside>
    </ListPageLayout>
  );
}
