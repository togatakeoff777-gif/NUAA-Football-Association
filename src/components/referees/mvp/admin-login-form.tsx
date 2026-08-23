"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminLoginForm({ returnTo = "/referees/admin" }: { returnTo?: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/referees/admin/login", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: form.get("username"),
        password: form.get("password"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);
    if (!response.ok) return setMessage(result.error ?? "登录失败。" );
    router.replace(returnTo);
    router.refresh();
  }

  return (
    <form className="referee-form referee-login-form" onSubmit={submit}>
      <label><span>管理员账号</span><input autoComplete="username" maxLength={64} name="username" placeholder="实名账号；兼容模式可留空" /></label>
      <label><span>管理员密码</span><input autoComplete="current-password" maxLength={256} name="password" required type="password" /></label>
      <button disabled={submitting} type="submit">{submitting ? "验证中…" : "登录裁判管理后台"}</button>
      <p aria-live="polite" className="referee-form-message">{message}</p>
    </form>
  );
}
