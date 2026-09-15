"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function RefereeWorkspaceNav() {
  const pathname = usePathname();
  const current = (href: string) => href === "/referees/open-matches"
    ? pathname === href || pathname.startsWith(`${href}/`)
    : pathname === href;
  return <nav aria-label="裁判员工作区导航" className="referee-workspace-nav">
    <Link aria-current={current("/referees/workspace") ? "page" : undefined} href="/referees/workspace">工作台</Link>
    <Link aria-current={current("/referees/open-matches") ? "page" : undefined} href="/referees/open-matches">可报名场次 / 执裁意向</Link>
    <Link href="/referees/workspace#official-tasks">我的正式任务</Link>
    <Link href="/referees/workspace#task-history">历史任务</Link>
    <Link aria-current={current("/referees/workspace/availability") ? "page" : undefined} href="/referees/workspace/availability">我的可执裁时间</Link>
  </nav>;
}
