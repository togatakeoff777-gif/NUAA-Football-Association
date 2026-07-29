import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoreCompetitionPreviewPage } from "@/components/competitions/core-competition-preview-page";
import { getCoreCompetition } from "@/data/competition-directory";

export const metadata: Metadata = {
  alternates: { canonical: "/competitions/tianmuhu-futsal-league" },
  title: "2026天目湖五人制联赛",
  description: "2026天目湖五人制联赛公开信息与待公布事项。",
};

export default function TianmuhuFutsalLeaguePage() {
  const competition = getCoreCompetition("tianmuhu-futsal-league");
  if (!competition) notFound();

  return <CoreCompetitionPreviewPage competition={competition} />;
}
