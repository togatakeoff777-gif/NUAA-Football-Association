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
        password: form.get("password"),
      }),
    });
    const result = (await response.json()) as { error?: string; mustChangePassword?: boolean };
    setSubmitting(false);
    if (!response.ok) {
      setMessage(result.error ?? "登录失败，请稍后重试。");
      return;
    }
    router.replace(result.mustChangePassword ? "/referees/workspace/account" : "/referees/workspace");
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
        <span>密码</span>
        <input
          autoComplete="current-password"
          maxLength={256}
          name="password"
          required
          type="password"
        />
      </label>
      <p className="referee-form-note">
        本入口面向经协会审核并启用账号的裁判员。账号申请开放后，裁判员可自主提交申请，由协会审核并配置相应权限。
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
