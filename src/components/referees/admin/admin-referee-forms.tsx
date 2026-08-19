"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { refereeStatusLabels, trainingStatusLabels } from "@/components/referees/admin/admin-ui";

export type CollegeOption = { id: string; name: string };
export type AdminRefereeRecord = {
  id: string;
  publicCode: string;
  name: string;
  studentId: string;
  collegeId: string;
  grade: string;
  phone: string;
  qq: string;
  refereeLevel: string;
  joinedAt: string;
  status: string;
  elevenASide: boolean;
  futsal: boolean;
  certificateNote: string;
  trainingStatus: string;
  publicDirectoryEnabled: boolean;
  publicBio: string;
  internalNote: string;
  mustChangePassword: boolean;
  capabilities: string[];
};

const capabilities = {
  ELEVEN_A_SIDE: [
    ["REFEREE", "裁判员"],
    ["ASSISTANT_REFEREE_1", "第一助理裁判员"],
    ["ASSISTANT_REFEREE_2", "第二助理裁判员"],
    ["FOURTH_OFFICIAL", "第四官员"],
    ["RESERVE_ASSISTANT_REFEREE", "候补助理裁判员"],
  ],
  FUTSAL: [
    ["REFEREE", "裁判员"],
    ["SECOND_REFEREE", "第二裁判员"],
    ["THIRD_REFEREE", "第三裁判员"],
    ["TIMEKEEPER", "计时员"],
  ],
} as const;

function text(form: FormData, key: string) {
  return String(form.get(key) ?? "");
}

function capabilityPayload(form: FormData) {
  return form.getAll("capability").map((value) => {
    const [format, positionKey] = String(value).split(":");
    return { format, positionKey };
  });
}

function fullPayload(form: FormData) {
  const selectedCapabilities = capabilityPayload(form);
  return {
    publicCode: text(form, "publicCode"), name: text(form, "name"),
    studentId: text(form, "studentId"), collegeId: text(form, "collegeId"), grade: text(form, "grade"),
    phone: text(form, "phone"), qq: text(form, "qq"), refereeLevel: text(form, "refereeLevel"),
    joinedAt: text(form, "joinedAt"), initialPassword: text(form, "initialPassword"), status: text(form, "status"),
    elevenASide: selectedCapabilities.some((item) => item.format === "ELEVEN_A_SIDE"),
    futsal: selectedCapabilities.some((item) => item.format === "FUTSAL"),
    certificateNote: text(form, "certificateNote"), trainingStatus: text(form, "trainingStatus"),
    publicDirectoryEnabled: form.get("publicDirectoryEnabled") === "on",
    publicBio: text(form, "publicBio"), internalNote: text(form, "internalNote"),
    capabilities: selectedCapabilities,
  };
}

function CapabilityGroups({ selected }: { selected: string[] }) {
  return <div className="admin-checkbox-groups">{Object.entries(capabilities).map(([format, items]) => <section className="admin-checkbox-group" key={format}><strong>{format === "ELEVEN_A_SIDE" ? "十一人制" : "五人制"}</strong><div className="admin-checkbox-list">{items.map(([key, label]) => { const value = `${format}:${key}`; return <label key={value}><input defaultChecked={selected.includes(value)} name="capability" type="checkbox" value={value} /><span>{label}</span></label>; })}</div></section>)}</div>;
}

export function RefereeCreateForm({ colleges }: { colleges: CollegeOption[] }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSubmitting(true);
    setMessage("");
    const response = await fetch("/api/referees/admin/accounts", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        publicCode: text(form, "publicCode"), name: text(form, "name"), studentId: text(form, "studentId"),
        collegeId: text(form, "collegeId"), grade: "", phone: "", qq: "", refereeLevel: "", joinedAt: "",
        initialPassword: text(form, "initialPassword"), status: text(form, "status"), elevenASide: false, futsal: false,
        certificateNote: "", trainingStatus: "NOT_STARTED", publicDirectoryEnabled: false,
        publicBio: "", internalNote: "", capabilities: [],
      }),
    });
    const result = (await response.json()) as { error?: string; refereeId?: string };
    setSubmitting(false);
    if (!response.ok) { setMessage(result.error ?? "创建失败。"); return; }
    router.push(`/referees/admin/referees/${result.refereeId}`);
    router.refresh();
  }
  return <form className="admin-form admin-form-section" onSubmit={submit}>
    <header><h2>必要信息</h2><p>创建后进入裁判员详情继续维护资质、岗位能力和联系方式。</p></header>
    <div className="admin-form-grid">
      <label><span>姓名</span><input autoFocus maxLength={48} name="name" required /></label>
      <label><span>裁判员编号</span><input maxLength={32} name="publicCode" required /></label>
      <label><span>学号</span><input maxLength={32} name="studentId" /></label>
      <label><span>学院</span><select name="collegeId"><option value="">待确认</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select></label>
      <label><span>初始密码</span><input minLength={12} name="initialPassword" required type="password" /></label>
      <label><span>账号状态</span><select defaultValue="PENDING" name="status">{Object.entries(refereeStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
    </div>
    <p aria-live="polite" className="admin-form-message">{message}</p>
    <footer><button className="admin-button admin-button-secondary" onClick={() => router.back()} type="button">取消</button><button className="admin-button" disabled={submitting} type="submit">{submitting ? "创建中…" : "创建裁判员"}</button></footer>
  </form>;
}

const tabs = [
  ["profile", "基本资料"], ["qualification", "裁判资质"], ["capabilities", "岗位能力"],
  ["public", "公开资料"], ["internal", "内部备注"],
] as const;

export function RefereeEditForm({ account, colleges }: { account: AdminRefereeRecord; colleges: CollegeOption[] }) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number][0]>("profile");
  const [message, setMessage] = useState("");
  const [resetOpen, setResetOpen] = useState(false);
  async function update(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const response = await fetch(`/api/referees/admin/accounts/${account.id}`, {
      method: "PATCH", headers: { "content-type": "application/json" },
      body: JSON.stringify(fullPayload(new FormData(event.currentTarget))),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "裁判员档案已保存。" : result.error ?? "保存失败。");
    if (response.ok) router.refresh();
  }
  async function resetPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/referees/admin/accounts/${account.id}`, {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ initialPassword: form.get("initialPassword") }),
    });
    const result = (await response.json()) as { error?: string };
    setMessage(response.ok ? "密码已重置，原有会话已失效。" : result.error ?? "重置失败。");
    if (response.ok) { event.currentTarget.reset(); setResetOpen(false); router.refresh(); }
  }
  return <>
    <form className="admin-form" onSubmit={update}>
      <input name="initialPassword" type="hidden" value="" />
      <nav aria-label="裁判员详情分区" className="admin-tabs">{tabs.map(([value, label]) => <button aria-selected={activeTab === value} key={value} onClick={() => setActiveTab(value)} role="tab" type="button">{label}</button>)}</nav>
      <section className="admin-form-section" hidden={activeTab !== "profile"}><header><h2>基本资料</h2><p>身份、学院和联系方式，仅管理员与本人可访问敏感字段。</p></header><div className="admin-form-grid admin-form-grid-3">
        <label><span>姓名</span><input defaultValue={account.name} name="name" required /></label>
        <label><span>裁判员编号</span><input defaultValue={account.publicCode} name="publicCode" required /></label>
        <label><span>学号</span><input defaultValue={account.studentId} name="studentId" /></label>
        <label><span>学院</span><select defaultValue={account.collegeId} name="collegeId"><option value="">待确认</option>{colleges.map((college) => <option key={college.id} value={college.id}>{college.name}</option>)}</select></label>
        <label><span>年级</span><input defaultValue={account.grade} name="grade" /></label>
        <label><span>手机号</span><input defaultValue={account.phone} name="phone" /></label>
        <label><span>QQ</span><input defaultValue={account.qq} name="qq" /></label>
        <label><span>账号状态</span><select defaultValue={account.status} name="status">{Object.entries(refereeStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div></section>
      <section className="admin-form-section" hidden={activeTab !== "qualification"}><header><h2>裁判资质</h2><p>等级、加入时间、培训与证书登记。</p></header><div className="admin-form-grid">
        <label><span>裁判等级</span><input defaultValue={account.refereeLevel} name="refereeLevel" /></label>
        <label><span>加入日期</span><input defaultValue={account.joinedAt} name="joinedAt" type="date" /></label>
        <label><span>培训状态</span><select defaultValue={account.trainingStatus} name="trainingStatus">{Object.entries(trainingStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label><span>证书或登记说明</span><input defaultValue={account.certificateNote} name="certificateNote" /></label>
      </div></section>
      <section className="admin-form-section" hidden={activeTab !== "capabilities"}><header><h2>岗位能力</h2><p>按比赛制式登记可承担的系统岗位。</p></header><CapabilityGroups selected={account.capabilities} /></section>
      <section className="admin-form-section" hidden={activeTab !== "public"}><header><h2>公开资料</h2><p>只有明确授权的字段会进入公共裁判名录。</p></header><label className="admin-inline-check"><input defaultChecked={account.publicDirectoryEnabled} name="publicDirectoryEnabled" type="checkbox" />允许进入公开名录</label><label><span>公开简介</span><textarea defaultValue={account.publicBio} maxLength={300} name="publicBio" /></label></section>
      <section className="admin-form-section" hidden={activeTab !== "internal"}><header><h2>内部备注</h2><p>不通过公共 DTO 返回。</p></header><label><span>内部备注</span><textarea defaultValue={account.internalNote} maxLength={500} name="internalNote" /></label></section>
      <p aria-live="polite" className="admin-form-message">{message}</p>
      <footer><button className="admin-button admin-button-secondary" onClick={() => setResetOpen(true)} type="button">重置登录密码</button><button className="admin-button" type="submit">保存当前档案</button></footer>
    </form>
    {resetOpen ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog"><div className="admin-modal admin-modal-compact"><header><div><span>ACCOUNT SECURITY</span><h2>重置裁判员密码</h2></div><button aria-label="关闭" onClick={() => setResetOpen(false)} type="button">×</button></header><form className="admin-form" onSubmit={resetPassword}><p>重置后，该裁判员已有会话将全部失效，下一次登录须修改密码。</p><label><span>新的初始密码</span><input minLength={12} name="initialPassword" required type="password" /></label><footer><button className="admin-button admin-button-secondary" onClick={() => setResetOpen(false)} type="button">取消</button><button className="admin-button" type="submit">确认重置</button></footer></form></div></div> : null}
  </>;
}
