import { AssociationSummary } from "@/components/home/association-summary";
import { CurrentCompetitions } from "@/components/home/current-competitions";
import { Hero } from "@/components/home/hero";
import { FreshmanCupServiceDesk } from "@/components/home/freshman-cup-service-desk";
import { NewsMediaSection } from "@/components/home/news-media-section";
import { NoticeQuickLinks } from "@/components/home/notice-quick-links";
import { SiteFooter } from "@/components/layout/site-footer";

export function HomePage() {
  return (
    <main className="home-fullpage" id="main-content">
      <Hero />
      <FreshmanCupServiceDesk />
      <NoticeQuickLinks />
      <CurrentCompetitions />
      <NewsMediaSection />
      <section
        className="home-screen home-about-screen"
        data-home-screen="about"
        id="home-about"
        aria-labelledby="home-association-title"
      >
        <AssociationSummary />
      </section>
      <div className="home-footer-flow" id="home-footer">
        <SiteFooter homeCompact />
      </div>
    </main>
  );
}
