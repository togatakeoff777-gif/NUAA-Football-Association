import type { Metadata } from "next";

import { WomensCompetitionArchivePage } from "@/components/competitions/womens-cup-2026/competition-archive-page";

export const metadata: Metadata = {
  title: "2026女子足球院际杯赛事档案",
  description: "2026年南京航空航天大学女子足球院际杯（天目湖校区）赛事档案，包括最终名次、个人奖项、收官报道与16张原始照片。",
};

export default function WomensIntercollegeCup2026Page() {
  return <WomensCompetitionArchivePage />;
}
