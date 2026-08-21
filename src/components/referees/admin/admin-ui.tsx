import type { ReactNode } from "react";

export const adminRoleLabels: Record<string, string> = {
  SUPER_ADMIN: "裁判中心最高管理员",
  REFEREE_MANAGER: "裁判事务管理员",
};

export const matchStatusLabels: Record<string, string> = {
  SCHEDULED: "已安排",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export const competitionStatusLabels: Record<string, string> = {
  PREPARING: "准备中",
  REGISTRATION: "报名中",
  ONGOING: "进行中",
  COMPLETED: "已结束",
};

export const competitionFormatLabels: Record<string, string> = {
  ELEVEN_A_SIDE: "十一人制",
  FUTSAL: "五人制",
};

export const dataSourceLabels: Record<string, string> = {
  MANUAL: "手工维护",
  FOOTBALL_CHINA: "足球中国",
};

export const appointmentStatusLabels: Record<string, string> = {
  NONE: "待选派",
  DRAFT: "草稿",
  PUBLISHED: "已发布",
  WITHDRAWN: "已撤回",
  COMPLETED: "已完成",
  CANCELLED: "已取消",
};

export const refereeStatusLabels: Record<string, string> = {
  PENDING: "待启用",
  ACTIVE: "已启用",
  INACTIVE: "已停用",
  ARCHIVED: "已归档",
};

export const conflictStatusLabels: Record<string, string> = {
  PENDING: "待处理",
  RESOLVED: "已处理",
  DISMISSED: "已驳回",
};

export const trainingStatusLabels: Record<string, string> = {
  NOT_STARTED: "未开始",
  IN_PROGRESS: "进行中",
  COMPLETED: "已完成",
};

export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        <span>{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions ? <div className="admin-page-actions">{actions}</div> : null}
    </header>
  );
}

export function AdminStatusBadge({ status, label }: { status: string; label: string }) {
  return <span className="admin-status-badge" data-status={status}>{label}</span>;
}

export function AdminEmptyState({ title, description }: { title: string; description: string }) {
  return <div className="admin-empty-state"><strong>{title}</strong><p>{description}</p></div>;
}

export function AdminPanel({
  title,
  description,
  actions,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`admin-panel ${className}`.trim()}>
      <header className="admin-panel-header">
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
        {actions ? <div>{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}
