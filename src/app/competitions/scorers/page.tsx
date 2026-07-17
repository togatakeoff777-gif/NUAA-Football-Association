import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "射手榜",
  description: "天目湖校园足球赛事射手榜预留入口。",
};

export default function CompetitionScorersPage() {
  return (
    <SectionIndexPage
      eyebrow="TOP SCORERS"
      title="射手榜"
      description="为经确认的球员进球统计与赛事筛选预留发布结构。"
      sectionTitle="射手数据结构"
      notice="首页球员姓名与进球数均为演示占位，不对应任何真实个人。"
      items={[
        { title: "赛事射手榜", description: "后续按具体赛事展示经核验的进球统计。", meta: "结构占位", status: "等待真实数据" },
        { title: "统计口径", description: "预留进球认定、同分排序与数据更正说明。", meta: "规则入口", status: "等待赛事规程" },
        { title: "数据纠错", description: "预留与协会联系的数据核验和纠错入口。", meta: "维护入口", status: "资料待更新" },
      ]}
    />
  );
}
