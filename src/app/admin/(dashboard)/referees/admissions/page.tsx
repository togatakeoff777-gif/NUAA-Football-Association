import Link from "next/link";

import {
  AdminEmptyState,
  AdminPageHeader,
  AdminPanel,
  AdminStatusBadge,
  admissionStatusLabels,
} from "@/components/referees/admin/admin-ui";
import { listRefereeAdmissionApplications } from "@/lib/referee-admission-service";
import { formatRefereeDateTime } from "@/lib/referee-presenters";
import { guardUnifiedAdminPage } from "@/lib/unified-admin-page";

const validStatuses = ["PENDING", "APPROVED", "REJECTED"] as const;

export default async function AdminAdmissionQueuePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const actor = await guardUnifiedAdminPage("referees:read", "referee-admissions");
  const query = await searchParams;
  const rawStatus = typeof query.status === "string" ? query.status : "";
  const status = validStatuses.find((item) => item === rawStatus);
  const applications = await listRefereeAdmissionApplications(status, actor);

  return <>
    <AdminPageHeader eyebrow="REFEREE ADMISSIONS" title="裁判准入申请" description="审核“希望成为裁判员”的申请；与比赛执裁报名和正式选派保持独立。" />
    <form className="admin-filter-bar"><label><span>状态</span><select defaultValue={status ?? ""} name="status"><option value="">全部状态</option>{validStatuses.map((value) => <option key={value} value={value}>{admissionStatusLabels[value]}</option>)}</select></label><button className="admin-button admin-button-secondary" type="submit">筛选</button><Link className="admin-filter-reset" href="/admin/referees/admissions">清除</Link></form>
    <AdminPanel title={`准入申请 · ${applications.length}`} description="最多显示最近 300 条；联系方式仅在受权后台中显示。">
      {applications.length ? <div className="admin-table-scroll"><table className="admin-data-table"><thead><tr><th>姓名</th><th>学号</th><th>手机</th><th>QQ</th><th>状态</th><th>申请时间</th><th>操作</th></tr></thead><tbody>{applications.map((application) => <tr key={application.id}><td><strong>{application.name}</strong></td><td>{application.studentId || "—"}</td><td>{application.phone || "—"}</td><td>{application.qq || "—"}</td><td><AdminStatusBadge status={application.status} label={admissionStatusLabels[application.status]} /></td><td>{formatRefereeDateTime(application.createdAt)}</td><td><Link href={`/admin/referees/admissions/${application.id}`}>查看详情</Link></td></tr>)}</tbody></table></div> : <AdminEmptyState title="暂无准入申请" description="新人从公开招募页提交后会进入此队列。" />}
    </AdminPanel>
  </>;
}
