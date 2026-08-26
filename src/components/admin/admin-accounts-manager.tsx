"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Role = "SUPER_ADMIN" | "CONTENT_EDITOR" | "COMPETITION_ADMIN" | "REFEREE_ADMIN";
type Account = {
  id: string;
  username: string;
  displayName: string;
  roles: Role[];
  isActive: boolean;
  lastLoginAt: string;
};

const roleOptions: Array<{ role: Role; label: string; description: string }> = [
  { role: "SUPER_ADMIN", label: "超级管理员", description: "拥有全部模块与系统管理权限" },
  { role: "CONTENT_EDITOR", label: "内容运营", description: "新闻公告与媒体附件" },
  { role: "COMPETITION_ADMIN", label: "赛事管理员", description: "赛事、导入、比赛与组织球队" },
  { role: "REFEREE_ADMIN", label: "裁判管理员", description: "裁判、准入、选派、冲突与统计" },
];

async function api(method: "POST" | "PATCH", body: unknown) {
  const response = await fetch("/api/admin/system/admin-accounts", {
    method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json() as { error?: string };
  if (!response.ok) throw new Error(result.error ?? "管理员账号操作失败。");
}

function RoleSelector({ roles, onChange }: { roles: Role[]; onChange: (roles: Role[]) => void }) {
  const isSuper = roles.includes("SUPER_ADMIN");
  function toggle(role: Role, checked: boolean) {
    if (role === "SUPER_ADMIN") {
      onChange(checked ? ["SUPER_ADMIN"] : []);
      return;
    }
    const withoutSuper = roles.filter((item) => item !== "SUPER_ADMIN");
    onChange(checked
      ? [...new Set([...withoutSuper, role])]
      : withoutSuper.filter((item) => item !== role));
  }
  return <fieldset className="admin-role-selector">
    <legend>权限角色（可多选）</legend>
    {roleOptions.map((option) => <label key={option.role}>
      <input
        checked={roles.includes(option.role)}
        disabled={option.role !== "SUPER_ADMIN" && isSuper}
        onChange={(event) => toggle(option.role, event.target.checked)}
        type="checkbox"
      />
      <span><strong>{option.label}</strong><small>{option.description}</small></span>
    </label>)}
    {isSuper ? <p>超级管理员已包含全部权限，无需保存其他角色。</p> : null}
  </fieldset>;
}

export function AdminAccountsManager({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const [mode, setMode] = useState<"create" | "edit" | null>(null);
  const [editing, setEditing] = useState<Account | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function run(operation: () => Promise<void>, success: string) {
    setBusy(true);
    setMessage("");
    try {
      await operation();
      setMessage(success);
      setMode(null);
      setEditing(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "管理员账号操作失败。");
    } finally {
      setBusy(false);
    }
  }

  function openCreate() {
    setRoles(["CONTENT_EDITOR"]);
    setEditing(null);
    setMode("create");
  }

  function openEdit(account: Account) {
    setRoles(account.roles);
    setEditing(account);
    setMode("edit");
  }

  async function submitCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await run(() => api("POST", {
      displayName: form.get("displayName"),
      username: form.get("username"),
      password: form.get("password"),
      roles,
    }), "管理员账号已创建，首次登录必须修改密码。");
  }

  async function submitRoles(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editing) return;
    await run(() => api("PATCH", { id: editing.id, roles }), "管理员角色已更新。");
  }

  return <>
    <p aria-live="polite" className="admin-form-message">{message}</p>
    <div className="admin-table-scroll"><table className="admin-data-table">
      <thead><tr><th>姓名</th><th>账号</th><th>Unified roles</th><th>状态</th><th>最近登录</th><th>操作</th></tr></thead>
      <tbody>{accounts.map((account) => <tr key={account.id}>
        <td><strong>{account.displayName}</strong></td>
        <td>{account.username}</td>
        <td>{account.roles.map((role) => roleOptions.find((option) => option.role === role)?.label ?? role).join(" / ")}</td>
        <td><span className="admin-status-badge" data-status={account.isActive ? "ACTIVE" : "INACTIVE"}>{account.isActive ? "已启用" : "已停用"}</span></td>
        <td>{account.lastLoginAt || "从未登录"}</td>
        <td><div className="admin-table-actions">
          <button onClick={() => openEdit(account)} type="button">修改角色</button>
          <button disabled={busy} onClick={() => void run(
            () => api("PATCH", { id: account.id, isActive: !account.isActive }),
            account.isActive ? "管理员账号已停用。" : "管理员账号已启用。",
          )} type="button">{account.isActive ? "停用" : "启用"}</button>
        </div></td>
      </tr>)}</tbody>
    </table></div>
    <button className="admin-floating-create" onClick={openCreate} type="button">+ 新建管理员</button>
    {mode ? <div aria-modal="true" className="admin-modal-backdrop" role="dialog"><div className="admin-modal admin-modal-compact">
      <header><div><span>ADMIN ACCOUNT</span><h2>{mode === "create" ? "新建管理员" : `修改 ${editing?.username} 的角色`}</h2></div><button aria-label="关闭" onClick={() => setMode(null)} type="button">×</button></header>
      <form className="admin-form" onSubmit={mode === "create" ? submitCreate : submitRoles}>
        {mode === "create" ? <>
          <label><span>姓名</span><input maxLength={80} name="displayName" required /></label>
          <label><span>账号</span><input autoCapitalize="none" maxLength={64} name="username" required /></label>
          <label><span>初始密码</span><input autoComplete="new-password" minLength={12} name="password" required type="password" /></label>
        </> : null}
        <RoleSelector onChange={setRoles} roles={roles} />
        <footer><button className="admin-button admin-button-secondary" onClick={() => setMode(null)} type="button">取消</button><button className="admin-button" disabled={busy || !roles.length} type="submit">{busy ? "保存中…" : "保存"}</button></footer>
      </form>
    </div></div> : null}
  </>;
}
