import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoreCompetitionPreviewPage } from "@/components/competitions/core-competition-preview-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getCoreCompetition } from "@/data/competition-directory";
import { sportsEventJsonLd } from "@/lib/structured-data";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/freshman-cup" },
  title: "2026南京航空航天大学新生杯足球赛事",
  description: "2026南京航空航天大学新生杯足球赛事信息与待公布事项。",
  openGraph: {
    title: "2026南京航空航天大学新生杯足球赛事",
    description: "赛事筹备工作已启动，竞赛规程、报名安排与赛程信息将在确认后发布。",
    url: "/competitions/freshman-cup",
  },
  twitter: {
    card: "summary_large_image",
    title: "2026南京航空航天大学新生杯足球赛事",
    description: "赛事筹备工作已启动，后续安排以协会正式公告为准。",
  },
};

export default function FreshmanCupPage() {
  const competition = getCoreCompetition("freshman-cup");
  if (!competition) notFound();

  return (
    <>
      <JsonLd
        data={sportsEventJsonLd({
          name: competition.name,
          description: competition.summary,
          path: competition.detailHref,
          status: "EventScheduled",
        })}
      />
      <CoreCompetitionPreviewPage competition={competition} />
    </>
  );
}
