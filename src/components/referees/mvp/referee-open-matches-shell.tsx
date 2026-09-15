import type { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { RefereeWorkspaceHero } from "@/components/referees/mvp/referee-workspace-hero";
import { RefereeWorkspaceNav } from "@/components/referees/mvp/referee-workspace-nav";

type RefereeOpenMatchesShellProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  member: { name: string; publicCode: string } | null;
  title: string;
  workspaceDescription?: string;
};

export function RefereeOpenMatchesShell({
  children,
  description,
  eyebrow,
  member,
  title,
  workspaceDescription,
}: RefereeOpenMatchesShellProps) {
  return <>
    <SiteHeader />
    <main className="functional-page" id="main-content">
      {member
        ? <RefereeWorkspaceHero description={workspaceDescription ?? description} eyebrow={eyebrow} name={member.name} publicCode={member.publicCode} title={title} />
        : <section className="functional-hero"><div className="detail-shell"><p>{eyebrow}</p><h1>{title}</h1><p>{description}</p></div></section>}
      {member ? <RefereeWorkspaceNav /> : <RefereeSubnav />}
      {children}
    </main>
    <SiteFooter />
  </>;
}
