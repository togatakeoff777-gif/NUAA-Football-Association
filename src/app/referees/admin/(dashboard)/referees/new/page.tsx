import { RefereeCreateForm } from "@/components/referees/admin/admin-referee-forms";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";

export default async function NewAdminRefereePage() {
  const colleges = await prisma.college.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });
  return <><AdminPageHeader eyebrow="NEW REFEREE" title="新建裁判员" description="先建立必要身份与账号信息，其他资料在创建后继续完善。" /><AdminPanel title="创建账号"><RefereeCreateForm colleges={colleges} /></AdminPanel></>;
}
