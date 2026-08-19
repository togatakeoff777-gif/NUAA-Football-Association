"use client";

import { useState } from "react";
import type { AppointmentPositionKey } from "@/generated/prisma-v29/client";

type PositionOption = { key: AppointmentPositionKey; label: string };

export function RefereeApplicationForm({
  matchId,
  positions,
  referee,
}: {
  matchId: string;
  positions: PositionOption[];
  referee: { publicCode: string; name: string };
}) {
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSubmitting(true);
    setMessage("");
    const form = new FormData(formElement);
    const response = await fetch("/api/referees/applications", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        matchId,
        preferredPositions: form.getAll("preferredPositions"),
        note: form.get("note"),
      }),
    });
    const result = (await response.json()) as { error?: string };
    setSubmitting(false);
    if (!response.ok) {
      setMessage(result.error ?? "提交失败，请稍后重试。");
      return;
    }
    formElement.reset();
    setMessage("执裁意向已提交，请等待管理员审核。" );
  }

  return (
    <form className="referee-form" onSubmit={submit}>
      <div className="referee-form-identity">
        <span>当前登录裁判员</span>
        <strong>{referee.publicCode} · {referee.name}</strong>
      </div>
      <fieldset>
        <legend>意向岗位（至少选择一项）</legend>
        <div className="referee-checkbox-grid">
          {positions.map((position) => (
            <label key={position.key}>
              <input name="preferredPositions" type="checkbox" value={position.key} />
              <span>{position.label}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <label>
        <span>补充说明（选填，不填写联系方式）</span>
        <textarea maxLength={240} name="note" rows={4} />
      </label>
      <p className="referee-form-note">提交仅表达执裁意向，不等于正式获得任务；最终结果以已发布选派公告为准。</p>
      <button disabled={submitting} type="submit">{submitting ? "提交中…" : "提交执裁意向"}</button>
      <p aria-live="polite" className="referee-form-message">{message}</p>
    </form>
  );
}
