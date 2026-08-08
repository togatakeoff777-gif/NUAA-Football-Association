"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { associationIdentity } from "@/data/association";
import { navigationItems, registrationCta } from "@/data/navigation";
import { BrandMark } from "@/components/ui/brand-mark";

type SiteHeaderProps = {
  fixed?: boolean;
  overlay?: boolean;
};

function Brand() {
  return (
    <Link className="brand" href="/" aria-label={`${associationIdentity.shortName}首页`}>
      <BrandMark />
      <span className="brand-copy">
        <strong>{associationIdentity.shortName}</strong>
        <small>{associationIdentity.englishName.toUpperCase()}</small>
      </span>
    </Link>
  );
}

export function SiteHeader({ fixed = false, overlay = false }: SiteHeaderProps) {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === "/" ? pathname === href : pathname.startsWith(`${href}/`) || pathname === href;

  return (
    <>
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <header className={`${overlay ? "site-header site-header-overlay" : "site-header site-header-solid"}${fixed ? " site-header-fixed" : ""}`}>
        <div className="page-shell header-inner">
          <Brand />
          <nav className="desktop-nav" aria-label="主导航">
            {navigationItems.map((item) => (
              <Link aria-current={isCurrent(item.href) ? "page" : undefined} key={item.href} href={item.href}>{item.label}</Link>
            ))}
          </nav>
          <Link aria-current={isCurrent(registrationCta.href) ? "page" : undefined} className="header-cta" href={registrationCta.href}>
            {registrationCta.label} <span aria-hidden="true">→</span>
          </Link>
          <details className="mobile-menu">
            <summary aria-label="切换主导航"><span /><span /></summary>
            <nav aria-label="移动端主导航">
              {navigationItems.map((item) => (
                <Link aria-current={isCurrent(item.href) ? "page" : undefined} key={item.href} href={item.href}>{item.label}<span aria-hidden="true">›</span></Link>
              ))}
              <Link aria-current={isCurrent(registrationCta.href) ? "page" : undefined} href={registrationCta.href}>{registrationCta.label} <span aria-hidden="true">→</span></Link>
            </nav>
          </details>
        </div>
      </header>
    </>
  );
}
