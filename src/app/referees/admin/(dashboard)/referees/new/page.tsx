import { RefereeCreateForm } from "@/components/referees/admin/admin-referee-forms";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { affiliationOptionLabel, sortAffiliationOptions } from "@/lib/referee-affiliation-options";

export default async function NewAdminRefereePage() {
  const colleges = await prisma.college.findMany({ select: { id: true, name: true, codeMappings: { select: { prefix: true } } } });
  const options = sortAffiliationOptions(colleges.map((college) => ({ id: college.id, name: college.name, type: "COLLEGE" as const, prefixes: college.codeMappings.map((mapping) => mapping.prefix) })))
    .map((college) => ({ id: college.id, name: college.name, label: affiliationOptionLabel(college) }));
  return <><AdminPageHeader eyebrow="NEW REFEREE" title="新建裁判员" description="先建立必要身份与账号信息，其他资料在创建后继续完善。" /><AdminPanel title="创建账号"><RefereeCreateForm colleges={options} /></AdminPanel></>;
}
