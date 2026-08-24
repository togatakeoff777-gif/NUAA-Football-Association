"use client";

import Link from "next/link";
import { useState } from "react";

import {
  buildCompetitionImportErrorCsv,
  COMPETITION_IMPORT_MAX_FILE_BYTES,
  type CompetitionImportCommitResult,
  type CompetitionImportInputMethod,
  type CompetitionImportPreview,
  type CompetitionImportType,
} from "@/lib/competition-import-types";

type CompetitionOption = { id: string; name: string; year: number | null };

const actionLabels = {
  CREATE: "创建",
  REUSE_EXISTING: "复用已有",
  SKIP_DUPLICATE: "跳过重复",
  CONFLICT: "冲突",
  ERROR: "错误",
} as const;

const summaryItems: Array<{ key: keyof CompetitionImportPreview["summary"]; label: string }> = [
  { key: "totalRows", label: "总行数" },
  { key: "validRows", label: "有效行" },
  { key: "createRows", label: "创建" },
  { key: "reuseRows", label: "复用" },
  { key: "skipRows", label: "跳过" },
  { key: "warningRows", label: "警告" },
  { key: "conflictRows", label: "冲突" },
  { key: "errorRows", label: "错误" },
];

function payloadSummary(value: Record<string, string | null>) {
  return Object.entries(value)
    .filter(([, item]) => item !== null && item !== "")
    .map(([key, item]) => `${key}: ${item}`)
    .join(" · ");
}

export function CompetitionImportManager({ competitions }: { competitions: CompetitionOption[] }) {
  const [competitionId, setCompetitionId] = useState(competitions[0]?.id ?? "");
  const [importType, setImportType] = useState<CompetitionImportType>("TEAM");
  const [inputMethod, setInputMethod] = useState<CompetitionImportInputMethod>("CSV");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<CompetitionImportPreview | null>(null);
  const [result, setResult] = useState<CompetitionImportCommitResult | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function resetAnalysis() {
    setPreview(null);
    setResult(null);
    setMessage("");
  }

  function formData() {
    if (!competitionId) throw new Error("请先选择赛事。");
    const form = new FormData();
    form.set("competitionId", competitionId);
    form.set("importType", importType);
    form.set("inputMethod", inputMethod);
    if (inputMethod === "PASTE") {
      if (!content.trim()) throw new Error("请粘贴待导入内容。");
      form.set("content", content);
    } else {
      if (!file) throw new Error("请选择导入文件。");
      if (file.size > COMPETITION_IMPORT_MAX_FILE_BYTES) throw new Error("导入文件不能超过 5 MB。");
      form.set("file", file);
    }
    return form;
  }

  async function request(path: "preview" | "commit") {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/competitions/import/${path}`, {
        method: "POST",
        body: formData(),
      });
      const body = await response.json() as {
        error?: string;
        preview?: CompetitionImportPreview;
        result?: CompetitionImportCommitResult;
      };
      if (body.preview) setPreview(body.preview);
      if (!response.ok) throw new Error(body.error ?? "导入请求失败。");
      if (path === "preview" && body.preview) {
        setPreview(body.preview);
        setResult(null);
        setMessage("Preview 完成；数据库未产生业务写入。请检查全部行后再提交。");
      }
      if (path === "commit" && body.result) {
        setResult(body.result);
        setPreview(body.result.preview);
        setMessage("原子提交完成。比赛报名窗口保持关闭。");
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "导入请求失败。");
    } finally {
      setBusy(false);
    }
  }

  function downloadErrors() {
    if (!preview) return;
    const blob = new Blob([buildCompetitionImportErrorCsv(preview)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nuaafa-import-errors-${preview.inputHash.slice(0, 12)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  const commitBlocked = !preview || preview.summary.errorRows > 0 || preview.summary.conflictRows > 0;
  const pastePlaceholder = importType === "TEAM"
    ? "name\tteamType\n计算机学院\tORGANIZATION\n自由组队A\tFREEFORM"
    : "homeTeam\tawayTeam\tkickoff\tendAt\tvenue\tstage\tround\n计算机学院\t电子信息工程学院\t2026-10-15 18:30\t\t天目湖校区足球场\t小组赛\t第1轮";

  return <div className="admin-import-workflow">
    <section className="admin-panel">
      <header className="admin-panel-header"><div><h2>1. 选择赛事与导入域</h2><p>只向已有 Competition 导入正式 Team / Match，不创建平行业务模型。</p></div></header>
      <div className="admin-panel-body admin-form-grid">
        <label><span>赛事</span><select value={competitionId} onChange={(event) => { setCompetitionId(event.target.value); resetAnalysis(); }}>
          {competitions.map((competition) => <option key={competition.id} value={competition.id}>{competition.name}{competition.year ? ` · ${competition.year}` : ""}</option>)}
        </select></label>
        <label><span>导入内容</span><select value={importType} onChange={(event) => { setImportType(event.target.value as CompetitionImportType); setFile(null); setContent(""); resetAnalysis(); }}>
          <option value="TEAM">球队导入</option><option value="MATCH">赛程 / 比赛导入</option>
        </select></label>
      </div>
    </section>

    <section className="admin-panel">
      <header className="admin-panel-header"><div><h2>2. 选择输入方式</h2><p>CSV 与 Paste 使用正式 CSV/TSV parser；XLSX 读取第一个工作表。上限 5 MB / 5000 行。</p></div><div className="admin-page-actions"><a className="admin-button admin-button-secondary" href={`/api/admin/competitions/import/templates/${importType === "TEAM" ? "team" : "match"}`}>下载当前 CSV 模板</a></div></header>
      <div className="admin-panel-body admin-form">
        <div className="admin-import-methods" role="radiogroup" aria-label="输入方式">
          {(["CSV", "XLSX", "PASTE"] as const).map((method) => <button aria-checked={inputMethod === method} className={inputMethod === method ? "is-active" : ""} key={method} onClick={() => { setInputMethod(method); setFile(null); setContent(""); resetAnalysis(); }} role="radio" type="button">{method === "PASTE" ? "批量粘贴" : method}</button>)}
        </div>
        {inputMethod === "PASTE" ? <label><span>TSV / Excel 粘贴内容（也可识别明确 CSV；球队可每行一个名称）</span><textarea onChange={(event) => { setContent(event.target.value); resetAnalysis(); }} placeholder={pastePlaceholder} rows={10} value={content} /></label> : <label><span>选择 {inputMethod === "CSV" ? "UTF-8 CSV" : "Excel .xlsx"} 文件</span><input accept={inputMethod === "CSV" ? ".csv,text/csv" : ".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"} onChange={(event) => { setFile(event.target.files?.[0] ?? null); resetAnalysis(); }} type="file" /></label>}
        <p className="admin-import-safety-note">文件上传导入默认为 MANUAL 数据源；系统不抓取、推断或声称存在“足球中国实时 API”。赛程导入固定创建为 SCHEDULED / CLOSED，且不设置报名截止时间。</p>
        <footer><button className="admin-button" disabled={busy || !competitions.length} onClick={() => void request("preview")} type="button">{busy ? "处理中…" : "3. Preview / Dry-run"}</button></footer>
      </div>
    </section>

    <p aria-live="polite" className="admin-form-message">{message}</p>

    {preview ? <section className="admin-panel">
      <header className="admin-panel-header"><div><h2>4. 检查 Preview</h2><p>Fingerprint: <code>{preview.inputHash}</code></p></div><div className="admin-page-actions">{preview.summary.errorRows || preview.summary.conflictRows ? <button className="admin-button admin-button-secondary" onClick={downloadErrors} type="button">下载错误 CSV</button> : null}</div></header>
      <div className="admin-panel-body">
        {preview.inputWarnings.map((warning) => <p className="admin-import-warning" key={warning}>{warning}</p>)}
        <div className="admin-import-summary">{summaryItems.map((item) => <div data-key={item.key} key={item.key}><span>{item.label}</span><strong>{preview.summary[item.key]}</strong></div>)}</div>
        {preview.importType === "MATCH" ? <p className="admin-import-team-plan">本次赛程导入将额外创建 <strong>{preview.summary.plannedTeamCreates}</strong> 支未知球队；球队与比赛将在同一事务中提交。</p> : null}
        <div className="admin-table-scroll"><table className="admin-data-table admin-import-table"><thead><tr><th>行</th><th>规范化内容</th><th>动作</th><th>球队 reconciliation</th><th>警告 / 错误</th></tr></thead><tbody>{preview.rows.map((row) => <tr data-action={row.action} key={row.rowNumber}>
          <td><strong>{row.rowNumber}</strong></td>
          <td><small>{payloadSummary(row.normalized)}</small>{row.slug ? <code>{row.slug}</code> : null}{row.differences ? <details><summary>查看字段差异</summary><pre>{JSON.stringify(row.differences, null, 2)}</pre></details> : null}</td>
          <td><span className="admin-status-badge" data-status={row.action}>{actionLabels[row.action]}</span></td>
          <td>{row.teamActions?.map((team) => <span className="admin-import-team-action" key={`${team.name}-${team.action}`}>{team.name}: {team.action}</span>) ?? "—"}</td>
          <td>{row.warnings.map((warning) => <p className="admin-import-warning" key={`${warning.field}-${warning.errorCode}`}>{warning.field} · {warning.errorCode}: {warning.message}</p>)}{row.errors.map((error) => <p className="admin-import-error" key={`${error.field}-${error.errorCode}`}>{error.field} · {error.errorCode}: {error.message}</p>)}{!row.warnings.length && !row.errors.length ? "—" : null}</td>
        </tr>)}</tbody></table></div>
        {commitBlocked ? <div className="admin-import-blocked"><strong>Commit 已阻止</strong><p>修正 ERROR / CONFLICT 后重新 Preview，或使用现有手动维护入口处理冲突。</p><div><Link href="/admin/organizations">手动维护球队</Link><Link href="/admin/matches">手动维护比赛</Link></div></div> : <div className="admin-import-confirm"><div><strong>Preview 可提交</strong><p>Commit 会在服务器重新 reconciliation；若数据已变化，整个事务回滚并返回 409。</p></div><button className="admin-button" disabled={busy} onClick={() => { if (window.confirm("确认按当前输入执行原子导入？服务器会重新校验全部行。")) void request("commit"); }} type="button">{busy ? "提交中…" : "5. 确认 Atomic Commit"}</button></div>}
      </div>
    </section> : null}

    {result ? <section className="admin-panel admin-import-result">
      <header className="admin-panel-header"><div><h2>6. Import Result</h2><p>批次已提交并写入 COMPETITION_IMPORT_COMMITTED AuditLog。</p></div></header>
      <div className="admin-panel-body"><dl><div><dt>创建球队</dt><dd>{result.createdTeams}</dd></div><div><dt>复用球队</dt><dd>{result.reusedTeams}</dd></div><div><dt>创建比赛</dt><dd>{result.createdMatches}</dd></div><div><dt>跳过重复比赛</dt><dd>{result.skippedMatches}</dd></div><div><dt>警告行</dt><dd>{result.warnings}</dd></div><div><dt>Audit reference</dt><dd><code>{result.auditId}</code></dd></div></dl></div>
    </section> : null}
  </div>;
}
