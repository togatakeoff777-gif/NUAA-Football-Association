"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const conflictReasons = [
  ["TIME_CONFLICT", "时间冲突"],
  ["UNABLE_TO_ATTEND", "临时无法到场"],
  ["COURSE_EXAM", "课程/考试"],
  ["HEALTH", "身体原因"],
  ["OTHER", "其他"],
] as const;

export function RefereeTaskActions({ appointmentId, acknowledgedAt, reportStatus }: { appointmentId: string; acknowledgedAt: string | null; reportStatus: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function run(url: string, body?: unknown) {
    setSubmitting(true);
    setMessage("");
    const response = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);
    setMessage(response.ok ? "操作已保存。" : result.error ?? "操作失败。");
    if (response.ok) { setOpen(false); router.refresh(); }
  }

  return <div className="referee-task-actions">
    <button disabled={submitting || Boolean(acknowledgedAt)} onClick={() => void run(`/api/referees/appointments/${appointmentId}/acknowledge`)} type="button">{acknowledgedAt ? `已确认 ${acknowledgedAt}` : "确认知悉"}</button>
    <button disabled={submitting || reportStatus === "PENDING"} onClick={() => setOpen((current) => !current)} type="button">{reportStatus === "PENDING" ? "冲突待处理" : "报告冲突"}</button>
    {open ? <form className="referee-conflict-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void run(`/api/referees/appointments/${appointmentId}/conflict`, { reasonCode: form.get("reasonCode"), explanation: form.get("explanation") }); }}>
      <label><span>结构化原因</span><select name="reasonCode" required>{conflictReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>补充说明</span><textarea maxLength={500} name="explanation" required rows={3} /></label>
      <div><button disabled={submitting} type="submit">提交冲突报告</button><button onClick={() => setOpen(false)} type="button">取消</button></div>
    </form> : null}
    <p aria-live="polite">{message}</p>
  </div>;
}
