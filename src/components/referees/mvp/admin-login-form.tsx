"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm({ configurationIssue }: { configurationIssue: string | null }) {
  const router = useRouter();
  const [message, setMessage] = useState(configurationIssue ?? "");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/referees/admin/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ password: form.get("password") }),
    });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);
    if (!response.ok) return setMessage(result.error ?? "登录失败。" );
    router.replace("/referees/admin");
    router.refresh();
  }

  return (
    <form className="referee-form referee-login-form" onSubmit={submit}>
      <label><span>管理员密码</span><input autoComplete="current-password" disabled={Boolean(configurationIssue)} maxLength={256} name="password" required type="password" /></label>
      <button disabled={Boolean(configurationIssue) || submitting} type="submit">{submitting ? "验证中…" : "登录裁判管理后台"}</button>
      <p aria-live="polite" className="referee-form-message">{message}</p>
    </form>
  );
}
