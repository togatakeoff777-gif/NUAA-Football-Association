"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const primaryNavigation = [
  { href: "/referees/admin", label: "概览", english: "Overview", exact: true },
  { href: "/referees/admin/matches", label: "比赛与选派", english: "Matches & Appointments", module: "operations" },
  { href: "/referees/admin/referees", label: "裁判员", english: "Referees", module: "referees" },
  { href: "/referees/admin/availability", label: "可执裁时间", english: "Availability", module: "referees" },
  { href: "/referees/admin/affiliations", label: "组织与球队", english: "Organizations & Teams", module: "competitions" },
  { href: "/referees/admin/conflicts", label: "冲突报告", english: "Conflict Reports", module: "referees" },
  { href: "/referees/admin/statistics", label: "执裁统计", english: "Statistics", module: "referees" },
] as const;

function isActive(pathname: string, href: string, exact = false) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

async function api(url: string, method: string, body?: unknown) {
  const response = await fetch(url, {
    method,
    headers: body === undefined ? undefined : { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = (await response.json()) as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "操作失败。");
}

export function AdminShell({
  children,
  actorName,
  roleLabel,
  canCompetitions,
  canReferees,
  canSystem,
  isLegacy,
  mustChangePassword,
}: {
  children: React.ReactNode;
  actorName: string;
  roleLabel: string;
  canCompetitions: boolean;
  canReferees: boolean;
  canSystem: boolean;
  isLegacy: boolean;
  mustChangePassword: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(mustChangePassword);
  const [message, setMessage] = useState("");

  async function logout() {
    await api("/api/referees/admin/logout", "POST");
    router.replace("/referees/admin/login");
    router.refresh();
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmation") ?? "")) {
      setMessage("两次输入的新密码不一致。");
      return;
    }
    setMessage("");
    try {
      await api("/api/referees/admin/account/password", "POST", {
        currentPassword: form.get("currentPassword"),
        newPassword,
      });
      setMessage("密码已更新，其他管理员会话已退出。");
      event.currentTarget.reset();
      setPasswordOpen(false);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "密码修改失败。");
    }
  }

  const visibleNavigation = primaryNavigation.filter((item) => {
    if (!("module" in item)) return true;
    if (item.module === "operations") return canCompetitions || canReferees;
    return item.module === "competitions" ? canCompetitions : canReferees;
  });
  return (
    <div className="admin-shell">
      <aside className={`admin-sidebar${mobileOpen ? " is-open" : ""}`}>
        <div className="admin-brand">
          <span>NUAAFA</span>
          <strong>裁判管理后台</strong>
          <small>V2.9 R1</small>
        </div>
        <nav aria-label="裁判后台导航" className="admin-navigation">
          <span className="admin-nav-label">工作台</span>
          {visibleNavigation.map((item) => (
            <Link
              aria-current={isActive(pathname, item.href, "exact" in item && item.exact) ? "page" : undefined}
              href={item.href}
              key={item.href}
              onClick={() => setMobileOpen(false)}
            >
              <i aria-hidden="true" />
              <span><strong>{item.label}</strong><small>{item.english}</small></span>
            </Link>
          ))}
          <span className="admin-nav-label admin-nav-label-system">系统管理</span>
          {canSystem ? (
            <Link aria-current={isActive(pathname, "/referees/admin/admins") ? "page" : undefined} href="/referees/admin/admins" onClick={() => setMobileOpen(false)}>
              <i aria-hidden="true" /><span><strong>管理员账号</strong><small>Administrators</small></span>
            </Link>
          ) : null}
          {canSystem ? <Link aria-current={isActive(pathname, "/referees/admin/audit-log") ? "page" : undefined} href="/referees/admin/audit-log" onClick={() => setMobileOpen(false)}>
            <i aria-hidden="true" /><span><strong>操作日志</strong><small>Audit Log</small></span>
          </Link> : null}
        </nav>
        <Link className="admin-back-link" href="/referees">← 返回裁判中心</Link>
      </aside>
      {mobileOpen ? <button aria-label="关闭后台导航" className="admin-sidebar-scrim" onClick={() => setMobileOpen(false)} type="button" /> : null}
      <div className="admin-main">
        <header className="admin-topbar">
          <button aria-label="打开后台导航" className="admin-menu-button" onClick={() => setMobileOpen(true)} type="button">☰</button>
          <div className="admin-topbar-title"><strong>裁判管理后台</strong><span>NUAAFA · V2.9 R1</span></div>
          <div className="admin-account-area">
            <button className="admin-account-trigger" onClick={() => setAccountOpen((current) => !current)} type="button">
              <span>{actorName.slice(0, 1)}</span>
              <div><strong>{actorName}</strong><small>{roleLabel}</small></div>
              <b aria-hidden="true">⌄</b>
            </button>
            {accountOpen ? <div className="admin-account-menu">
              <strong>{actorName}</strong><span>{roleLabel}{isLegacy ? " · 兼容登录" : ""}</span>
              {!isLegacy ? <button onClick={() => { setPasswordOpen(true); setAccountOpen(false); }} type="button">修改个人密码</button> : null}
              {canSystem ? <Link href="/referees/admin/admins" onClick={() => setAccountOpen(false)}>管理员账号</Link> : null}
              <button onClick={logout} type="button">退出后台</button>
            </div> : null}
          </div>
        </header>
        {mustChangePassword ? <button className="admin-password-alert" onClick={() => setPasswordOpen(true)} type="button">当前账号须完成首次密码修改 →</button> : null}
        <main className="admin-content" id="main-content">{children}</main>
      </div>
      {passwordOpen && !isLegacy ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog">
        <div className="admin-modal admin-modal-compact">
          <header><div><span>ACCOUNT SECURITY</span><h2>修改个人密码</h2></div><button aria-label="关闭" onClick={() => setPasswordOpen(false)} type="button">×</button></header>
          <form className="admin-form" onSubmit={changePassword}>
            <label><span>当前密码</span><input autoComplete="current-password" name="currentPassword" required type="password" /></label>
            <label><span>新密码</span><input autoComplete="new-password" minLength={12} name="newPassword" required type="password" /></label>
            <label><span>再次输入新密码</span><input autoComplete="new-password" minLength={12} name="confirmation" required type="password" /></label>
            <p aria-live="polite" className="admin-form-message">{message}</p>
            <footer><button className="admin-button admin-button-secondary" onClick={() => setPasswordOpen(false)} type="button">取消</button><button className="admin-button" type="submit">保存新密码</button></footer>
          </form>
        </div>
      </div> : null}
    </div>
  );
}
