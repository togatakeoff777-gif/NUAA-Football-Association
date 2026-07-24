import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";
import { FOOTBALL_CHINA_URL } from "@/data/platforms";

export const metadata: Metadata = {
  title: "参赛与报名",
  description: "天目湖校园足球参赛、报名与团队加入指南入口。",
};

const items = [
  {
    title: "前往足球中国注册报名",
    description:
      "足球中国为校内足球赛事使用的外部平台入口，并非天目湖专属赛事页面。",
    meta: "外部平台",
    status: "注册与竞赛管理",
    href: FOOTBALL_CHINA_URL,
    external: true,
    openInNewTab: true,
    actionLabel: "打开足球中国",
  },
  {
    title: "赛事报名指南",
    description: "了解报名入口、基本流程及正式竞赛规程的查看方式。",
    meta: "参赛说明",
    status: "指南原型",
    href: "/participation/event-guide",
    actionLabel: "查看指南",
  },
  {
    title: "球队负责人指南",
    description: "为球队组建、信息核对和参赛事务提供基础说明。",
    meta: "球队事务",
    status: "指南原型",
    href: "/participation/team-manager-guide",
    actionLabel: "查看指南",
  },
];

export default function ParticipationPage() {
  return (
    <SectionIndexPage
      eyebrow="PARTICIPATION"
      title="参赛与报名"
      description="球员注册、球队组建、赛事报名及相关参赛资格管理统一通过足球中国平台完成。"
      sectionTitle="参赛服务入口"
      sectionDescription="指南用于解释流程与分工，正式要求以各赛事最新竞赛规程和组织方通知为准。"
      notice="本站本轮不提供真实报名提交，也不收集身份证、学号、手机号等敏感个人信息。"
      statusLabel="参赛说明 · 不会真实提交"
      items={items}
    />
  );
}
