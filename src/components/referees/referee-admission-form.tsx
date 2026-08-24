"use client";

import { useState } from "react";

export function RefereeAdmissionForm() {
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    setSuccess(false);
    setMessage("");
    try {
      const response = await fetch("/api/referees/admission-applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          studentId: form.get("studentId"),
          phone: form.get("phone"),
          qq: form.get("qq"),
          note: form.get("note"),
        }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        setMessage(result.error ?? "申请提交失败，请稍后重试。");
        return;
      }
      formElement.reset();
      setSuccess(true);
      setMessage("申请已提交。协会审核后会按申请中填写的联系方式与您沟通。");
    } catch {
      setMessage("网络连接异常，请稍后重试。");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="referee-form referee-admission-form" onSubmit={submit}>
      <div className="referee-admission-form-grid">
        <label><span>姓名</span><input autoComplete="name" maxLength={48} name="name" required /></label>
        <label><span>学号（选填）</span><input autoComplete="off" maxLength={32} name="studentId" /></label>
        <label><span>手机号（选填）</span><input autoComplete="tel" inputMode="numeric" maxLength={11} name="phone" pattern="\d{11}" title="请输入 11 位纯数字手机号" /></label>
        <label><span>QQ（选填）</span><input autoComplete="off" inputMode="numeric" maxLength={12} name="qq" pattern="\d{5,12}" title="请输入 5 至 12 位纯数字 QQ" /></label>
      </div>
      <label><span>补充说明（选填）</span><textarea maxLength={240} name="note" rows={4} /></label>
      <p className="referee-form-note">手机号或 QQ 至少填写一项。提交的是“成为裁判员”的准入申请，不是某场比赛的执裁报名。</p>
      <button disabled={submitting} type="submit">{submitting ? "提交中…" : "提交裁判准入申请"}</button>
      <p aria-live="polite" className="referee-form-message" data-success={success}>{message}</p>
    </form>
  );
}
