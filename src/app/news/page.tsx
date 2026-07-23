import type { Metadata } from "next";

import { PublicNewsBoard } from "@/components/public-news-board";
import { ListPageLayout } from "@/components/templates/list-page-layout";
import { newsFeed, publicAnnouncements } from "@/data/content";

export const metadata: Metadata = { title: "新闻与公告", description: "南航天目湖足协已核验新闻报道与公开通知公告。" };

export default function NewsPage() {
  return (
    <ListPageLayout
      eyebrow="NEWS & NOTICES"
      title="新闻与公告"
      description="集中发布赛事战报、协会动态与经核验的正式公告。"
      listTitle="最新发布"
      listDescription="2026男、女子足球院际杯正式报道与四份公开纪律决定已经归档。"
      statusLabel="正式报道与公开决定"
    >
      <PublicNewsBoard news={newsFeed} notices={publicAnnouncements} />
    </ListPageLayout>
  );
}
