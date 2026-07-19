import Image from "next/image";

import { ProcessPageLayout } from "@/components/templates/process-page-layout";
import { StatusBadge } from "@/components/ui/status-badge";
import { refereeRecruitment } from "@/data/referee-recruitment";

export function RefereeRecruitment() {
  const statusPanel = <div className="recruitment-status-panel"><div><span>招募状态</span><StatusBadge tone="warning">{refereeRecruitment.statusLabel}</StatusBadge></div><dl><div><dt>群名称</dt><dd>{refereeRecruitment.groupName}</dd></div><div><dt>适用年度</dt><dd>{refereeRecruitment.academicYear}</dd></div><div><dt>有效期</dt><dd>{refereeRecruitment.validUntil}</dd></div></dl></div>;
  return (
    <ProcessPageLayout eyebrow="REFEREE RECRUITMENT" title="成为校园足球裁判员" description="通过公开、可核验的四步流程加入天目湖裁判团队；本页只提供说明与群入口，不进行在线报名。" statusPanel={statusPanel}>
      <div className="recruitment-layout">
        <section className="recruitment-steps" aria-labelledby="recruitment-steps-title"><div><p>PUBLIC PROCESS</p><h2 id="recruitment-steps-title">招募流程</h2><span>扫码进群 → 查看要求并提交报名表 → 资格审核 → 裁判培训</span></div><ol>{refereeRecruitment.steps.map((step, index) => <li key={step.id}><span>{String(index + 1).padStart(2, "0")}</span><div><small>STEP {index + 1}</small><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol></section>
        <aside className="recruitment-qr-panel" aria-labelledby="recruitment-qr-title"><div><p>OFFICIAL GROUP</p><h2 id="recruitment-qr-title">招新群入口</h2></div>{refereeRecruitment.qrImage ? <Image src={refereeRecruitment.qrImage} alt={refereeRecruitment.qrAlt} width={260} height={260} /> : <div className="qr-placeholder" role="img" aria-label={refereeRecruitment.qrAlt}><span>QR</span><strong>尚未开放</strong><small>等待协会更新官方群二维码</small></div>}<dl><div><dt>群名称</dt><dd>{refereeRecruitment.groupName}</dd></div><div><dt>适用年度</dt><dd>{refereeRecruitment.academicYear}</dd></div><div><dt>失效后联系</dt><dd><a href={`mailto:${refereeRecruitment.fallbackContact}`}>{refereeRecruitment.fallbackContact}</a></dd></div></dl><p role="note">{refereeRecruitment.notice}</p></aside>
      </div>
      <section className="process-privacy-note"><p>DATA POLICY</p><h2>本站不收集报名信息</h2><span>不提供姓名、学号、手机号或证件信息输入框，不开发在线表单、裁判员账号或真实提交功能。正式报名表只按协会在官方群内发布的通知执行。</span></section>
    </ProcessPageLayout>
  );
}
