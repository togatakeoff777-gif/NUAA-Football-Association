import type { Metadata } from "next";

import { WomensCompetitionArchivePage } from "@/components/competitions/womens-cup-2026/competition-archive-page";
import { JsonLd } from "@/components/seo/json-ld";
import { womensIntercollegeCup2026 } from "@/data/womens-intercollege-cup-2026";
import { sportsEventJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/2026-womens-intercollege-cup" },
  title: "2026女子足球院际杯赛事档案",
  description: "2026年南京航空航天大学女子足球院际杯（天目湖校区）赛事档案，包括最终名次、个人奖项、收官报道与16张原始照片。",
  openGraph: {
    title: "2026女子足球院际杯赛事档案",
    description: "最终名次、个人奖项、收官报道与16张原始照片。",
    url: "/competitions/2026-womens-intercollege-cup",
  },
};

export default function WomensIntercollegeCup2026Page() {
  const { competition } = womensIntercollegeCup2026;
  return <><JsonLd data={sportsEventJsonLd({ name: competition.canonicalTitle, description: "2026女子足球院际杯（天目湖校区）赛事档案。", path: "/competitions/2026-womens-intercollege-cup", status: "EventCompleted", startDate: "2026-04-14T00:00:00+08:00", location: competition.venue })} /><WomensCompetitionArchivePage /></>;
}
