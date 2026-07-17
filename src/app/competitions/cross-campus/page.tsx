import type { Metadata } from "next";

import { SectionIndexPage } from "@/components/pages/section-index-page";

export const metadata: Metadata = {
  title: "跨校区赛事",
  description: "经确认的南京航空航天大学跨校区足球赛事信息入口。",
};

export default function CrossCampusCompetitionsPage() {
  return (
    <SectionIndexPage
      eyebrow="CROSS-CAMPUS SCOPE"
      title="跨校区赛事"
      description="仅为经相关赛事组织方确认的跨校区赛事提供信息入口。"
      sectionTitle="内容边界"
      notice="南航天目湖足协立足天目湖校区，不代表南京航空航天大学三个校区的统一足球组织，也不管理其他校区内部事务。"
      items={[
        { title: "经确认的赛事信息", description: "赛事主办方、范围与资料来源确认后再行发布。", meta: "发布原则", status: "资料待更新" },
        { title: "其他校区内部事务", description: "不在本网站默认管理与发布范围内。", meta: "职责边界", status: "不纳入管理" },
        { title: "资料核验", description: "跨校区内容须明确组织方、来源和更新责任。", meta: "内容治理", status: "按确认发布" },
      ]}
    />
  );
}
