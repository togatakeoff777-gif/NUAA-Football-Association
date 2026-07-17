import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "天目湖赛事",
  description: "南航天目湖足协赛事体系与相关信息入口。",
};

const items = [
  {
    title: "年度赛事体系",
    description:
      "展示新生杯足球赛事、天目湖五人制联赛、男子足球院际杯和女子足球院际杯四项已确认核心赛事。",
    meta: "四项核心赛事",
    status: "结构已确认",
    href: "/competitions/current",
    actionLabel: "查看当前赛事",
  },
  {
    title: "赛程与赛果",
    description:
      "后续按赛事发布经确认的赛程与赛果；当前不会将演示比分伪装为真实比赛记录。",
    meta: "赛事信息",
    status: "资料待更新",
    href: "/competitions/schedule",
    actionLabel: "查看赛程入口",
  },
  {
    title: "积分榜",
    description:
      "为不同赛事预留独立积分榜入口，正式数据需由赛事组织方核验后发布。",
    meta: "赛事数据",
    status: "演示结构",
    href: "/competitions/standings",
    actionLabel: "查看积分榜入口",
  },
  {
    title: "射手榜",
    description:
      "为经确认的球员进球统计预留独立入口，首页球员和进球数均为演示占位。",
    meta: "赛事数据",
    status: "演示结构",
    href: "/competitions/scorers",
    actionLabel: "查看射手榜入口",
  },
  {
    title: "历届赛事",
    description:
      "用于整理天目湖校区历届赛事资料，历史年份、参赛队伍和成绩均等待真实档案。",
    meta: "赛事档案",
    status: "资料待更新",
    href: "/competitions/history",
    actionLabel: "查看档案入口",
  },
  {
    title: "跨校区赛事",
    description:
      "仅收录经相关赛事组织方确认的跨校区赛事，不发布或管理其他校区组织体系内部事务。",
    meta: "内容边界",
    status: "按确认发布",
    href: "/competitions/cross-campus",
    actionLabel: "查看范围说明",
  },
  {
    title: "仲裁与申诉",
    description:
      "查看仲裁说明、申请条件、时限、流程、材料与决定公示的静态原型。",
    meta: "赛事治理",
    status: "静态原型",
    href: "/competitions/arbitration",
    actionLabel: "进入仲裁与申诉",
  },
];

export default function CompetitionsPage() {
  return (
    <SectionIndexPage
      eyebrow="TIANMUHU COMPETITIONS"
      title="天目湖赛事"
      description="汇集天目湖校区主办赛事，以及经赛事组织方确认的跨校区赛事入口。"
      sectionTitle="赛事信息入口"
      sectionDescription="赛程、比分、球队和榜单须经核验后发布；第二轮仅提供清晰标注的演示结构。"
      notice="本网站默认展示天目湖校区及经确认的跨校区内容，不代表南京航空航天大学三个校区的统一足球组织。"
      items={items}
    />
  );
}
