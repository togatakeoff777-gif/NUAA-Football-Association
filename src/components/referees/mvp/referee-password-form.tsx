"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefereePasswordForm({ requiredChange }: { requiredChange: boolean }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    if (newPassword !== String(form.get("confirmPassword") ?? "")) {
      setMessage("两次输入的新密码不一致。");
      return;
    }
    setSubmitting(true);
    const response = await fetch("/api/referees/account/password", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        currentPassword: form.get("currentPassword"),
        newPassword,
      }),
    });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);
    if (!response.ok) {
      setMessage(result.error ?? "密码修改失败。");
      return;
    }
    setMessage("密码已修改，请使用新密码重新登录。");
    router.replace("/referees/login");
    router.refresh();
  }
  return (
    <form className="referee-form referee-password-form" onSubmit={submit}>
      {requiredChange ? <p className="referee-required-change">首次登录须先修改初始密码，完成后原会话将自动失效。</p> : null}
      <label><span>当前密码</span><input autoComplete="current-password" name="currentPassword" required type="password" /></label>
      <label><span>新密码（至少 12 个字符）</span><input autoComplete="new-password" minLength={12} name="newPassword" required type="password" /></label>
      <label><span>确认新密码</span><input autoComplete="new-password" minLength={12} name="confirmPassword" required type="password" /></label>
      <button disabled={submitting} type="submit">{submitting ? "保存中…" : "修改密码"}</button>
      <p aria-live="polite">{message}</p>
    </form>
  );
}
