"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type ExistingReferee = {
  id: string;
  publicCode: string;
  name: string;
  status: string;
  studentId: string;
};

export function AdminAdmissionReviewForm({
  applicationId,
  existingReferees,
}: {
  applicationId: string;
  existingReferees: ExistingReferee[];
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"CREATE_NEW" | "LINK_EXISTING">("CREATE_NEW");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function review(action: "APPROVE" | "REJECT", form: HTMLFormElement) {
    if (submitting) return;
    const data = new FormData(form);
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/referees/admin/admission-applications/${applicationId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(action === "REJECT" ? {
          action,
          reviewNote: data.get("reviewNote"),
        } : {
          action,
          reviewNote: data.get("reviewNote"),
          mode,
          publicCode: data.get("publicCode"),
          existingRefereeId: data.get("existingRefereeId"),
          initialPassword: data.get("initialPassword"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "审核操作失败。");
        return;
      }
      setMessage(action === "APPROVE" ? "准入申请已通过，账号闭环已完成。" : "准入申请已拒绝。未创建或启用账号。");
      router.refresh();
    } catch {
      setMessage("网络连接异常，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-form admin-form-section" onSubmit={(event) => {
      event.preventDefault();
      void review("APPROVE", event.currentTarget);
    }}>
      <header><h2>审核决定</h2><p>通过时必须创建新账号，或通过明确的 referee ID 关联现有账号；不会按姓名、手机号或 QQ 自动匹配。</p></header>
      <label><span>审核意见</span><textarea maxLength={500} name="reviewNote" required rows={4} /></label>
      <fieldset className="admin-form-section">
        <legend>通过后的账号处理</legend>
        <div className="admin-form-grid">
          <label><span>处理方式</span><select onChange={(event) => setMode(event.target.value as typeof mode)} value={mode}><option value="CREATE_NEW">创建新裁判员账号</option><option value="LINK_EXISTING">明确关联现有账号</option></select></label>
          {mode === "CREATE_NEW" ? <label><span>裁判员编号</span><input maxLength={32} name="publicCode" required /></label> : <label><span>现有裁判员（明确选择）</span><select name="existingRefereeId" required><option value="">请选择</option>{existingReferees.map((referee) => <option key={referee.id} value={referee.id}>{referee.publicCode} · {referee.name} · {referee.studentId || "无学号"} · {referee.status}</option>)}</select></label>}
          <label><span>初始密码</span><input autoComplete="new-password" minLength={12} name="initialPassword" required type="password" /></label>
        </div>
        <p className="admin-form-message">临时明文密码只用于本次请求，不写入数据库、日志或 AuditLog。</p>
      </fieldset>
      <p aria-live="polite" className="admin-form-message">{message}</p>
      <footer>
        <button className="admin-button admin-button-secondary" disabled={submitting} onClick={(event) => {
          event.preventDefault();
          void review("REJECT", event.currentTarget.form!);
        }} type="button">拒绝申请</button>
        <button className="admin-button" disabled={submitting} type="submit">{submitting ? "处理中…" : "通过并完成账号闭环"}</button>
      </footer>
    </form>
  );
}
