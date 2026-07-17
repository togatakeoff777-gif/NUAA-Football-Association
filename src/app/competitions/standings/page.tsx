import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "积分榜",
  description: "天目湖校园足球赛事积分榜预留入口。",
};

export default function CompetitionStandingsPage() {
  return (
    <SectionIndexPage
      eyebrow="STANDINGS"
      title="积分榜"
      description="为各赛事独立积分榜、分组与排名规则预留清晰的数据入口。"
      sectionTitle="榜单发布结构"
      notice="首页积分榜为演示数据；正式积分与排名须经赛事组织方核验后发布。"
      items={[
        { title: "赛事选择", description: "后续按具体赛事与赛季切换积分榜。", meta: "结构占位", status: "等待真实数据" },
        { title: "分组积分", description: "预留比赛场次、胜平负、净胜球与积分字段。", meta: "结构占位", status: "等待真实数据" },
        { title: "排名说明", description: "预留同分排名与赛事特定规则的正式说明。", meta: "规则入口", status: "等待赛事规程" },
      ]}
    />
  );
}
