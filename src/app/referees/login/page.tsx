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
import { ASSOCIATION_EMAIL } from "@/data/platforms";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/login" },
  title: "裁判员登录",
  description: "经协会审核启用账号的裁判员进入个人工作区，查看报名、任务与选派状态。",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function RefereeMemberLoginPage() {
  if (await getRefereeMemberSession()) redirect("/referees/workspace");
  const workspaceAvailable = !getRefereeMemberConfigurationIssue();

  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>REFEREE SIGN IN</p>
            <h1>裁判员工作区</h1>
            <p>供经协会审核并启用账号的裁判员提交执裁意向，查看个人申请状态和已发布任务。</p>
          </div>
        </section>
        <RefereeSubnav />
        <section className="functional-section">
          <div className="detail-shell referee-auth-layout">
            <article>
              <p className="functional-kicker">SECURE WORKSPACE</p>
              <h2>裁判员登录说明</h2>
              <p>
                访客可直接查看公开名录、开放比赛和正式选派公告；经审核启用账号的裁判员登录后可提交执裁意向并查看个人记录。
              </p>
            </article>
            {workspaceAvailable ? (
              <RefereeMemberLoginForm />
            ) : (
              <div className="functional-empty functional-empty-compact" role="status">
                <strong>裁判员工作区暂未开放</strong>
                <p>
                  裁判员账号申请功能暂未开放。未来将由裁判员自主申请，经协会审核通过后启用账号。如需联系裁判事务，请发送邮件至{" "}
                  <a href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</a>。
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
