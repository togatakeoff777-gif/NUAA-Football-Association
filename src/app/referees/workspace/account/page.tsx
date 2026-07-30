import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { RefereeSubnav } from "@/components/referees/mvp/public-appointment-list";
import { RefereePasswordForm } from "@/components/referees/mvp/referee-password-form";
import { getRefereeMemberSession } from "@/lib/referee-member-auth";

export const metadata: Metadata = {
  title: "裁判员账号与密码设置",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

const trainingLabels = {
  NOT_STARTED: "未开始",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
} as const;

export default async function RefereeAccountPage() {
  const session = await getRefereeMemberSession();
  if (!session) redirect("/referees/login");
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>ACCOUNT SETTINGS</p>
            <h1>账号与密码设置</h1>
            <p>{session.referee.publicCode} · {session.referee.name}</p>
          </div>
        </section>
        <RefereeSubnav showWorkspace />
        <section className="functional-section">
          <div className="detail-shell referee-account-settings">
            <article>
              <h2>账号状态</h2>
              <dl>
                <div><dt>账号</dt><dd>已启用</dd></div>
                <div><dt>培训状态</dt><dd>{trainingLabels[session.referee.trainingStatus]}</dd></div>
                <div><dt>密码状态</dt><dd>{session.referee.mustChangePassword ? "须修改初始密码" : "已设置"}</dd></div>
              </dl>
            </article>
            <article>
              <h2>修改密码</h2>
              <RefereePasswordForm requiredChange={session.referee.mustChangePassword} />
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
