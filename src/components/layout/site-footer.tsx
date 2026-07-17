import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { associationIdentity, footerScopeStatements } from "@/data/association";
import { ASSOCIATION_EMAIL, BILIBILI_PROFILE_URL } from "@/data/platforms";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-shell">
        <div className="footer-main">
          <div>
            <div className="footer-brand">
              <BrandMark />
              <div className="footer-brand-copy">
                <strong>{associationIdentity.formalName}</strong>
                <small>{associationIdentity.englishName.toUpperCase()}</small>
              </div>
            </div>
            <p className="footer-intro">
              {associationIdentity.slogan}。我们服务天目湖校园足球，连接赛事、球队、裁判与每一位参与者。
            </p>
          </div>
          <nav className="footer-column" aria-label="页脚导航">
            <h2>网站导航</h2>
            <Link href="/competitions">天目湖赛事</Link>
            <Link href="/news">新闻与公告</Link>
            <Link href="/referees">裁判与规则</Link>
            <Link href="/competitions/arbitration">仲裁与申诉</Link>
            <Link href="/participation">参赛与报名</Link>
          </nav>
          <div className="footer-column">
            <h2>联系与归属</h2>
            <a href={`mailto:${ASSOCIATION_EMAIL}`}>{ASSOCIATION_EMAIL}</a>
            <a href={BILIBILI_PROFILE_URL} target="_blank" rel="noopener noreferrer" aria-label="前往南航校园足球共享视频平台，将在新标签页打开">
              南航校园足球共享视频平台 ↗
            </a>
            <div className="footer-emblem">
              <Image src="/images/nuaa-emblem.jpg" alt="南京航空航天大学校徽" width={46} height={46} />
              <p>学校归属标识<br />不作为协会 Logo 使用</p>
            </div>
          </div>
        </div>

        <div className="footer-declarations" aria-label="网站范围声明">
          {footerScopeStatements.map((statement) => <p key={statement}>{statement}</p>)}
        </div>

        <div className="footer-bottom">
          <p>© 2026 {associationIdentity.shortName} · {associationIdentity.establishedLabel}</p>
          <p>V2 静态原型 · 演示内容均不代表真实历史记录</p>
        </div>
      </div>
    </footer>
  );
}
