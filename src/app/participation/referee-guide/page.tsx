import type { Metadata } from "next";

import { RefereeRecruitment } from "@/components/referees/referee-recruitment";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/recruitment" },
  title: "裁判员注册指南",
  description: "天目湖足协裁判员加入、公开招募流程与工作区启用说明。",
};

export default function RefereeGuidePage() { return <RefereeRecruitment />; }
