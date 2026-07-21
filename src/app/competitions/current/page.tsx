import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";
import { annualCompetitions } from "@/data/competitions";

export const metadata: Metadata = {
  title: "当前赛事",
  description: "南航天目湖足协四项核心赛事的静态信息入口。",
};

const items = annualCompetitions.map((competition) => ({
  id: competition.slug,
  title: competition.name,
  description: competition.organizerNote,
  meta: `${competition.semesterLabel} · ${competition.eventType}`,
  status: `${competition.displayStatus.label} · ${competition.displayStatus.badge}`,
  href: competition.detailHref,
  actionLabel: competition.displayStatus.dataStatus === "confirmed" ? "查看正式档案" : "查看赛事入口",
}));

export default function CurrentCompetitionsPage() {
  return (
    <SectionIndexPage
      eyebrow="CURRENT COMPETITIONS"
      title="当前赛事"
      description="展示任务书确认的四项核心赛事名称与年度结构。"
      sectionTitle="四项核心赛事"
      sectionDescription="2026男子足球院际杯已接入官方归档，其余赛事继续保留明确标注的演示状态。"
      notice="正式赛事数据均标注“官方数据”；其余日期、队伍和成绩仍须待协会确认后发布。"
      items={items}
    />
  );
}
