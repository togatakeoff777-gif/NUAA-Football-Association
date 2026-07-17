import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "协会",
  description: "南京航空航天大学天目湖足球协会介绍与联系入口。",
};

const items = [
  {
    title: "协会简介",
    description:
      "南京航空航天大学天目湖足球协会成立于 2021 年，服务天目湖校园足球。",
    meta: "EST. 2021",
    status: "身份已确认",
  },
  {
    title: "发展历程",
    description:
      "用于整理经核验的协会沿革、重要活动与赛事发展记录，当前不补写未经确认的历史。",
    meta: "协会档案",
    status: "资料待更新",
  },
  {
    title: "组织与分工",
    description:
      "后续公开适合对外发布的协会职责与工作联系，不公开未经同意的私人手机号。",
    meta: "组织信息",
    status: "资料待更新",
  },
  {
    title: "联系与合作",
    description:
      "赛事咨询、协会合作、内容纠错与网站问题可通过协会邮箱联系。",
    meta: "nuaafootball@163.com",
    status: "公开邮箱",
    href: "mailto:nuaafootball@163.com",
    external: true,
    actionLabel: "发送邮件",
  },
];

export default function AssociationPage() {
  return (
    <SectionIndexPage
      eyebrow="ABOUT THE ASSOCIATION"
      title="南京航空航天大学天目湖足球协会"
      description="因热爱，奔赴绿茵。协会服务天目湖校园足球，并参与经双方确认的跨校区赛事。"
      sectionTitle="了解协会"
      sectionDescription="校徽仅作为学校归属标识，不替代天目湖足协的蓝色 FA 占位标识。"
      notice="本网站不代表南京航空航天大学三个校区的统一足球协会官网。"
      items={items}
    />
  );
}
