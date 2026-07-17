import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "赛程与赛果",
  description: "天目湖校园足球赛程与赛果预留入口。",
};

export default function CompetitionSchedulePage() {
  return (
    <SectionIndexPage
      eyebrow="FIXTURES & RESULTS"
      title="赛程与赛果"
      description="为经赛事组织方确认的赛程、场地、比分与比赛状态预留发布结构。"
      sectionTitle="赛程信息结构"
      notice="当前无已核验的真实赛程与赛果；首页出现的日期、球队及比分均为演示数据。"
      items={[
        { title: "近期赛程", description: "预留按赛事与比赛日浏览的赛程入口。", meta: "结构占位", status: "资料待更新" },
        { title: "比赛结果", description: "预留经核验后发布的完赛比分与状态入口。", meta: "结构占位", status: "资料待更新" },
        { title: "场地与调整", description: "预留场地、开球时间及赛程调整说明。", meta: "结构占位", status: "资料待更新" },
      ]}
    />
  );
}
