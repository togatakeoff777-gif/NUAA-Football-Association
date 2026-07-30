import Link from "next/link";

import { CompetitionArchiveLayout } from "@/components/competitions/archive/competition-archive-layout";
import { ShareActions } from "@/components/share/share-actions";
import { freshmanCupReports } from "@/data/freshman-cup-2026";
import type { CoreCompetitionDirectoryEntry } from "@/types/competition-center";

type CoreCompetitionPreviewPageProps = {
  competition: CoreCompetitionDirectoryEntry;
};

const pendingMessage = "当前暂无已公布信息，请关注赛事公告。";

export function CoreCompetitionPreviewPage({
  competition,
}: CoreCompetitionPreviewPageProps) {
  const reports = competition.id === "freshman-cup" ? freshmanCupReports : [];
  return (
    <CompetitionArchiveLayout
      className="core-competition-preview-page"
      titleId={`${competition.id}-title`}
      title={competition.name}
      eyebrow={`CURRENT EDITION · ${competition.currentEdition}`}
      status={`${competition.statusLabel} / ${competition.badge}`}
      description={competition.summary}
      heroImage="/images/hero-football.jpg"
      heroAlt="足球鞋与足球组成的校园足球赛事视觉"
      actions={[
        { href: competition.links.schedule, label: "查看赛程赛果" },
        { href: competition.links.files, label: "查看赛事文件" },
      ]}
      summary={[
        { label: "当前届次", value: competition.currentEdition },
        { label: "校区", value: competition.campus },
        { label: "赛制", value: competition.formatLabel },
        { label: "比赛日期", value: competition.matchWindow },
      ]}
      returnStatus={`赛事状态：${competition.statusLabel} / ${competition.badge}`}
    >
      <div className="page-shell"><ShareActions title={competition.name} text={competition.summary} /></div>
      <section
        className="cup-archive-section core-competition-overview"
        id="overview"
        aria-labelledby={`${competition.id}-overview-title`}
      >
        <div className="page-shell">
          <div className="cup-section-heading">
            <div>
              <p>COMPETITION PROFILE</p>
              <h2 id={`${competition.id}-overview-title`}>赛事概览</h2>
            </div>
            <span>未正式公布的时间、场地与组织信息保持明确占位，不作推测。</span>
          </div>
          <div className="core-competition-facts">
            {[
              ["赛事名称", competition.name],
              ["年份 / 状态", `${competition.currentEdition} · ${competition.statusLabel}`],
              ["校区", competition.campus],
              ["赛制 / 组队", `${competition.formatLabel} · ${competition.teamFormation}`],
              ["报名日期", competition.registrationWindow],
              ["比赛日期", competition.matchWindow],
              ["比赛场地", competition.venue],
              ["主办单位", competition.host],
              ["承办单位", competition.organizer],
            ].map(([label, value]) => (
              <dl key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </dl>
            ))}
          </div>
          <p className="core-competition-summary">{competition.summary}</p>
        </div>
      </section>

      <section className="cup-archive-section cup-archive-section-tint" id="schedule" aria-labelledby={`${competition.id}-schedule-title`}>
        <div className="page-shell core-competition-pending">
          <div>
            <p>SCHEDULE & RESULTS</p>
            <h2 id={`${competition.id}-schedule-title`}>赛程与赛果</h2>
          </div>
          <p>{pendingMessage}</p>
          <Link href="/competitions/schedule">进入赛程与赛果中心 →</Link>
        </div>
      </section>

      <section className="cup-archive-section" id="standings" aria-labelledby={`${competition.id}-standings-title`}>
        <div className="page-shell core-competition-pending">
          <div>
            <p>STANDINGS & KNOCKOUT</p>
            <h2 id={`${competition.id}-standings-title`}>积分榜与淘汰赛</h2>
          </div>
          <p>当前尚无可核验榜单或淘汰赛对阵，不生成空表格或虚构排名。</p>
          <Link href="/competitions/standings">查看赛事类别与当前届次 →</Link>
        </div>
      </section>

      <section className="cup-archive-section cup-archive-section-tint" id="teams" aria-labelledby={`${competition.id}-teams-title`}>
        <div className="page-shell core-competition-pending">
          <div>
            <p>TEAMS</p>
            <h2 id={`${competition.id}-teams-title`}>参赛球队</h2>
          </div>
          <p>参赛队伍与公开联系人尚待赛事通知或球队负责人确认。</p>
          <Link href="/teams">进入当前组队与球队档案 →</Link>
        </div>
      </section>

      <section className="cup-archive-section" id="officials" aria-labelledby={`${competition.id}-officials-title`}>
        <div className="page-shell core-competition-pending">
          <div>
            <p>REFEREE APPOINTMENTS</p>
            <h2 id={`${competition.id}-officials-title`}>裁判选派</h2>
          </div>
          <p>当前暂无已发布选派，正式安排以裁判中心公开记录为准。</p>
          <Link href="/referees/assignments">查看裁判员选派公示 →</Link>
        </div>
      </section>

      <section className="cup-archive-section cup-archive-section-tint" id="honours" aria-labelledby={`${competition.id}-honours-title`}>
        <div className="page-shell core-competition-pending">
          <div>
            <p>HONOURS</p>
            <h2 id={`${competition.id}-honours-title`}>名次与奖项</h2>
          </div>
          <p>赛事尚未结束，不提前生成名次、奖项或获奖人员信息。</p>
        </div>
      </section>

      <section className="cup-archive-section" id="reports" aria-labelledby={`${competition.id}-reports-title`}>
        <div className="page-shell core-competition-pending">
          <div>
            <p>REPORTS</p>
            <h2 id={`${competition.id}-reports-title`}>赛事报道</h2>
          </div>
          {reports.length ? (
            <div className="core-competition-report-list">
              {reports.map((report) => (
                <Link href={report.href} key={report.id}>
                  <time>{report.dateLabel}</time>
                  <span>{report.category}</span>
                  <strong>{report.title}</strong>
                </Link>
              ))}
            </div>
          ) : <p>当前暂无已核验的本届赛事报道。</p>}
          <Link href="/news">进入新闻公告 →</Link>
        </div>
      </section>

      <section className="cup-archive-section cup-archive-section-tint" id="media" aria-labelledby={`${competition.id}-media-title`}>
        <div className="page-shell core-competition-pending">
          <div>
            <p>MEDIA</p>
            <h2 id={`${competition.id}-media-title`}>赛事影像</h2>
          </div>
          <p>只在取得来源与授权后发布赛事照片和视频。</p>
          <Link href="/media">进入影像资料 →</Link>
        </div>
      </section>

      <section className="cup-archive-section" id="archive-scope" aria-labelledby={`${competition.id}-scope-title`}>
        <div className="page-shell core-competition-pending">
          <div>
            <p>FILES & DATA SCOPE</p>
            <h2 id={`${competition.id}-scope-title`}>文件与资料说明</h2>
          </div>
          <p>{competition.notice}</p>
          <Link href={competition.links.files}>查看已核验赛事文件 →</Link>
        </div>
      </section>
    </CompetitionArchiveLayout>
  );
}
