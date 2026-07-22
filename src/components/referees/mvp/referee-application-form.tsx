"use client";

import { useState } from "react";
import type { AppointmentPositionKey } from "@/generated/prisma/browser";

type RefereeOption = { id: string; publicCode: string; name: string };
type PositionOption = { key: AppointmentPositionKey; label: string };

export function RefereeApplicationForm({
  matchId,
  referees,
  positions,
}: {
  matchId: string;
  referees: RefereeOption[];
  positions: PositionOption[];
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
        refereeId: form.get("refereeId"),
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
    setMessage("执裁意向已提交并写入本地数据库，请等待管理员审核。" );
  }

  return (
    <form className="referee-form" onSubmit={submit}>
      <label>
        <span>注册裁判员</span>
        <select name="refereeId" required defaultValue="">
          <option disabled value="">请选择名录记录</option>
          {referees.map((referee) => (
            <option key={referee.id} value={referee.id}>{referee.publicCode} · {referee.name}</option>
          ))}
        </select>
      </label>
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
