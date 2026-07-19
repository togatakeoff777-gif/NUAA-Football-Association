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
  status: `${competition.displayStatus.label} · 演示`,
}));

export default function CurrentCompetitionsPage() {
  return (
    <SectionIndexPage
      eyebrow="CURRENT COMPETITIONS"
      title="当前赛事"
      description="展示任务书确认的四项核心赛事名称与年度结构。"
      sectionTitle="四项核心赛事"
      sectionDescription="当前状态均为界面演示，不构成正式开赛、报名或完赛通知。"
      notice="赛事状态、日期、队伍和成绩须待协会确认后发布；本页不虚构真实赛况。"
      items={items}
    />
  );
}
