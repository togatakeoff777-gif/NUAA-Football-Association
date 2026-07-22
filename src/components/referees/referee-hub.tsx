import Link from "next/link";

const functionalEntries = [
  { href: "/referees/directory", title: "注册裁判员名录", copy: "查看可公开的裁判员编号、姓名及已登记赛制。" },
  { href: "/referees/open-matches", title: "待选派比赛", copy: "查看岗位需求并提交真实、可持久化的执裁意向。" },
  { href: "/referees/assignments", title: "选派公告", copy: "仅展示管理员已经发布且未撤回的选派结果。" },
  { href: "/referees/history", title: "历史选派记录", copy: "按比赛回看已公开的历史裁判组记录。" },
] as const;

const ruleFiles = [
  { href: "/documents/rules/football/2025-26-laws-of-the-game-zh.pdf", title: "2025/26 足球竞赛规则（中文）" },
  { href: "/documents/rules/futsal/2025-26-fifa-futsal-laws-zh.pdf", title: "2025/26 五人制足球竞赛规则（中文）" },
  { href: "/documents/templates/eleven-a-side-match-report.pdf", title: "十一人制比赛报告表" },
] as const;

export function RefereeHub() {
  return (
    <main className="functional-page referee-center" id="main-content">
      <section className="functional-hero"><div className="detail-shell"><p>REFEREE OPERATIONS</p><h1>裁判中心</h1><p>连接公开名录、执裁意向、管理员审核、裁判组选派、公示与历史归档的真实工作流程。</p></div></section>
      <section className="functional-section"><div className="detail-shell">
        <div className="functional-section-head"><div><span>PUBLIC SERVICES</span><h2>从待选派比赛到公开选派</h2></div><p>报名只引用注册裁判员名录 ID，不重复收集手机号、证件号等个人敏感信息。</p></div>
        <div className="referee-entry-list">{functionalEntries.map((entry, index) => <Link href={entry.href} key={entry.href}><span>0{index + 1}</span><div><h3>{entry.title}</h3><p>{entry.copy}</p></div><strong>进入 →</strong></Link>)}</div>
      </div></section>
      <section className="functional-section functional-section-tint"><div className="detail-shell">
        <div className="functional-section-head"><div><span>DEVELOPMENT &amp; LAWS</span><h2>加入、培训与规则资料</h2></div><p>正式规则文件保留原始版本；招募流程不收集在线个人信息。</p></div>
        <div className="referee-resource-grid"><article><h3>加入裁判队伍</h3><p>扫码、阅读要求、提交赛事通知指定材料并参加培训。</p><Link href="/referees/recruitment">查看公开招募流程 →</Link></article><article><h3>规则与工作表</h3><ul>{ruleFiles.map((file) => <li key={file.href}><a href={file.href}>{file.title}</a></li>)}</ul></article><article><h3>管理入口</h3><p>仅供授权管理人员审核报名、保存选派草稿、发布及撤回公告。</p><Link href="/referees/admin/login">管理员登录 →</Link></article></div>
      </div></section>
    </main>
  );
}
