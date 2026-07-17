import type { Metadata } from "next";
import { AssignmentPublication } from "@/components/referees/assignment-publication";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "裁判员选派公示",
  description: "十一人制与五人制裁判岗位配置和选派公示静态原型。",
};

export default function RefereeAssignmentsPage() {
  return (
    <>
      <SiteHeader />
      <AssignmentPublication />
      <SiteFooter />
    </>
  );
}
