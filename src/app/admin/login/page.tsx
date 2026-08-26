import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminLoginForm } from "@/components/referees/mvp/admin-login-form";
import { getAdminConfigurationIssue, getAdminSession } from "@/lib/referee-auth";
import {
  getUnifiedAdminActor,
  isUnifiedAdminPasswordChangeRequired,
} from "@/lib/unified-admin-rbac";
import {
  getAuthorizedUnifiedAdminReturnTo,
  getSafeUnifiedAdminNext,
} from "@/lib/unified-admin-routing";

export const metadata: Metadata = {
  alternates: { canonical: "/admin/login" },
  title: "统一管理后台登录",
  description: "南京航空航天大学天目湖足球协会统一管理后台入口。",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function UnifiedAdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const next = getSafeUnifiedAdminNext((await searchParams).next) ?? undefined;
  const session = await getAdminSession();
  const actor = await getUnifiedAdminActor(session);
  if (session && actor) {
    redirect(
      isUnifiedAdminPasswordChangeRequired(session)
        ? "/admin"
        : getAuthorizedUnifiedAdminReturnTo(next, actor.roles),
    );
  }
  const adminAvailable = !getAdminConfigurationIssue();

  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>UNIFIED ADMIN</p>
            <h1>统一管理后台</h1>
            <p>一个登录入口，按账号角色进入内容、赛事、裁判或系统管理模块。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell referee-login-shell">
            <div>
              <span>AUTHORIZED ACCESS</span>
              <h2>授权管理人员入口</h2>
              <p>登录后仅显示并开放当前账号获授权的模块。</p>
            </div>
            {adminAvailable ? (
              <AdminLoginForm next={next} />
            ) : (
              <div className="functional-empty functional-empty-compact" role="status">
                <strong>统一管理后台暂未开放</strong>
                <p>完成认证配置后，仅向协会授权管理人员提供登录入口。</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
