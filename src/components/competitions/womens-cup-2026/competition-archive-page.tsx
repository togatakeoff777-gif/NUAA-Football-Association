import Image from "next/image";
import Link from "next/link";

import { ArchiveGallery } from "@/components/competitions/archive/archive-gallery";
import { ArchiveSectionNav } from "@/components/competitions/archive/archive-section-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { womensIntercollegeCup2026 } from "@/data/womens-intercollege-cup-2026";

const archiveNavigation = [
  { id: "overview", label: "赛事概览" },
  { id: "honours", label: "名次与奖项" },
  { id: "closing-story", label: "收官报道" },
  { id: "gallery", label: "赛事影像" },
  { id: "archive-scope", label: "资料说明" },
] as const;

export function WomensCompetitionArchivePage() {
  const { competition, podium, awards, gallery, heroImage, news } = womensIntercollegeCup2026;

  return (
    <>
      <SiteHeader fixed />
      <main className="cup-archive-page cup-womens-page" id="main-content">
        <section className="cup-archive-hero cup-archive-hero-womens" aria-labelledby="womens-cup-title">
          <Image
            className="cup-archive-hero-image"
            src={heroImage}
            alt="2026天目湖校区女足赛事集体合影"
            fill
            preload
            sizes="100vw"
          />
          <div className="cup-archive-hero-overlay" aria-hidden="true" />
          <div className="page-shell cup-archive-hero-inner">
            <div className="cup-archive-hero-copy">
              <p>COMPETITION ARCHIVE · WOMEN&apos;S FOOTBALL · 2026</p>
              <span className="cup-official-status">已结束 / 来源已确认</span>
              <h1 id="womens-cup-title">{competition.canonicalTitle}</h1>
              <p>本页依据校级官方账号报道与协会原始照片整理，仅呈现已经确认的赛事名次、个人奖项与收官影像。</p>
              <div>
                <a href="#honours">查看赛事结果 <span aria-hidden="true">↓</span></a>
                <Link href={news.href}>阅读收官报道 <span aria-hidden="true">→</span></Link>
              </div>
            </div>
            <dl className="cup-archive-hero-summary">
              <div><dt>状态</dt><dd>{competition.archiveStatus}</dd></div>
              <div><dt>年份</dt><dd>{competition.year}</dd></div>
              <div><dt>地点</dt><dd>{competition.venue}</dd></div>
              <div><dt>资料来源</dt><dd>校级官方账号报道 / 协会原始照片</dd></div>
            </dl>
          </div>
        </section>

        <ArchiveSectionNav items={archiveNavigation} ariaLabel="女子足球院际杯档案章节" />

        <section className="cup-archive-section cup-overview-section" id="overview" aria-labelledby="womens-overview-title">
          <div className="page-shell">
            <div className="cup-section-heading">
              <div><p>COMPETITION PROFILE</p><h2 id="womens-overview-title">赛事概览</h2></div>
              <span>资料完整度与现有来源相匹配，不补写未经确认的赛期、参赛队数量或比赛场数。</span>
            </div>
            <div className="cup-womens-overview">
              <article>
                <p>OFFICIAL SOURCE ARCHIVE</p>
                <h3>绿茵逐梦，铿锵绽放</h3>
                <p>2026天目湖校区女足赛事已经圆满结束。报道记录了参赛队伍在比赛中展现的球技、协作和青春活力。</p>
              </article>
              <dl>
                <div><dt>赛事名称</dt><dd>{competition.shortTitle}</dd></div>
                <div><dt>举办地点</dt><dd>{competition.venue}</dd></div>
                <div><dt>归档状态</dt><dd>{competition.archiveStatus}</dd></div>
                <div><dt>报道时间</dt><dd>2026年6月22日 16:53</dd></div>
              </dl>
            </div>
          </div>
        </section>

        <section className="cup-archive-section cup-archive-section-tint" id="honours" aria-labelledby="womens-honours-title">
          <div className="page-shell">
            <div className="cup-section-heading">
              <div><p>FINAL PLACINGS & AWARDS</p><h2 id="womens-honours-title">最终名次与赛事奖项</h2></div>
              <span>以下结果均来自本轮提供的校级官方账号报道。</span>
            </div>
            <div className="cup-womens-podium" aria-label="女子足球院际杯最终名次">
              {podium.map((item) => (
                <article key={item.rank}>
                  <span>{String(item.rank).padStart(2, "0")}</span>
                  <p>{item.rank === 1 ? "冠军" : item.rank === 2 ? "亚军" : "季军"}</p>
                  <h3>{item.team}</h3>
                  {"note" in item ? <small>{item.note}</small> : null}
                </article>
              ))}
            </div>
            <div className="cup-womens-awards" aria-label="女子足球院际杯个人奖项">
              {awards.map((award, index) => (
                <article key={award.award}>
                  <span>AWARD {String(index + 1).padStart(2, "0")}</span>
                  <h3>{award.award}</h3>
                  <strong>{award.recipient}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="cup-archive-section" id="closing-story" aria-labelledby="womens-story-title">
          <div className="page-shell">
            <div className="cup-section-heading">
              <div><p>CLOSING STORY</p><h2 id="womens-story-title">收官报道</h2></div>
              <span>来源：{competition.sourceArticlePublisher} · 2026年6月22日 16:53</span>
            </div>
            <Link className="cup-womens-story-card" href={news.href}>
              <div><Image src={news.image} alt={news.imageAlt} fill sizes="(max-width: 820px) 100vw, 48vw" /></div>
              <article>
                <span>{news.category} · {news.badge}</span>
                <h3>{news.title}</h3>
                <p>{news.summary}</p>
                <b>阅读全文 →</b>
              </article>
            </Link>
          </div>
        </section>

        <section className="cup-archive-section cup-archive-section-tint" id="gallery" aria-labelledby="womens-gallery-title">
          <div className="page-shell">
            <div className="cup-section-heading">
              <div><p>PHOTO ARCHIVE</p><h2 id="womens-gallery-title">赛事影像</h2></div>
              <span>16张协会原始照片按原图比例展示，不添加或移除水印。</span>
            </div>
            <ArchiveGallery images={gallery} ariaLabel="2026女子足球院际杯16张赛事原始照片" />
          </div>
        </section>

        <section className="cup-archive-source-section" id="archive-scope" aria-labelledby="womens-source-title">
          <div className="page-shell">
            <div><p>ARCHIVE SCOPE</p><h2 id="womens-source-title">资料说明</h2></div>
            <p>当前归档依据校级官号报道与协会原始照片整理。逐场数据及完整名单后续补充。</p>
          </div>
        </section>

        <div className="cup-archive-return"><div className="page-shell"><Link href="/competitions">← 返回赛事中心</Link><span>档案状态：已结束 / 来源已确认</span></div></div>
      </main>
      <SiteFooter />
    </>
  );
}
