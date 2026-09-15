"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AdminCompetitionDangerActions({
  competitionId,
  competitionName,
  protectedReason,
  compact = false,
}: {
  competitionId: string;
  competitionName: string;
  protectedReason?: string;
  compact?: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function remove() {
    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/referees/admin/competitions/${competitionId}`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirmationName: competitionName }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "赛事删除失败。");
      setOpen(false);
      router.push("/admin/competitions");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "赛事删除失败。");
      setSubmitting(false);
    }
  }

  return <>
    <button
      className={compact ? "admin-row-danger" : "admin-button admin-button-danger"}
      onClick={() => { setMessage(""); setOpen(true); }}
      type="button"
    >删除赛事</button>
    {open ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog">
      <div className="admin-modal admin-modal-compact">
        <header><div><span>DANGER ZONE</span><h2>删除赛事</h2></div><button aria-label="关闭" disabled={submitting} onClick={() => setOpen(false)} type="button">×</button></header>
        <div className="admin-form admin-competition-delete-form">
          {protectedReason ? <div className="admin-danger-notice"><strong>该赛事不能直接删除</strong><p>{protectedReason}</p></div> : <>
            <p>确认删除赛事：</p>
            <blockquote>“{competitionName}”</blockquote>
            <div className="admin-danger-notice"><strong>此操作不可撤销</strong><p>仅空白、误建或重复赛事可删除；服务端会再次检查球队、比赛、发布及正式历史。</p></div>
          </>}
          {message ? <p aria-live="polite" className="admin-danger-message">{message}</p> : null}
          <footer>
            <button className="admin-button admin-button-secondary" disabled={submitting} onClick={() => setOpen(false)} type="button">{protectedReason ? "我知道了" : "取消"}</button>
            {!protectedReason ? <button className="admin-button admin-button-danger" disabled={submitting} onClick={() => void remove()} type="button">{submitting ? "删除中…" : "确认删除赛事"}</button> : null}
          </footer>
        </div>
      </div>
    </div> : null}
  </>;
}
