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
            <dl><dt>报名时间</dt><dd>{competition.registrationWindow}</dd></dl>
            <dl><dt>比赛时间</dt><dd>{competition.matchWindow}</dd></dl>
            <dl><dt>场地</dt><dd>{competition.venue}</dd></dl>
            <dl><dt>主办单位</dt><dd>{competition.host}</dd></dl>
            <dl><dt>承办单位</dt><dd>{competition.organizer}</dd></dl>
            <dl><dt>参赛规模</dt><dd>{competition.scale}</dd></dl>
          </div>
          <ul>{competition.requirements.map((item) => <li key={item}>{item}</li>)}</ul>
          <p><strong>赛事简介：</strong>{competition.summary}</p>
          <p>{competition.notice}</p>
          <footer>
            <Link href={competition.detailHref}>赛事详情 →</Link>
            <Link href={competition.filesHref}>相关文件 →</Link>
          </footer>
        </article>
      ))}
    </div>
  );
}
