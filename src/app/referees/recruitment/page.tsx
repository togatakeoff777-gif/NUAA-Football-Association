import type { Metadata } from "next";

import { RefereeRecruitment } from "@/components/referees/referee-recruitment";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/recruitment" },
  title: "裁判员招募",
  description: "南航天目湖足协裁判员公开招募流程与工作区启用说明。",
};

export default function RefereeRecruitmentPage() { return <RefereeRecruitment />; }
