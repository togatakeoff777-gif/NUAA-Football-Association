import { AssociationSummary } from "@/components/home/association-summary";
import { CurrentCompetitions } from "@/components/home/current-competitions";
import { Hero } from "@/components/home/hero";
import { MatchCenter } from "@/components/home/match-center";
import { NewsMediaSection } from "@/components/home/news-media-section";
import { NoticeQuickLinks } from "@/components/home/notice-quick-links";

export function HomePage() {
  return (
    <main id="main-content">
      <Hero />
      <MatchCenter />
      <NoticeQuickLinks />
      <CurrentCompetitions />
      <NewsMediaSection />
      <AssociationSummary />
    </main>
  );
}
