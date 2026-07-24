import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";
import { coreCompetitionDirectory } from "@/data/competition-directory";

export const metadata: Metadata = { title: "积分榜", description: "已核验赛事积分榜入口。" };

export default function CompetitionStandingsPage() {
  return (
    <SectionIndexPage
      eyebrow="STANDINGS"
      title="积分榜"
      description="按固定赛事类别进入当前届次；历史届次继续保存在对应赛事档案中。"
      sectionTitle="四项赛事类别"
      notice="当前届次统一由核心赛事目录维护。没有已核验积分或淘汰赛对阵时不生成空表格；淘汰赛信息使用对阵说明而非伪造积分榜。"
      items={coreCompetitionDirectory.map((competition) => ({
        id: competition.id,
        title: competition.shortName,
        description: competition.status === "completed"
          ? "当前届次数据已归档，可查看积分、赛制与淘汰赛关系。"
          : "当前届次尚无可核验积分或淘汰赛对阵，详情页保留正式空状态。",
        meta: `赛事类别 · 当前届次 ${competition.currentEdition}`,
        status: competition.status === "completed" ? "当前届次已核验" : "等待赛事公布",
        href: competition.links.standings,
        actionLabel: competition.status === "completed" ? "查看当前积分" : "查看赛事状态",
      }))}
    />
  );
}
