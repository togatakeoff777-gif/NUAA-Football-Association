import type { Metadata } from "next";

import { ScheduleDataView } from "@/components/competitions/schedule-data-view";
import { DataPageLayout } from "@/components/templates/data-page-layout";
import { recentMatches } from "@/data/competitions";

export const metadata: Metadata = { title: "赛程与赛果", description: "天目湖校园足球赛程与赛果信息结构。" };

export default function CompetitionSchedulePage() {
  const filters = <div className="data-filter-controls" aria-label="演示筛选器"><label>赛事<select disabled aria-label="赛事筛选，尚未开放"><option>全部赛事</option></select></label><label>状态<select disabled aria-label="比赛状态筛选，尚未开放"><option>全部状态</option></select></label><span>筛选将在真实数据接入后开放</span></div>;
  return <DataPageLayout eyebrow="FIXTURES & RESULTS" title="赛程与赛果" description="以比赛日、对阵、比分和状态为核心；桌面端使用表格，手机端自动切换为分组列表。" dataTitle="比赛日信息" dataDescription="当前仅使用明确标注的本地演示数据；没有数据时显示正式空状态。" filters={filters} note="日期、球队、场地、比分和比赛状态均为演示数据，不代表真实赛程或历史记录。"><ScheduleDataView matches={recentMatches} /></DataPageLayout>;
}
