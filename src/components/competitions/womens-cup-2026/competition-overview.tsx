import { womensIntercollegeCup2026 } from "@/data/womens-intercollege-cup-2026";
import {
  MEN_AND_WOMEN_CUP_HOST,
  MEN_AND_WOMEN_CUP_ORGANIZER,
} from "@/data/competition-directory";

function formatDateTime(value: string) {
  const [date, time] = value.split(" ");
  return `${date.replaceAll("-", ".")} ${time}`;
}

export function WomensCompetitionOverview() {
  const { competition } = womensIntercollegeCup2026;
  const { registration, rules, summary } = competition;

  return (
    <section
      className="cup-archive-section cup-overview-section"
      id="overview"
      aria-labelledby="womens-overview-title"
    >
      <div className="page-shell">
        <div className="cup-section-heading">
          <div>
            <p>COMPETITION PROFILE</p>
            <h2 id="womens-overview-title">赛事概览</h2>
          </div>
          <span>报名设置、赛事统计与竞赛规则均来自本轮足球中国截图及结构化数据。</span>
        </div>

        <div className="cup-womens-overview cup-womens-overview-complete">
          <article>
            <p>OFFICIAL SOURCE ARCHIVE</p>
            <h3>绿茵逐梦，铿锵绽放</h3>
            <p>
              本届五人制赛事共有{summary.teams}支球队、{summary.players}名球员完成注册，
              共进行{summary.matches}场比赛并产生{summary.goals}粒进球。
            </p>
          </article>
          <dl>
            <div><dt>赛事名称</dt><dd>{competition.shortName}</dd></div>
            <div><dt>比赛场地</dt><dd>{competition.venue}</dd></div>
            <div><dt>报名时间</dt><dd>{formatDateTime(registration.start)} - {formatDateTime(registration.end)}</dd></div>
            <div><dt>报名费用</dt><dd>报名费{registration.feePerTeam}元 / 保证金{registration.depositPerTeam}元</dd></div>
            <div><dt>主办单位</dt><dd>{MEN_AND_WOMEN_CUP_HOST}</dd></div>
            <div><dt>承办单位</dt><dd>{MEN_AND_WOMEN_CUP_ORGANIZER}</dd></div>
          </dl>
        </div>

        <div className="cup-overview-stats cup-womens-stat-strip" aria-label="女子足球院际杯赛事统计">
          {[
            [summary.teams, "参赛球队"],
            [summary.players, "注册球员"],
            [summary.matches, "比赛场次"],
            [summary.goals, "进球总数"],
            [summary.yellowCards, "汇总黄牌"],
            [summary.redCards, "汇总红牌"],
          ].map(([value, label]) => (
            <div key={label}><strong>{value}</strong><span>{label}</span></div>
          ))}
        </div>

        <div className="cup-womens-rule-grid">
          <section>
            <span>比赛时长</span>
            <strong>{rules.firstHalfMinutes} + {rules.secondHalfMinutes} 分钟</strong>
            <p>不设置加时赛。</p>
          </section>
          <section>
            <span>积分规则</span>
            <strong>胜{rules.points.win} / 平{rules.points.draw} / 负{rules.points.loss}</strong>
            <p>点球胜{rules.points.penaltyWin}分，点球负{rules.points.penaltyLoss}分。</p>
          </section>
          <section>
            <span>名单发布</span>
            <strong>赛前{rules.publishStartingLineupMinutesBefore}分钟</strong>
            <p>首发名单与裁判名单均按赛前30分钟设置。</p>
          </section>
          <section>
            <span>停赛基准</span>
            <strong>2黄 / 1红</strong>
            <p>球员及工作人员达到对应条件停赛1场。</p>
          </section>
        </div>
      </div>
    </section>
  );
}
