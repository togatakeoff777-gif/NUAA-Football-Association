import type { Metadata } from "next";

import { PublicNewsBoard } from "@/components/public-news-board";
import { DatabaseNewsBoard } from "@/components/database-news-board";
import { ListPageLayout } from "@/components/templates/list-page-layout";
import { SectionContactCard } from "@/components/ui/section-contact-card";
import { publicSectionContacts } from "@/data/contacts";
import { newsFeed, publicAnnouncements } from "@/data/content";
import { getPublishedContentPage } from "@/lib/admin-content-service";
import { isDatabaseContentSource } from "@/lib/content-source";

export const metadata: Metadata = {
  alternates: { canonical: "/news" },
  title: "新闻公告",
  description: "南京航空航天大学天目湖足球协会新闻报道与通知公告。",
};

export const dynamic = "force-dynamic";

export default async function NewsPage({ searchParams }: PageProps<"/news">) {
  const params = await searchParams;
  const cursor = typeof params.cursor === "string" ? params.cursor : undefined;
  const databasePage = isDatabaseContentSource()
    ? await getPublishedContentPage({ cursor, pageSize: 10 })
    : null;
  return (
    <ListPageLayout
      eyebrow="NEWS & NOTICES"
      title="新闻公告"
      description="集中发布赛事战报、协会动态与正式通知公告。"
      listTitle="最新发布"
      listDescription="2026新生杯筹备动态、男女子足球院际杯报道与纪律决定均可在此查阅。"
      statusLabel="新闻报道与通知公告"
    >
      {databasePage
        ? <DatabaseNewsBoard items={databasePage.items} nextCursor={databasePage.nextCursor} />
        : <PublicNewsBoard news={newsFeed} notices={publicAnnouncements} />}
      <SectionContactCard contact={publicSectionContacts.news} note="新闻投稿与内容纠错" />
    </ListPageLayout>
  );
}
