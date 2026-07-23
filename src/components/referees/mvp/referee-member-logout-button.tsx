"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function RefereeMemberLogoutButton() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);

  async function logout() {
    setSubmitting(true);
    await fetch("/api/referees/logout", { method: "POST" });
    router.replace("/referees");
    router.refresh();
  }

  return (
    <button className="referee-logout-button" disabled={submitting} onClick={logout} type="button">
      {submitting ? "正在退出…" : "退出工作区"}
    </button>
  );
}
