import Link from "next/link";

export function AdminMatchNavigation({ active }: { active: "competitions" | "matches" }) {
  return <nav aria-label="比赛与选派二级导航" className="admin-tabs admin-route-tabs">
    <Link aria-current={active === "competitions" ? "page" : undefined} href="/referees/admin/matches/competitions">赛事管理</Link>
    <Link aria-current={active === "matches" ? "page" : undefined} href="/referees/admin/matches">比赛列表</Link>
  </nav>;
}
