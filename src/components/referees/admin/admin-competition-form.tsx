"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import {
  competitionFormatLabels,
  competitionStatusLabels,
  dataSourceLabels,
} from "@/components/referees/admin/admin-ui";

export type AdminCompetitionRecord = {
  id: string;
  name: string;
  year: number | null;
  format: "ELEVEN_A_SIDE" | "FUTSAL";
  status: "PREPARING" | "REGISTRATION" | "ONGOING" | "COMPLETED";
  source: "MANUAL" | "FOOTBALL_CHINA";
  externalCompetitionId: string;
  lastSyncedAt: string;
};

export function AdminCompetitionForm({ competition }: { competition?: AdminCompetitionRecord }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const form = new FormData(event.currentTarget);
    const yearText = String(form.get("year") ?? "").trim();
    const response = await fetch(
      competition ? `/api/referees/admin/competitions/${competition.id}` : "/api/referees/admin/competitions",
      {
        method: competition ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.get("name"),
          year: yearText ? Number(yearText) : null,
          format: form.get("format"),
          status: form.get("status"),
        }),
      },
    );
    const result = (await response.json()) as { error?: string };
    if (!response.ok) {
      setMessage(result.error ?? "赛事保存失败。");
      return;
    }
    router.push("/admin/competitions");
    router.refresh();
  }
  return <form className="admin-form" onSubmit={submit}>
    <div className="admin-form-grid">
      <label><span>赛事名称</span><input defaultValue={competition?.name} maxLength={120} name="name" placeholder="例如：2026 新生杯" required /></label>
      <label><span>赛季年份</span><input defaultValue={competition?.year ?? ""} max={2200} min={1900} name="year" placeholder="2026" type="number" /></label>
      <label><span>比赛制式</span><select defaultValue={competition?.format ?? "ELEVEN_A_SIDE"} name="format">{Object.entries(competitionFormatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      <label><span>赛事状态</span><select defaultValue={competition?.status ?? "PREPARING"} name="status">{Object.entries(competitionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <div className="admin-form-readonly">
      <div><span>数据来源</span><strong>{dataSourceLabels[competition?.source ?? "MANUAL"]}</strong></div>
      {competition?.externalCompetitionId ? <div><span>外部赛事 ID</span><strong>{competition.externalCompetitionId}</strong></div> : null}
      {competition?.lastSyncedAt ? <div><span>最近同步</span><strong>{competition.lastSyncedAt}</strong></div> : null}
      <p>R1 手工新建赛事固定使用“手工维护”，不会生成足球中国外部 ID。</p>
    </div>
    <p aria-live="polite" className="admin-form-message">{message}</p>
    <footer><button className="admin-button admin-button-secondary" onClick={() => router.back()} type="button">取消</button><button className="admin-button" type="submit">{competition ? "保存赛事" : "创建赛事"}</button></footer>
  </form>;
}
