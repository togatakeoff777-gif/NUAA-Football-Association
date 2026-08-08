import Link from "next/link";

import { publicCompetitionStatusLabels } from "@/data/competition-center";
import type { PublicCompetitionRecord } from "@/types/competition-center";

export function CompetitionCatalog({ competitions }: { competitions: readonly PublicCompetitionRecord[] }) {
  return (
    <div className="functional-competition-list">
      {competitions.map((competition) => (
        <article id={competition.slug} key={competition.id}>
          <header>
            <div>
              <span>{competition.year ?? "年度待定"} · {competition.season}</span>
              <h2>{competition.name}</h2>
            </div>
            <strong data-status={competition.status}>{publicCompetitionStatusLabels[competition.status]}</strong>
          </header>
          <div className="functional-competition-facts">
            <dl><dt>校区 / 类型</dt><dd>{competition.campus}<small>{competition.type}</small></dd></dl>
            <dl><dt>赛制</dt><dd>{competition.formatLabel}</dd></dl>
            {!competition.registrationWindow.includes("待") ? <dl><dt>报名时间</dt><dd>{competition.registrationWindow}</dd></dl> : null}
            {!competition.matchWindow.includes("待") ? <dl><dt>比赛时间</dt><dd>{competition.matchWindow}</dd></dl> : null}
            {!competition.venue.includes("待") ? <dl><dt>场地</dt><dd>{competition.venue}</dd></dl> : null}
            {!competition.host.includes("待") ? <dl><dt>主办单位</dt><dd>{competition.host}</dd></dl> : null}
            {!competition.organizer.includes("待") ? <dl><dt>承办单位</dt><dd>{competition.organizer}</dd></dl> : null}
            {!competition.scale.includes("待") ? <dl><dt>参赛规模</dt><dd>{competition.scale}</dd></dl> : null}
          </div>
          <ul>{competition.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
          <p><strong>赛事简介：</strong>{competition.summary}</p>
          {competition.status === "completed" && competition.notice ? <p>{competition.notice}</p> : null}
          <footer>
            <Link href={competition.detailHref}>赛事详情 →</Link>
            <Link href={competition.filesHref}>相关文件 →</Link>
          </footer>
        </article>
      ))}
    </div>
  );
}
