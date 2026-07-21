"use client";

import { useEffect, useState } from "react";

export type ArchiveNavigationItem = {
  id: string;
  label: string;
};

type ArchiveSectionNavProps = {
  items: readonly ArchiveNavigationItem[];
  ariaLabel?: string;
};

export function ArchiveSectionNav({ items, ariaLabel = "赛事档案章节" }: ArchiveSectionNavProps) {
  const [activeId, setActiveId] = useState(items[0]?.id ?? "");

  useEffect(() => {
    const sections = items
      .map((item) => document.getElementById(item.id))
      .filter((section): section is HTMLElement => Boolean(section));

    if (!sections.length || typeof IntersectionObserver === "undefined") return;

    const rootStyles = getComputedStyle(document.documentElement);
    const headerHeight = Number.parseFloat(rootStyles.getPropertyValue("--header-height")) || 80;
    const navHeight = document.querySelector<HTMLElement>(".cup-archive-nav")?.offsetHeight ?? 52;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((left, right) => right.intersectionRatio - left.intersectionRatio)[0];
        if (visible?.target.id) setActiveId(visible.target.id);
      },
      {
        rootMargin: `-${headerHeight + navHeight + 8}px 0px -58% 0px`,
        threshold: [0, 0.05, 0.25, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="cup-archive-nav" aria-label={ariaLabel}>
      <div className="page-shell">
        {items.map((item) => (
          <a
            aria-current={activeId === item.id ? "location" : undefined}
            href={`#${item.id}`}
            key={item.id}
            onClick={() => setActiveId(item.id)}
          >
            {item.label}
          </a>
        ))}
      </div>
    </nav>
  );
}
