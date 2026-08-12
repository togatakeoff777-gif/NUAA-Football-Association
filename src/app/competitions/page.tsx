import type { Metadata } from "next";

import { CategoryEntryLayout, type CategoryEntry } from "@/components/templates/category-entry-layout";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions" },
  title: "赛事中心",
  description: "南京航空航天大学天目湖足球协会赛事体系与相关信息入口。",
};

const entries = [
  { title: "当前赛事", description: "查看四项年度核心赛事、当前阶段和赛事状态。", meta: "四项核心赛事", status: "2026赛季", href: "/competitions/current", actionLabel: "进入赛事总览", featured: true },
  { title: "赛程与赛果", description: "按赛事、阶段与球队查看已公布赛果，移动端可使用分组列表浏览。", meta: "比赛信息", status: "2026男女足赛果", href: "/competitions/schedule", actionLabel: "查看赛程" },
  { title: "赛事数据", description: "分别查看各项赛事已公布的积分榜、淘汰赛与射手记录。", meta: "数据中心", status: "赛事数据", links: [{ label: "积分榜", href: "/competitions/standings" }, { label: "射手榜", href: "/competitions/scorers" }] },
  { id: "competition-files", title: "赛事文件", description: "下载竞赛规则、秩序册、纪律决定及面向球队和公众的赛事文件。", meta: "文件中心", status: "赛事文件", href: "/competitions/files", actionLabel: "进入文件中心" },
  { title: "赛事档案", description: "查看2026男、女子足球院际杯归档与历届赛事资料；新生杯跨校区信息已归入对应赛事详情。", meta: "赛事档案", status: "已有正式归档", links: [{ label: "2026男子院际杯", href: "/competitions/2026-mens-intercollege-cup" }, { label: "2026女子院际杯", href: "/competitions/2026-womens-intercollege-cup" }, { label: "历届赛事", href: "/competitions/history" }] },
  { title: "仲裁与申诉", description: "查看适用范围、申请主体、材料、流程、纪律决定和公开文件入口。", meta: "赛事治理", status: "公开流程已建立", href: "/competitions/arbitration", actionLabel: "进入治理入口" },
] as const satisfies readonly CategoryEntry[];

export default function CompetitionsPage() {
  return <CategoryEntryLayout eyebrow="TIANMUHU COMPETITIONS" title="赛事中心" description="聚焦比赛、赛程与赛事服务，连接年度赛事体系及跨校区赛事。" sectionTitle="赛事服务航线" sectionDescription="按比赛信息、赛事数据、文件与赛事治理分类进入各项服务。" notice="尚未公布的赛程、球队与赛事安排统一标注为待确认。" entries={entries} />;
}
