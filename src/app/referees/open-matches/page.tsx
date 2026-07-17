import type { Metadata } from "next";
import { OpenRefereeMatches } from "@/components/referees/open-referee-matches";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  title: "开放执裁场次",
  description: "查看开放执裁场次并体验不会真实提交的裁判报名演示。",
};

export default function OpenRefereeMatchesPage() {
  return (
    <>
      <SiteHeader />
      <OpenRefereeMatches />
      <SiteFooter />
    </>
  );
}
