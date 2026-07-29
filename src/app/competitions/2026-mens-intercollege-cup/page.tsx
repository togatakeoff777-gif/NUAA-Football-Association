import type { Metadata } from "next";

import { CompetitionArchivePage } from "@/components/competitions/mens-cup-2026/competition-archive-page";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/2026-mens-intercollege-cup" },
  title: "2026男子足球院际杯赛事档案",
  description: "2026年南京航空航天大学男子足球院际杯（天目湖校区）官方赛事档案，包括16场赛果、积分榜、球队名单、裁判安排、决赛时间线与正式报道。",
};

export default function MensIntercollegeCup2026Page() {
  return <CompetitionArchivePage />;
}
