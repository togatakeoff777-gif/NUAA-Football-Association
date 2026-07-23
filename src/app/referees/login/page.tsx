import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeMemberLoginForm } from "@/components/referees/mvp/referee-member-login-form";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import {
  getRefereeMemberConfigurationIssue,
  getRefereeMemberSession,
} from "@/lib/referee-member-auth";

export const metadata: Metadata = {
  title: "裁判员登录",
  description: "已登记裁判员进入个人工作区，查看报名、任务与选派状态。",
};
export const dynamic = "force-dynamic";

export default async function RefereeMemberLoginPage() {
  if (await getRefereeMemberSession()) redirect("/referees/workspace");
  const configurationIssue = getRefereeMemberConfigurationIssue();

  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>REFEREE SIGN IN</p>
            <h1>裁判员登录</h1>
            <p>登录后可提交执裁意向，并查看个人申请状态和已发布任务。</p>
          </div>
        </section>
        <RefereeSubnav />
        <section className="functional-section">
          <div className="detail-shell referee-auth-layout">
            <article>
              <p className="functional-kicker">SECURE WORKSPACE</p>
              <h2>公开信息与个人业务分开</h2>
              <p>
                访客可直接查看公开名录、开放比赛和正式选派公告；只有已登记裁判员登录后才能提交执裁意向和查看个人记录。
              </p>
            </article>
            <RefereeMemberLoginForm configurationIssue={configurationIssue} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
