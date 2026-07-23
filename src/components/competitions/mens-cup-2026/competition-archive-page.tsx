import { CompetitionArchiveLayout } from "@/components/competitions/archive/competition-archive-layout";
import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

import { CompetitionFinal } from "./competition-final";
import { CompetitionOfficials } from "./competition-officials";
import { CompetitionOverview } from "./competition-overview";
import { CompetitionResults } from "./competition-results";
import { CompetitionStandings } from "./competition-standings";
import { CompetitionStatistics } from "./competition-statistics";
import { CompetitionStories } from "./competition-stories";
import { CompetitionTeams } from "./competition-teams";

export function CompetitionArchivePage() {
  const { competition } = mensIntercollegeCup2026;

  return (
    <CompetitionArchiveLayout
      titleId="cup-archive-title"
      title={competition.name}
      eyebrow="OFFICIAL COMPETITION ARCHIVE · 2026"
      status="已结束 / 官方数据"
      description={`${competition.structure.groupStage}。赛事于2026年5月17日完成决赛，致慧书院夺得冠军。`}
      heroImage={competition.heroImage}
      heroAlt="天目湖校区西操场晚霞与足球"
      actions={[{ href: "#schedule", label: "查看完整赛果" }, { href: competition.guidebook, label: "下载赛事秩序册", download: true }]}
      summary={[
        { label: "冠军", value: "致慧书院" },
        { label: "赛期", value: "2026.03.20—05.17" },
        { label: "规模", value: `${competition.summary.teams}队 / ${competition.summary.matches}场` },
        { label: "进球", value: `${competition.summary.goals}球` },
      ]}
      returnStatus="档案状态：已结束 / 官方数据"
    >
      <CompetitionOverview />
      <CompetitionResults />
      <CompetitionStandings />
      <CompetitionTeams />
      <CompetitionOfficials />
      <CompetitionFinal />
      <CompetitionStatistics />
      <CompetitionStories />
    </CompetitionArchiveLayout>
  );
}
