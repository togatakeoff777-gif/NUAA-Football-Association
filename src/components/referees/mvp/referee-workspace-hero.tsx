import Link from "next/link";

import { RefereeMemberLogoutButton } from "@/components/referees/mvp/referee-member-logout-button";

export function RefereeWorkspaceHero({
  eyebrow,
  title,
  description,
  name,
  publicCode,
}: {
  eyebrow: string;
  title: string;
  description: string;
  name: string;
  publicCode: string;
}) {
  return <section className="functional-hero referee-workspace-hero">
    <div className="detail-shell referee-workspace-hero-inner">
      <div className="referee-workspace-heading"><p>{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>
      <details className="referee-workspace-account">
        <summary><span aria-hidden="true">{name.slice(0, 1)}</span><div><strong>{name}</strong><small>裁判员编号 {publicCode}</small></div><b aria-hidden="true">⌄</b></summary>
        <div className="referee-workspace-account-menu">
          <header><strong>{name}</strong><span>编号 {publicCode}</span></header>
          <Link href="/referees/workspace#profile">个人资料</Link>
          <Link href="/referees/workspace/account">账号与安全</Link>
          <Link href="/referees">返回公开裁判中心</Link>
          <RefereeMemberLogoutButton />
        </div>
      </details>
    </div>
  </section>;
}
