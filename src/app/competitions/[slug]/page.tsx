import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { CoreCompetitionPreviewPage } from "@/components/competitions/core-competition-preview-page";
import { JsonLd } from "@/components/seo/json-ld";
import { getPublicCompetition } from "@/lib/public-competition-service";
import { sportsEventJsonLd } from "@/lib/structured-data";

export const dynamic = "force-dynamic";

type PublicCompetitionPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PublicCompetitionPageProps): Promise<Metadata> {
  const { slug } = await params;
  const competition = await getPublicCompetition(slug);
  if (!competition) return { title: "赛事不存在" };
  return {
    alternates: { canonical: competition.detailHref },
    title: competition.name,
    description: competition.summary,
    openGraph: { title: competition.name, description: competition.summary, url: competition.detailHref },
  };
}

export default async function PublicCompetitionPage({ params }: PublicCompetitionPageProps) {
  const { slug } = await params;
  const competition = await getPublicCompetition(slug);
  if (!competition) notFound();
  return (
    <>
      <JsonLd data={sportsEventJsonLd({
        name: competition.name,
        description: competition.summary,
        path: competition.detailHref,
        status: competition.status === "completed" ? "EventCompleted" : "EventScheduled",
      })} />
      <CoreCompetitionPreviewPage competition={competition} />
    </>
  );
}
