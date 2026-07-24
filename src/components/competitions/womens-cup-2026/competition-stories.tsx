import Image from "next/image";
import Link from "next/link";

import { ArchiveGallery } from "@/components/competitions/archive/archive-gallery";
import { womensIntercollegeCup2026 } from "@/data/womens-intercollege-cup-2026";

export function WomensCompetitionStories() {
  const { awardList, competition, gallery, news, podium } = womensIntercollegeCup2026;
  return (
    <>
      <section className="cup-archive-section cup-final-section" id="honours" aria-labelledby="womens-honours-title">
        <div className="page-shell">
          <div className="cup-section-heading cup-section-heading-light"><div><p>FINAL PLACINGS & AWARDS</p><h2 id="womens-honours-title">名次与奖项</h2></div><span>以下结果来自本轮提供的校级官方账号报道。</span></div>
          <div className="cup-womens-podium" aria-label="女子足球院际杯最终名次">{podium.map((item) => <article key={item.rank}><span>{String(item.rank).padStart(2, "0")}</span><p>{item.rank === 1 ? "冠军" : item.rank === 2 ? "亚军" : "季军"}</p><h3>{item.team}</h3>{"note" in item ? <small>{item.note}</small> : null}</article>)}</div>
          <div className="cup-womens-awards" aria-label="女子足球院际杯个人奖项">{awardList.map((award, index) => <article key={award.award}><span>AWARD {String(index + 1).padStart(2, "0")}</span><h3>{award.award}</h3><strong>{award.recipient}</strong></article>)}</div>
        </div>
      </section>
      <section className="cup-archive-section" id="reports" aria-labelledby="womens-story-title">
        <div className="page-shell">
          <div className="cup-section-heading"><div><p>COMPETITION REPORT</p><h2 id="womens-story-title">赛事报道</h2></div><span>来源：{competition.sourceArticlePublisher} · {competition.sourceArticlePublishedAt}</span></div>
          <Link className="cup-womens-story-card" href={news.href}><div><Image src={news.image} alt={news.imageAlt} fill sizes="(max-width: 820px) 100vw, 48vw" /></div><article><span>{news.category} · {news.badge}</span><h3>{news.title}</h3><p>{news.summary}</p><b>阅读全文 →</b></article></Link>
        </div>
      </section>
      <section className="cup-archive-section cup-archive-section-tint" id="media" aria-labelledby="womens-gallery-title">
        <div className="page-shell"><div className="cup-section-heading"><div><p>PHOTO ARCHIVE</p><h2 id="womens-gallery-title">赛事影像</h2></div><span>16张协会原始照片按原图比例展示，不添加或移除水印。</span></div><ArchiveGallery images={gallery} ariaLabel="2026女子足球院际杯16张赛事原始照片" /></div>
      </section>
      <section className="cup-archive-source-section" id="archive-scope" aria-labelledby="womens-source-title"><div className="page-shell"><div><p>ARCHIVE SCOPE</p><h2 id="womens-source-title">资料说明</h2></div><p>当前归档依据足球中国截图、结构化赛事数据、校级官方账号报道与协会原始照片整理。未能清晰辨认的姓名、完整射手榜与纪律统计冲突已列入待核验项。</p></div></section>
    </>
  );
}
