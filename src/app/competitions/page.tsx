import type { Metadata } from "next";

import { CategoryEntryLayout, type CategoryEntry } from "@/components/templates/category-entry-layout";

export const metadata: Metadata = {
  title: "天目湖赛事",
  description: "南航天目湖足协赛事体系与相关信息入口。",
};

const entries = [
  { title: "当前赛事", description: "查看四项年度核心赛事、当前阶段和赛事状态，并为未来独立赛事子站保留入口结构。", meta: "四项核心赛事", status: "真实归档已接入", href: "/competitions/current", actionLabel: "进入赛事总览", featured: true },
  { title: "赛程与赛果", description: "按赛事、阶段与球队查看已核验赛果；移动端使用分组信息替代表格横向溢出。", meta: "比赛信息", status: "男女足真实赛果", href: "/competitions/schedule", actionLabel: "查看赛程" },
  { title: "赛事数据", description: "积分榜和射手榜保持独立入口，正式数据须由赛事组织方核验后发布。", meta: "数据中心", status: "结构已建立", links: [{ label: "积分榜", href: "/competitions/standings" }, { label: "射手榜", href: "/competitions/scorers" }] },
  { id: "competition-files", title: "赛事文件", description: "下载已核验的竞赛规则、秩序册、纪律决定及面向球队和公众的文件。", meta: "文件中心", status: "真实文件已接入", href: "/competitions/files", actionLabel: "进入文件中心" },
  { title: "赛事档案与范围", description: "查看2026男、女子足球院际杯归档、历届赛事资料及经确认的跨校区赛事边界。", meta: "档案与范围", status: "已有正式归档", links: [{ label: "2026男子院际杯", href: "/competitions/2026-mens-intercollege-cup" }, { label: "2026女子院际杯", href: "/competitions/2026-womens-intercollege-cup" }, { label: "历届赛事", href: "/competitions/history" }, { label: "跨校区赛事", href: "/competitions/cross-campus" }] },
  { title: "仲裁与申诉", description: "查看适用范围、申请主体、材料、流程、纪律决定和公开文件入口。", meta: "赛事治理", status: "公开流程已建立", href: "/competitions/arbitration", actionLabel: "进入治理入口" },
] as const satisfies readonly CategoryEntry[];

export default function CompetitionsPage() {
  return <CategoryEntryLayout eyebrow="TIANMUHU COMPETITIONS" title="天目湖赛事" description="聚焦比赛、赛程与赛事服务，以清晰主次连接年度赛事体系及经确认的跨校区赛事。" sectionTitle="赛事服务航线" sectionDescription="入口按比赛信息、数据、文件与治理分组，已接入男女足真实赛事归档。" notice="公开赛程、比分、球队与赛事状态均来自已核验资料；尚未公布的信息统一标注为待确认。" entries={entries} />;
}
