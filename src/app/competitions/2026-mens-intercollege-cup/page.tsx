import type { Metadata } from "next";

import { CompetitionArchivePage } from "@/components/competitions/mens-cup-2026/competition-archive-page";
import { JsonLd } from "@/components/seo/json-ld";
import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";
import { sportsEventJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/2026-mens-intercollege-cup" },
  title: "2026男子足球院际杯赛事档案",
  description: "2026年南京航空航天大学男子足球院际杯（天目湖校区）官方赛事档案，包括16场赛果、积分榜、球队名单、裁判安排、决赛时间线与正式报道。",
  openGraph: {
    title: "2026男子足球院际杯赛事档案",
    description: "16场赛果、积分榜、球队名单、裁判安排、决赛时间线与正式报道。",
    url: "/competitions/2026-mens-intercollege-cup",
  },
};

export default function MensIntercollegeCup2026Page() {
  const { competition } = mensIntercollegeCup2026;
  return <><JsonLd data={sportsEventJsonLd({ name: competition.name, description: "2026男子足球院际杯（天目湖校区）官方赛事档案。", path: "/competitions/2026-mens-intercollege-cup", status: "EventCompleted", startDate: "2026-03-20T00:00:00+08:00", location: competition.venue })} /><CompetitionArchivePage /></>;
}
