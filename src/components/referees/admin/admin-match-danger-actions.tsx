"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

const deletionReasonLabels = {
  TEST_DATA: "测试数据",
  DUPLICATE: "重复创建",
  INPUT_ERROR: "信息录入错误",
  OTHER: "其他",
} as const;

type DeletionReason = keyof typeof deletionReasonLabels;

export function AdminMatchDangerActions({
  matchId,
  matchLabel,
  protectedReason,
}: {
  matchId: string;
  matchLabel: string;
  protectedReason?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const reasonKey = form.get("reason") as DeletionReason;
    const detail = String(form.get("detail") ?? "").trim();
    if (!deletionReasonLabels[reasonKey]) {
      setMessage("请选择删除原因。");
      return;
    }
    if (reasonKey === "OTHER" && !detail) {
      setMessage("选择“其他”时，请填写具体原因。");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`/api/referees/admin/matches/${matchId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reason: detail
            ? `${deletionReasonLabels[reasonKey]}：${detail}`
            : deletionReasonLabels[reasonKey],
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "比赛删除失败。");
      router.push("/referees/admin/matches");
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "比赛删除失败。");
      setSubmitting(false);
    }
  }

  return <>
    <details className="admin-action-menu">
      <summary className="admin-button admin-button-secondary">更多操作</summary>
      <div role="menu">
        <button onClick={() => { setMessage(""); setOpen(true); }} role="menuitem" type="button">
          删除比赛
        </button>
      </div>
    </details>
    {open ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog">
      <div className="admin-modal admin-modal-compact">
        <header>
          <div><span>DANGER ZONE</span><h2>删除比赛</h2></div>
          <button aria-label="关闭" disabled={submitting} onClick={() => setOpen(false)} type="button">×</button>
        </header>
        {protectedReason ? <div className="admin-form admin-match-delete-form">
          <div className="admin-danger-notice"><strong>该比赛不能直接删除</strong><p>{protectedReason}</p></div>
          <footer><button className="admin-button admin-button-secondary" onClick={() => setOpen(false)} type="button">我知道了</button></footer>
        </div> : <form className="admin-form admin-match-delete-form" onSubmit={remove}>
          <p>确定删除“<strong>{matchLabel}</strong>”吗？</p>
          <div className="admin-danger-notice"><strong>删除与取消比赛不同</strong><p>删除仅适用于错误、重复或测试比赛；真实取消的比赛应使用“取消比赛”保留业务历史。</p></div>
          <label><span>删除原因</span><select defaultValue="" name="reason" required>
            <option disabled value="">请选择</option>
            {Object.entries(deletionReasonLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select></label>
          <label><span>补充说明（可选）</span><input maxLength={180} name="detail" placeholder="简要说明本次删除" /></label>
          {message ? <p aria-live="polite" className="admin-danger-message">{message}</p> : null}
          <footer>
            <button className="admin-button admin-button-secondary" disabled={submitting} onClick={() => setOpen(false)} type="button">取消</button>
            <button className="admin-button admin-button-danger" disabled={submitting} type="submit">{submitting ? "删除中…" : "确认删除"}</button>
          </footer>
        </form>}
      </div>
    </div> : null}
  </>;
}
