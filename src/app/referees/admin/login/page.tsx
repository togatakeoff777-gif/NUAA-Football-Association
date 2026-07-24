import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminLoginForm } from "@/components/referees/mvp/admin-login-form";
import { getAdminConfigurationIssue, getAdminSession } from "@/lib/referee-auth";

export const metadata: Metadata = { title: "裁判管理后台登录", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function RefereeAdminLoginPage() {
  if (await getAdminSession()) redirect("/referees/admin");
  return <><SiteHeader /><main className="functional-page" id="main-content"><section className="functional-hero"><div className="detail-shell"><p>REFEREE ADMIN</p><h1>裁判管理后台</h1><p>管理员密码与 Session secret 仅从服务器环境变量读取。</p></div></section><section className="functional-section"><div className="detail-shell referee-login-shell"><div><span>SECURE SESSION</span><h2>授权管理人员登录</h2><p>登录成功后建立 HttpOnly、SameSite=Lax 的数据库 Session。未配置环境变量时后台不会开放。</p></div><AdminLoginForm configurationIssue={getAdminConfigurationIssue()} /></div></section></main><SiteFooter /></>;
}
