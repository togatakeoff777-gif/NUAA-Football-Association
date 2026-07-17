import type { Metadata } from "next";
import { RefereeHub } from "@/components/referees/referee-hub";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "裁判与规则",
  description: "天目湖校园足球裁判事务、执裁报名、选派公示与竞赛规则入口。",
};

export default function RefereesPage() {
  return (
    <>
      <SiteHeader />
      <RefereeHub />
      <SiteFooter />
    </>
  );
}
