import { AdminMatchForm, type CompetitionOption } from "@/components/referees/admin/admin-match-form";
import { AdminPageHeader, AdminPanel } from "@/components/referees/admin/admin-ui";
import { prisma } from "@/lib/prisma";
import { getPositionTemplate } from "@/lib/referee-roles";

export default async function NewAdminMatchPage() {
  const competitions = await prisma.competition.findMany({ include: { teams: { orderBy: { name: "asc" } } }, orderBy: [{ year: "desc" }, { name: "asc" }] });
  const options: CompetitionOption[] = competitions.map((item) => ({ id: item.id, name: item.name, format: item.format, teams: item.teams.map((team) => ({ id: team.id, name: team.name })), positions: getPositionTemplate(item.format).map((position) => ({ key: position.key, label: position.label })) }));
  return <><AdminPageHeader eyebrow="NEW MATCH" title="新建比赛" description="创建基础赛程后，进入比赛详情维护裁判岗位与选派。" /><AdminPanel title="比赛资料"><AdminMatchForm competitions={options} /></AdminPanel></>;
}
