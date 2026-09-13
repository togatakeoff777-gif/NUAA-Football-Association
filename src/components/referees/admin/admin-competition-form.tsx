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
  slug: string;
  name: string;
  shortName: string;
  year: number | null;
  campus: string;
  format: "ELEVEN_A_SIDE" | "FUTSAL";
  status: "PREPARING" | "REGISTRATION" | "ONGOING" | "COMPLETED";
  semesterLabel: string;
  teamFormation: string;
  publicPublished: boolean;
  homepageFeatured: boolean;
  publicOrder: number;
  registrationStartAt: string;
  registrationEndAt: string;
  matchStartAt: string;
  matchEndAt: string;
  venue: string;
  host: string;
  organizer: string;
  summary: string;
  notice: string;
  registrationUrl: string;
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
    const payload = {
      ...(!competition ? { slug: form.get("slug") } : {}),
      name: form.get("name"),
      shortName: form.get("shortName"),
      year: yearText ? Number(yearText) : null,
      campus: form.get("campus"),
      format: form.get("format"),
      status: form.get("status"),
      semesterLabel: form.get("semesterLabel"),
      teamFormation: form.get("teamFormation"),
      publicPublished: form.get("publicPublished") === "on",
      homepageFeatured: form.get("homepageFeatured") === "on",
      publicOrder: Number(form.get("publicOrder") ?? 0),
      registrationStartAt: form.get("registrationStartAt"),
      registrationEndAt: form.get("registrationEndAt"),
      matchStartAt: form.get("matchStartAt"),
      matchEndAt: form.get("matchEndAt"),
      venue: form.get("venue"),
      host: form.get("host"),
      organizer: form.get("organizer"),
      summary: form.get("summary"),
      notice: form.get("notice"),
      registrationUrl: form.get("registrationUrl"),
    };
    const response = await fetch(
      competition ? `/api/referees/admin/competitions/${competition.id}` : "/api/referees/admin/competitions",
      {
        method: competition ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
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
    <section className="admin-form-section">
      <header><h2>基础资料</h2><p>Slug 是公开路由的稳定身份，创建后不可通过普通编辑修改。</p></header>
      <div className="admin-form-grid">
        <label>
          <span>赛事 Slug</span>
          {competition
            ? <input aria-readonly="true" readOnly value={competition.slug} />
            : <input maxLength={80} name="slug" pattern="[a-z0-9]+(?:-[a-z0-9]+)*" placeholder="freshman-cup" required />}
          <small>仅限小写 ASCII 字母、数字与单个连字符分段。</small>
        </label>
        <label><span>赛事名称</span><input defaultValue={competition?.name} maxLength={120} name="name" placeholder="例如：2026 新生杯" required /></label>
        <label><span>赛事简称</span><input defaultValue={competition?.shortName} maxLength={60} name="shortName" placeholder="例如：新生杯" /></label>
        <label><span>赛季年份</span><input defaultValue={competition?.year ?? ""} max={2200} min={1900} name="year" placeholder="2026" type="number" /></label>
        <label><span>校区</span><input defaultValue={competition?.campus ?? "天目湖校区"} maxLength={60} name="campus" required /></label>
        <label><span>比赛制式</span><select defaultValue={competition?.format ?? "ELEVEN_A_SIDE"} name="format">{Object.entries(competitionFormatLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>赛事状态</span><select defaultValue={competition?.status ?? "PREPARING"} name="status">{Object.entries(competitionStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>学期</span><select defaultValue={competition?.semesterLabel ?? ""} name="semesterLabel"><option value="">待确认</option><option value="上半学期">上半学期</option><option value="下半学期">下半学期</option></select></label>
        <label><span>组队方式</span><input defaultValue={competition?.teamFormation} maxLength={60} name="teamFormation" placeholder="院系组队 / 自由组队" /></label>
      </div>
    </section>

    <section className="admin-form-section">
      <header><h2>公开状态</h2><p>“公开发布”开启后，后台数据将替代当前静态赛事资料进入官网公开页面。</p></header>
      <div className="admin-checkbox-list">
        <label><input defaultChecked={competition?.publicPublished} name="publicPublished" type="checkbox" /><span>公开发布</span></label>
        <label><input defaultChecked={competition?.homepageFeatured} name="homepageFeatured" type="checkbox" /><span>首页赛事预告展示</span></label>
      </div>
      <div className="admin-form-grid">
        <label><span>公开排序</span><input defaultValue={competition?.publicOrder ?? 0} max={1000} min={-1000} name="publicOrder" required type="number" /></label>
      </div>
    </section>

    <section className="admin-form-section">
      <header><h2>报名信息</h2><p>以下日期时间一律按北京时间（UTC+8）保存，不使用浏览器所在时区。</p></header>
      <div className="admin-form-grid">
        <label><span>报名开始时间 · 北京时间（UTC+8）</span><input defaultValue={competition?.registrationStartAt} name="registrationStartAt" type="datetime-local" /></label>
        <label><span>报名截止时间 · 北京时间（UTC+8）</span><input defaultValue={competition?.registrationEndAt} name="registrationEndAt" type="datetime-local" /></label>
        <label className="admin-form-span-2"><span>报名入口 URL</span><input defaultValue={competition?.registrationUrl} inputMode="url" maxLength={500} name="registrationUrl" placeholder="https://... 或 /站内路径" type="text" /></label>
      </div>
    </section>

    <section className="admin-form-section">
      <header><h2>比赛信息</h2><p>以下日期时间一律按北京时间（UTC+8）保存。</p></header>
      <div className="admin-form-grid">
        <label><span>比赛开始时间 · 北京时间（UTC+8）</span><input defaultValue={competition?.matchStartAt} name="matchStartAt" type="datetime-local" /></label>
        <label><span>比赛结束时间 · 北京时间（UTC+8）</span><input defaultValue={competition?.matchEndAt} name="matchEndAt" type="datetime-local" /></label>
        <label className="admin-form-span-2"><span>比赛场地</span><input defaultValue={competition?.venue} maxLength={120} name="venue" /></label>
      </div>
    </section>

    <section className="admin-form-section">
      <header><h2>赛事公开资料</h2><p>这些内容仅在赛事明确公开发布后替代静态资料。</p></header>
      <div className="admin-form-grid">
        <label><span>主办单位</span><input defaultValue={competition?.host} maxLength={240} name="host" /></label>
        <label><span>承办单位</span><input defaultValue={competition?.organizer} maxLength={240} name="organizer" /></label>
        <label className="admin-form-span-2"><span>赛事简介</span><textarea defaultValue={competition?.summary} maxLength={2000} name="summary" rows={5} /></label>
        <label className="admin-form-span-2"><span>赛事公告/说明</span><textarea defaultValue={competition?.notice} maxLength={4000} name="notice" rows={6} /></label>
      </div>
    </section>

    <div className="admin-form-readonly">
      <div><span>数据来源</span><strong>{dataSourceLabels[competition?.source ?? "MANUAL"]}</strong></div>
      {competition?.externalCompetitionId ? <div><span>外部赛事 ID</span><strong>{competition.externalCompetitionId}</strong></div> : null}
      {competition?.lastSyncedAt ? <div><span>最近同步</span><strong>{competition.lastSyncedAt}</strong></div> : null}
      <p>手工新建赛事固定使用“手工维护”；现有足球中国同步预留字段保持兼容。</p>
    </div>
    <p aria-live="polite" className="admin-form-message">{message}</p>
    <footer><button className="admin-button admin-button-secondary" onClick={() => router.back()} type="button">取消</button><button className="admin-button" type="submit">{competition ? "保存赛事" : "创建赛事"}</button></footer>
  </form>;
}
