import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  alternates: { canonical: "/participation/join-association" },
  title: "加入天目湖足协",
  description: "加入南京航空航天大学天目湖足球协会的公开说明。",
};

const items = [
  {
    title: "了解协会工作",
    description:
      "协会围绕天目湖校园足球开展赛事组织、裁判事务、内容传播与相关服务。",
    meta: "参与方向",
    status: "参与说明",
  },
  {
    title: "关注正式招募通知",
    description:
      "招募时间、岗位、条件与流程将在协会确认后通过官网和“湖区FA”公众号发布。",
    meta: "招募信息",
    status: "资料待更新",
  },
  {
    title: "联系协会",
    description:
      "如需咨询，可通过协会公开邮箱联系；请勿通过非官方渠道发送敏感个人信息。",
    meta: "nuaafootball@163.com",
    status: "公开邮箱",
    href: "mailto:nuaafootball@163.com",
    external: true,
    actionLabel: "发送邮件",
  },
];

export default function JoinAssociationPage() {
  return (
    <SectionIndexPage
      eyebrow="JOIN THE ASSOCIATION"
      title="加入天目湖足协"
      description="了解协会工作方向与后续招募安排。"
      sectionTitle="加入说明"
      sectionDescription="招募方式、材料要求与报名渠道以协会正式通知为准。"
      notice="具体岗位与招募安排尚待协会更新，请以正式通知为准。"
      statusLabel="招募资料待更新"
      items={items}
    />
  );
}
