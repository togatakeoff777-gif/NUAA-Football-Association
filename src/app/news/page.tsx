import type { Metadata } from "next";
import Link from "next/link";

import { PublicNewsBoard } from "@/components/public-news-board";
import { ListPageLayout } from "@/components/templates/list-page-layout";
import { newsFeed, publicAnnouncements } from "@/data/content";
import { ASSOCIATION_EMAIL } from "@/data/platforms";

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
      <aside className="news-contact-panel">
        <div>
          <span>SUBMISSIONS & CORRECTIONS</span>
          <h2>新闻投稿与内容纠错</h2>
        </div>
        <p>不建设公开上传表单或后台。如需投稿、补充来源或反馈内容错误，请通过协会公开邮箱联系。</p>
        <Link href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</Link>
      </aside>
    </ListPageLayout>
  );
}
