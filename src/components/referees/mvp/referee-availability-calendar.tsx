"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type AvailabilityRecord = {
  id: string;
  startAt: string;
  endAt: string;
  kind: "AVAILABLE" | "UNAVAILABLE";
  competitionFormat: "ELEVEN_A_SIDE" | "FUTSAL" | null;
  note: string;
};

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function localDateTime(day: string, time: string) {
  return new Date(`${day}T${time}:00`).toISOString();
}

function nextDay(day: string) {
  const date = new Date(`${day}T12:00:00`);
  date.setDate(date.getDate() + 1);
  return dateKey(date);
}

export function RefereeAvailabilityCalendar({ records }: { records: AvailabilityRecord[] }) {
  const router = useRouter();
  const today = new Date();
  const [month, setMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDay, setSelectedDay] = useState(dateKey(today));
  const [mode, setMode] = useState<"FULL_AVAILABLE" | "FULL_UNAVAILABLE" | "WINDOW">("FULL_AVAILABLE");
  const [message, setMessage] = useState("");
  const monthDays = useMemo(() => {
    const start = new Date(month.getFullYear(), month.getMonth(), 1);
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, index) => { const value = new Date(start); value.setDate(start.getDate() + index); return value; });
  }, [month]);
  const recordsByDay = useMemo(() => {
    const map = new Map<string, AvailabilityRecord[]>();
    for (const record of records) {
      const key = dateKey(new Date(record.startAt));
      map.set(key, [...(map.get(key) ?? []), record]);
    }
    return map;
  }, [records]);
  const selectedRecords = recordsByDay.get(selectedDay) ?? [];

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const fullDay = mode !== "WINDOW";
    const startAt = localDateTime(selectedDay, fullDay ? "00:00" : String(form.get("start") ?? ""));
    const endAt = localDateTime(fullDay ? nextDay(selectedDay) : selectedDay, fullDay ? "00:00" : String(form.get("end") ?? ""));
    const response = await fetch("/api/referees/availability", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({
      startAt,
      endAt,
      kind: mode === "FULL_UNAVAILABLE" ? "UNAVAILABLE" : "AVAILABLE",
      competitionType: form.get("competitionType"),
      note: form.get("note"),
    }) });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "可执裁时间已保存。指定日期可继续添加其他时段。" : result.error ?? "保存失败。");
    if (response.ok) { formElement.reset(); router.refresh(); }
  }

  async function remove(id: string) {
    const response = await fetch("/api/referees/availability", { method: "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ id }) });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "记录已删除。" : result.error ?? "删除失败。");
    if (response.ok) router.refresh();
  }

  return <div className="referee-availability-layout">
    <section className="referee-calendar" aria-label="可执裁时间月历">
      <header><button aria-label="上个月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} type="button">←</button><h2>{month.getFullYear()} 年 {month.getMonth() + 1} 月</h2><button aria-label="下个月" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} type="button">→</button></header>
      <div className="referee-calendar-weekdays">{["一", "二", "三", "四", "五", "六", "日"].map((day) => <span key={day}>周{day}</span>)}</div>
      <div className="referee-calendar-grid">{monthDays.map((day) => { const key = dateKey(day); const dayRecords = recordsByDay.get(key) ?? []; const state = dayRecords.some((item) => item.kind === "UNAVAILABLE") ? "unavailable" : dayRecords.some((item) => item.kind === "AVAILABLE") ? "available" : "unset"; return <button aria-pressed={key === selectedDay} data-current-month={day.getMonth() === month.getMonth()} data-state={state} key={key} onClick={() => setSelectedDay(key)} type="button"><strong>{day.getDate()}</strong><small>{state === "available" ? "可执裁" : state === "unavailable" ? "不可执裁" : "未设置"}</small></button>; })}</div>
    </section>
    <section className="referee-availability-editor">
      <header><span>已选日期</span><h2>{selectedDay}</h2></header>
      <form className="referee-form" onSubmit={save}>
        <fieldset><legend>状态</legend><label><input checked={mode === "FULL_AVAILABLE"} onChange={() => setMode("FULL_AVAILABLE")} type="radio" />整天可执裁</label><label><input checked={mode === "FULL_UNAVAILABLE"} onChange={() => setMode("FULL_UNAVAILABLE")} type="radio" />整天不可执裁</label><label><input checked={mode === "WINDOW"} onChange={() => setMode("WINDOW")} type="radio" />指定时段可执裁</label></fieldset>
        {mode === "WINDOW" ? <div className="referee-time-window"><label><span>开始</span><input name="start" required type="time" /></label><label><span>结束</span><input name="end" required type="time" /></label></div> : null}
        <label><span>比赛制式</span><select name="competitionType"><option value="BOTH">均可</option><option value="ELEVEN_A_SIDE">十一人制</option><option value="FUTSAL">五人制</option></select></label>
        <label><span>说明（选填）</span><input maxLength={240} name="note" /></label>
        <button type="submit">保存此日期</button>
      </form>
      <div className="referee-day-records"><h3>当天记录</h3>{selectedRecords.length ? selectedRecords.map((record) => <article key={record.id}><strong>{record.kind === "AVAILABLE" ? "可执裁" : "不可执裁"}</strong><span>{new Date(record.startAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}–{new Date(record.endAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })} · {record.competitionFormat === null ? "均可" : record.competitionFormat === "ELEVEN_A_SIDE" ? "十一人制" : "五人制"}</span>{record.note ? <p>{record.note}</p> : null}<button onClick={() => void remove(record.id)} type="button">删除</button></article>) : <p>未设置</p>}</div>
      <p aria-live="polite" className="referee-form-message">{message}</p>
    </section>
  </div>;
}
