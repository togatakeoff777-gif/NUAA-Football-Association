"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ApplicationWithdrawButton({ applicationId }: { applicationId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function withdraw() {
    const response = await fetch(`/api/referees/applications/${applicationId}`, {
      method: "DELETE",
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "执裁意向已撤回。" : result.error ?? "撤回失败。");
    if (response.ok) router.refresh();
  }
  return (
    <div className="application-withdraw-action">
      <button onClick={withdraw} type="button">撤回意向</button>
      <span aria-live="polite">{message}</span>
    </div>
  );
}
