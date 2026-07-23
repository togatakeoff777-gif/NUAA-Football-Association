import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = { title: "积分榜", description: "已核验赛事积分榜入口。" };

export default function CompetitionStandingsPage() {
  return (
    <SectionIndexPage
      eyebrow="STANDINGS"
      title="积分榜"
      description="按赛事进入已经核验的积分榜与排名记录。"
      sectionTitle="已公开积分榜"
      notice="2026男、女子足球院际杯积分数据均复用赛事结构化归档；尚未公布的赛事不生成空榜单。"
      items={[
        { title: "2026男子足球院际杯", description: "查看A、B组最终积分、晋级关系与赛事归档。", meta: "8支球队", status: "已核验", href: "/competitions/2026-mens-intercollege-cup#standings", actionLabel: "查看积分榜" },
        { title: "2026女子足球院际杯", description: "查看3支球队的最终积分和排名。", meta: "3支球队", status: "已核验", href: "/competitions/2026-womens-intercollege-cup#standings", actionLabel: "查看积分榜" },
      ]}
    />
  );
}
