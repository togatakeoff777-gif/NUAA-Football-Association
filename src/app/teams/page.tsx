import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "天目湖球队",
  description: "天目湖校区球队信息入口与资料更新说明。",
};

const items = [
  {
    title: "球队名录",
    description:
      "未来展示经球队负责人和赛事组织方确认的天目湖球队信息；当前不虚构球队名称、队徽或阵容。",
    meta: "天目湖校区",
    status: "资料待更新",
  },
  {
    title: "参赛队伍",
    description:
      "参赛名单将按具体赛事分别发布，并明确区分天目湖赛事与经确认的跨校区赛事。",
    meta: "按赛事归档",
    status: "资料待更新",
  },
  {
    title: "球队信息维护",
    description:
      "为后续后台管理预留球队简介、负责人、队徽与赛季信息更新结构，不在本轮收集个人信息。",
    meta: "维护预留",
    status: "功能未开放",
  },
];

export default function TeamsPage() {
  return (
    <SectionIndexPage
      eyebrow="TIANMUHU TEAMS"
      title="天目湖球队"
      description="建立天目湖校园足球球队资料入口，并为后续赛事管理与球队维护预留清晰结构。"
      sectionTitle="球队信息"
      sectionDescription="本页不使用未经确认的球队、球员、队徽或历史成绩。"
      notice="当前页面为资料框架，真实球队名录将在完成授权与核验后更新。"
      items={items}
    />
  );
}
