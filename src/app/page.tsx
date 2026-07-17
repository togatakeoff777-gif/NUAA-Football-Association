import { HomePage } from "@/components/home/home-page";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <>
      <SiteHeader overlay />
      <HomePage />
      <SiteFooter />
    </>
  );
}
