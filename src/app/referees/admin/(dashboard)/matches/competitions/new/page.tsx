import { AdminCompetitionForm } from "@/components/referees/admin/admin-competition-form";
import { AdminMatchNavigation } from "@/components/referees/admin/admin-match-navigation";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";

export default function NewAdminCompetitionPage() {
  return <>
    <AdminPageHeader eyebrow="NEW COMPETITION" title="新建赛事" description="创建赛事后，可在该赛事下按需建立球队与具体比赛。" />
    <AdminMatchNavigation active="competitions" />
    <AdminPanel title="赛事资料" description="只填写当前人工维护所需的基础信息。"><AdminCompetitionForm /></AdminPanel>
  </>;
}
