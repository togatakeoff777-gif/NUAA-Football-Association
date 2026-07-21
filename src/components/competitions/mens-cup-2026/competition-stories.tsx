import Image from "next/image";
import Link from "next/link";

import { mensIntercollegeCup2026 } from "@/data/mens-intercollege-cup-2026";

const gallery = [
  { src: "/images/competitions/2026-mens-intercollege-cup/final-celebration-zhihui.jpg", alt: "致慧书院球员在点球大战获胜后庆祝" },
  { src: "/images/competitions/2026-mens-intercollege-cup/finalist-civil-aviation-team.jpg", alt: "民航通飞联队决赛阵容合影" },
  { src: "/images/competitions/2026-mens-intercollege-cup/final-officials-lineup.jpg", alt: "2026男子足球院际杯决赛裁判组列队" },
  { src: "/images/competitions/2026-mens-intercollege-cup/final-goal-zhihui.jpg", alt: "致慧书院球员在决赛中完成射门" },
  { src: "/images/competitions/2026-mens-intercollege-cup/referee-match-management.jpg", alt: "裁判员在比赛中进行现场管理" },
  { src: "/images/competitions/2026-mens-intercollege-cup/group-stage-team-orange.jpg", alt: "小组赛参赛球队赛前合影" },
] as const;

export function CompetitionStories() {
  const { competition, news } = mensIntercollegeCup2026;

  return (
    <section className="cup-archive-section" id="stories" aria-labelledby="cup-stories-title">
      <div className="page-shell">
        <div className="cup-section-heading">
          <div><p>NEWS & PHOTO ARCHIVE</p><h2 id="cup-stories-title">新闻报道与赛事影像</h2></div>
          <span>5篇正式报道与迁移包原始照片共同构成本届赛事档案。</span>
        </div>

        <div className="cup-story-list">
          {news.map((story, index) => (
            <Link className={index === 0 ? "is-featured" : undefined} href={story.href} key={story.id}>
              <div><Image src={story.image} alt={story.imageAlt} fill sizes={index === 0 ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 100vw, 260px"} /></div>
              <article><span>{story.category} · {story.dateLabel}</span><h3>{story.title}</h3><p>{story.summary}</p><b>阅读全文 →</b></article>
            </Link>
          ))}
        </div>

        <div className="cup-gallery" aria-label="赛事照片精选">
          {gallery.map((image, index) => <figure className={index === 0 ? "is-wide" : undefined} key={image.src}><Image src={image.src} alt={image.alt} fill sizes={index === 0 ? "(max-width: 760px) 100vw, 50vw" : "(max-width: 760px) 100vw, 25vw"} /></figure>)}
        </div>

        <div className="cup-document-callout">
          <div><p>OFFICIAL DOCUMENT</p><h3>赛事秩序册</h3><span>PDF文件按迁移包原始版本保留，包含完整赛事组织与竞赛资料。</span></div>
          <a href={competition.guidebook} download>下载 PDF <span aria-hidden="true">↓</span></a>
        </div>
      </div>
    </section>
  );
}
