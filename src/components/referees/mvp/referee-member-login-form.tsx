"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefereeMemberLoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/referees/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        publicCode: form.get("publicCode"),
        accessCode: form.get("accessCode"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);
    if (!response.ok) {
      setMessage(result.error ?? "登录失败，请稍后重试。");
      return;
    }
    router.replace("/referees/workspace");
    router.refresh();
  }

  return (
    <form className="referee-form referee-login-form" onSubmit={submit}>
      <label>
        <span>裁判员编号</span>
        <input
          autoComplete="username"
          maxLength={32}
          name="publicCode"
          placeholder="例如 NUAA-R001"
          required
        />
      </label>
      <label>
        <span>访问码</span>
        <input
          autoComplete="current-password"
          maxLength={256}
          name="accessCode"
          required
          type="password"
        />
      </label>
      <p className="referee-form-note">
        本入口仅面向已登记裁判员。访问码由协会管理员线下发放，网站不收集手机号等个人敏感信息。
      </p>
      <button disabled={submitting} type="submit">
        {submitting ? "登录中…" : "进入裁判员工作区"}
      </button>
      <p aria-live="polite" className="referee-form-message">
        {message}
      </p>
    </form>
  );
}
