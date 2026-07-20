import { HomePage } from "@/components/home/home-page";
import { HomeScrollController } from "@/components/home/home-scroll-controller";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader fixed overlay />
      <div className="home-scroll-shell">
        <HomePage />
      </div>
      <HomeScrollController />
    </>
  );
}
