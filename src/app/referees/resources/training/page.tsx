import type { Metadata } from "next";
import Link from "next/link";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";

export const metadata: Metadata = {
  alternates: { canonical: "/referees/resources/training" },
  title: "裁判培训资料",
  description: "裁判培训、业务学习与执裁能力提升资料入口。",
};

export default function RefereeTrainingResourcesPage() {
  return (
    <>
      <SiteHeader />
      <main className="functional-page" id="main-content">
        <section className="functional-hero">
          <div className="detail-shell">
            <p>REFEREE DEVELOPMENT</p>
            <h1>裁判培训资料</h1>
            <p>服务校园足球裁判员规则学习、业务训练与执裁能力提升。</p>
          </div>
        </section>
        <section className="functional-section">
          <div className="detail-shell referee-training-resource-shell">
            <div className="functional-section-head">
              <div><span>TRAINING RESOURCES</span><h2>培训与业务学习</h2></div>
            </div>
            <div className="functional-empty referee-training-resource-empty" role="status">
              <strong>培训资料将根据安排逐步发布</strong>
              <p>汇集协会裁判培训、业务学习与执裁能力提升资料，相关内容将根据培训安排逐步发布。</p>
            </div>
            <Link className="functional-back-link" href="/referees#referee-resources">← 返回裁判学习与资料</Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
