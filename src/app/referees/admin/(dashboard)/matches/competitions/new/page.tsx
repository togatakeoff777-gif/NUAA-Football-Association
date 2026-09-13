import { AdminCompetitionForm } from "@/components/referees/admin/admin-competition-form";
import { AdminMatchNavigation } from "@/components/referees/admin/admin-match-navigation";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";

export default function NewAdminCompetitionPage() {
  return <>
    <AdminPageHeader eyebrow="NEW COMPETITION" title="新建赛事" description="创建稳定赛事身份与公开资料后，可继续建立球队和具体比赛。" />
    <AdminMatchNavigation active="competitions" />
    <AdminPanel title="赛事资料" description="公开发布默认关闭；完整复核资料后再由管理员明确开启。"><AdminCompetitionForm /></AdminPanel>
  </>;
}
