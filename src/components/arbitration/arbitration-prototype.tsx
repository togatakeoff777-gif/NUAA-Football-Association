import Link from "next/link";

import {
  arbitrationGuide,
  arbitrationPublicNotice,
  arbitrationResources,
} from "@/data/arbitration";

function DefinitionSection({ title, items }: { title: string; items: readonly string[] }) {
  return <section><h3>{title}</h3><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul></section>;
}

export function ArbitrationPrototype() {
  return (
    <main className="functional-page" id="main-content">
      <section className="functional-hero">
        <div className="detail-shell"><p>ARBITRATION & APPEALS</p><h1>仲裁与申诉</h1><p>公开申请范围、主体、材料、处理步骤和真实文件入口；本轮不收集个人信息，也不开放在线提交。</p></div>
      </section>

      <section className="functional-section">
        <div className="detail-shell">
          <div className="functional-notice"><strong>受理边界</strong><p>{arbitrationPublicNotice}</p></div>
          <div className="arbitration-definition-grid">
            <DefinitionSection title="适用范围" items={arbitrationGuide.scope} />
            <DefinitionSection title="不予受理" items={arbitrationGuide.notAccepted} />
            <DefinitionSection title="申请主体" items={arbitrationGuide.applicants} />
            <DefinitionSection title="准备材料" items={arbitrationGuide.materials} />
          </div>
          <section className="arbitration-deadline"><span>申请时限</span><strong>{arbitrationGuide.deadline}</strong></section>
        </div>
      </section>

      <section className="functional-section functional-section-tint" aria-labelledby="arbitration-process-title">
        <div className="detail-shell">
          <div className="functional-section-head"><div><span>PUBLIC PROCESS</span><h2 id="arbitration-process-title">处理流程</h2></div><p>提交方式未确认前，不使用虚构联系人或无持久化能力的假表单。</p></div>
          <ol className="arbitration-process-list">{arbitrationGuide.process.map((step, index) => <li key={step.id}><span>{String(index + 1).padStart(2, "0")}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></li>)}</ol>
          <div className="arbitration-contact-state"><span>{arbitrationGuide.submission.status}</span><p>{arbitrationGuide.submission.contact}</p></div>
        </div>
      </section>

      <section className="functional-section" aria-labelledby="arbitration-resources-title">
        <div className="detail-shell">
          <div className="functional-section-head"><div><span>FILES & DECISIONS</span><h2 id="arbitration-resources-title">材料与决定</h2></div><p>只提供任务包内存在的真实文件；缺失模板保持正式空状态。</p></div>
          <div className="arbitration-resource-list">{arbitrationResources.map((resource) => <article key={resource.title}><span>{resource.status}</span><h3>{resource.title}</h3><p>{resource.description}</p>{"href" in resource ? <Link href={resource.href}>查看文件 →</Link> : null}</article>)}</div>
        </div>
      </section>
    </main>
  );
}
