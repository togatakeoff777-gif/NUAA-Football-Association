import Image from "next/image";
import Link from "next/link";
import { associationIdentity } from "@/data/association";

export function Hero() {
  return (
    <section className="hero" id="top" aria-labelledby="hero-title">
      <Image
        className="hero-image"
        src="/images/hero-football.jpg"
        alt="足球鞋踩在足球上，象征天目湖校园足球蓄势出发"
        fill
        preload
        sizes="100vw"
      />
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
        <p className="hero-university">
          <span>南京航空航天大学</span>
          <small>NANJING UNIVERSITY OF AERONAUTICS AND ASTRONAUTICS</small>
        </p>
        <h1 id="hero-title">
          <span>天目湖</span>
          <strong>足球协会</strong>
        </h1>
        <div className="hero-motto">
          <p>{associationIdentity.slogan}</p>
          <span>{associationIdentity.establishedLabel}</span>
        </div>
        <p className="hero-summary">
          服务天目湖校园足球，提供赛事、新闻公告、裁判规则与参赛报名信息。
        </p>
        <div className="hero-actions">
          <Link className="button button-primary" href="/competitions">
            查看天目湖赛事 <span aria-hidden="true">↗</span>
          </Link>
          <Link className="button button-outline" href="/participation">
            参赛与报名 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

    </section>
  );
}
