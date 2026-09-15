"use client";

import Link from "next/link";

import { RefereeMemberLogoutButton } from "@/components/referees/mvp/referee-member-logout-button";

export function RefereeWorkspaceNav() {
  return <nav aria-label="裁判员工作区导航" className="referee-workspace-nav">
    <Link href="/referees/workspace">工作台</Link>
    <Link href="/referees/open-matches">可报名场次 / 执裁意向</Link>
    <Link href="/referees/workspace#official-tasks">我的正式任务</Link>
    <Link href="/referees/workspace#task-history">历史任务</Link>
    <Link href="/referees/workspace/availability">我的可执裁时间</Link>
    <Link href="/referees/workspace#profile">个人资料</Link>
    <Link href="/referees/workspace/account">账号与安全</Link>
    <RefereeMemberLogoutButton />
    <Link className="referee-workspace-nav-public" href="/referees">返回公开裁判中心</Link>
  </nav>;
}
