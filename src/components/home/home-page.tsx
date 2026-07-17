import { AnnualCompetitions } from "@/components/home/annual-competitions";
import { AssociationOverview } from "@/components/home/association-overview";
import { FeaturedVideos } from "@/components/home/featured-videos";
import { Hero } from "@/components/home/hero";
import { MatchOverview } from "@/components/home/match-overview";
import { NewsNoticesSection } from "@/components/home/news-notices-section";
import { ParticipationGuide } from "@/components/home/participation-guide";
import { PlatformMatrix } from "@/components/home/platform-matrix";
import { RankingsSection } from "@/components/home/rankings-section";
import { TeamsShowcase } from "@/components/home/teams-showcase";

export function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <MatchOverview />
      <AnnualCompetitions />
      <RankingsSection />
      <NewsNoticesSection />
      <TeamsShowcase />
      <AssociationOverview />
      <FeaturedVideos />
      <PlatformMatrix />
      <ParticipationGuide />
    </main>
  );
}
