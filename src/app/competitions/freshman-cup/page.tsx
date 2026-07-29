import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoreCompetitionPreviewPage } from "@/components/competitions/core-competition-preview-page";
import { getCoreCompetition } from "@/data/competition-directory";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/freshman-cup" },
  title: "2026南京航空航天大学新生杯足球赛事",
  description: "2026南京航空航天大学新生杯足球赛事信息、跨校区边界与待公布事项。",
};

export default function FreshmanCupPage() {
  const competition = getCoreCompetition("freshman-cup");
  if (!competition) notFound();

  return <CoreCompetitionPreviewPage competition={competition} />;
}
