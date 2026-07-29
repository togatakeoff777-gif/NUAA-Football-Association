import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { AdminLoginForm } from "@/components/referees/mvp/admin-login-form";
import {
  getAdminConfigurationIssue,
  getAdminSession,
} from "@/lib/referee-auth";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/admin/login" },
  title: "裁判管理后台登录",
  description: "南京航空航天大学天目湖足球协会裁判事务授权管理入口。",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function RefereeAdminLoginPage() {
  if (await getAdminSession()) redirect("/referees/admin");
  const adminAvailable = !getAdminConfigurationIssue();

  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>REFEREE ADMIN</p>
            <h1>裁判管理后台</h1>
            <p>仅供协会授权管理人员处理裁判登记、执裁意向与选派事务。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell referee-login-shell">
            <div>
              <span>AUTHORIZED ACCESS</span>
              <h2>授权管理人员入口</h2>
              <p>后台与公众信息页面相互独立，管理权限由协会统一开通。</p>
            </div>
            {adminAvailable ? (
              <AdminLoginForm />
            ) : (
              <div className="functional-empty functional-empty-compact" role="status">
                <strong>裁判管理后台暂未开放</strong>
                <p>完成生产认证配置后，仅向协会授权管理人员提供登录入口。</p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
