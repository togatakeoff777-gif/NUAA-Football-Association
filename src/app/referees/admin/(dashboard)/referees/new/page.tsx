import { RefereeCreateForm } from "@/components/referees/admin/admin-referee-forms";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";

export default async function NewAdminRefereePage() {
  return <><AdminPageHeader eyebrow="NEW REFEREE" title="新建裁判员" description="使用姓名和学号一次完成标准账号初始化，后续仍可在档案中维护全部资料。" /><AdminPanel title="创建账号"><RefereeCreateForm /></AdminPanel></>;
}
