import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/scorers" }, title: "射手记录", description: "已核验赛事射手与奖项记录入口。" };

export default function CompetitionScorersPage() {
  return (
    <SectionIndexPage
      eyebrow="SCORING RECORDS"
      title="射手记录"
      description="按赛事查看已核验的进球统计或射手奖项；缺失的个人进球数不作推测。"
      sectionTitle="赛事射手数据"
      notice="男足完整统计与女足金靴奖项分别保留在对应赛事归档；女足完整射手榜仍待赛事方确认。"
      items={[
        { title: "2026男子足球院际杯", description: "查看赛事进球统计、射手数据与奖项记录。", meta: "69粒赛事进球", status: "已核验", href: "/competitions/2026-mens-intercollege-cup#statistics", actionLabel: "查看射手数据" },
        { title: "2026女子足球院际杯", description: "当前仅公开已确认的金靴奖项，不填补缺失的个人进球数。", meta: "46粒赛事进球", status: "部分数据待确认", href: "/competitions/2026-womens-intercollege-cup#teams", actionLabel: "查看赛事记录" },
      ]}
    />
  );
}
