import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";
import { coreCompetitionDirectory } from "@/data/competition-directory";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/standings" }, title: "积分榜", description: "校园足球赛事积分榜入口。" };

export default function CompetitionStandingsPage() {
  return (
    <SectionIndexPage
      eyebrow="STANDINGS"
      title="积分榜"
      description="按固定赛事类别进入当前届次；历史届次继续保存在对应赛事档案中。"
      sectionTitle="四项赛事类别"
      notice="已公布的积分榜与淘汰赛对阵可在对应赛事页面查看；其余项目等待赛事发布。"
      items={coreCompetitionDirectory.map((competition) => ({
        id: competition.id,
        title: competition.shortName,
        description: competition.status === "completed"
          ? "当前届次数据已归档，可查看积分、赛制与淘汰赛关系。"
          : "当前届次积分榜与淘汰赛对阵尚未公布。",
        meta: `赛事类别 · 当前届次 ${competition.currentEdition}`,
        status: competition.status === "completed" ? "当前届次已归档" : "等待赛事公布",
        href: competition.links.standings,
        actionLabel: competition.status === "completed" ? "查看当前积分" : "查看赛事状态",
      }))}
    />
  );
}
