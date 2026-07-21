import Image from "next/image";
import Link from "next/link";
import { associationIdentity } from "@/data/association";

export function Hero() {
  return (
    <section className="hero home-screen home-screen-hero" data-home-screen="hero" id="top" aria-labelledby="hero-title">
      <div className="hero-image-frame">
        <Image
          className="hero-image"
          src="/images/hero-football.jpg"
          alt="足球鞋踩在足球上，象征天目湖校园足球蓄势出发"
          fill
          preload
          sizes="(min-width: 768px) 80vw, 100vw"
        />
      </div>
      <div className="hero-overlay" aria-hidden="true" />
      <div className="hero-engineering-grid" aria-hidden="true" />
      <div className="hero-radar" aria-hidden="true">
        <span />
        <span />
        <i />
      </div>
      <div className="hero-route" aria-hidden="true">
        <i /><i /><i />
      </div>

      <div className="page-shell hero-content">
        <p className="hero-university" data-home-reveal data-home-delay="0">
          <span>南京航空航天大学</span>
          <small>NANJING UNIVERSITY OF AERONAUTICS AND ASTRONAUTICS</small>
        </p>
        <h1 id="hero-title" data-home-reveal data-home-delay="1">
          <span>天目湖</span>
          <strong>足球协会</strong>
        </h1>
        <div className="hero-motto" data-home-reveal data-home-delay="2">
          <p>{associationIdentity.slogan}</p>
          <span>{associationIdentity.establishedLabel}</span>
        </div>
        <p className="hero-summary" data-home-reveal data-home-delay="3">
          服务天目湖校园足球，提供赛事、新闻公告、裁判规则与参赛报名信息。
        </p>
        <div className="hero-actions" data-home-reveal data-home-delay="4">
          <Link className="button button-primary" href="/competitions/schedule">
            赛程&amp;赛果 <span aria-hidden="true">↗</span>
          </Link>
          <Link className="button button-outline" href="/participation">
            参赛指南 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
      <a className="hero-scroll-cue" href="#home-match" aria-label="向下滚动至比赛信息">
        <span>向下滚动</span>
        <i aria-hidden="true" />
      </a>
    </section>
  );
}
