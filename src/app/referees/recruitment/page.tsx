import type { Metadata } from "next";

import { RefereeRecruitment } from "@/components/referees/referee-recruitment";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/recruitment" },
  title: "裁判员招募",
  description: "南京航空航天大学天目湖足球协会裁判员公开招募流程与工作区启用说明。",
};

export default function RefereeRecruitmentPage() { return <RefereeRecruitment />; }
