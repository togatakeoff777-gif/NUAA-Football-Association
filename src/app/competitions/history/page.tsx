import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/history" },
  title: "历届赛事",
  description: "天目湖校园足球历届赛事资料预留入口。",
};

export default function CompetitionHistoryPage() {
  return (
    <SectionIndexPage
      eyebrow="COMPETITION ARCHIVE"
      title="历届赛事"
      description="用于逐步整理经确认的赛事年份、参赛信息、结果与影像档案。"
      sectionTitle="赛事档案结构"
      notice="当前不提供未经协会确认的历史年份、冠军、参赛队伍或成绩信息。"
      items={[
        { title: "赛事年表", description: "预留按年份与赛事类型浏览的归档入口。", meta: "档案结构", status: "资料待更新" },
        { title: "结果记录", description: "预留经核验后的赛果与榜单归档。", meta: "档案结构", status: "资料待更新" },
        { title: "影像资料", description: "预留获得授权并确认来源的图片与视频资料。", meta: "授权内容", status: "资料待更新" },
      ]}
    />
  );
}
