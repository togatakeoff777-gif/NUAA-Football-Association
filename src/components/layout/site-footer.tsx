import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/ui/brand-mark";
import { associationIdentity, footerScopeStatements } from "@/data/association";
import {
  bilibiliPlatform,
  emailPlatform,
  footballChinaPlatform,
  wechatPlatform,
} from "@/data/platforms";

type SiteFooterProps = {
  homeCompact?: boolean;
};

export function SiteFooter({ homeCompact = false }: SiteFooterProps) {
  return (
    <footer className={`site-footer${homeCompact ? " site-footer-home" : ""}`}>
      <div className="page-shell">
        <div className="footer-main" data-home-reveal data-home-delay="0">
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
            <h2>官方平台与联系</h2>
            <a className="footer-wechat" href={wechatPlatform.qrImage} target="_blank" rel="noopener noreferrer" aria-label="放大湖区FA微信公众号二维码，将在新标签页打开">
              <Image src={wechatPlatform.qrImage} alt={wechatPlatform.qrAlt} width={66} height={66} />
              <span><strong>{wechatPlatform.label}</strong><small>{wechatPlatform.name} · 点击放大二维码</small></span>
            </a>
            <a href={bilibiliPlatform.href} target="_blank" rel="noopener noreferrer" aria-label="前往南航校园足球共享视频平台，将在新标签页打开">
              哔哩哔哩 · {bilibiliPlatform.name} ↗
            </a>
            <a href={footballChinaPlatform.href} target="_blank" rel="noopener noreferrer" aria-label="前往足球中国，将在新标签页打开">
              足球中国 · 注册报名平台 ↗
            </a>
            <a href={emailPlatform.href}>联系邮箱 · {emailPlatform.label}</a>
            <div className="footer-emblem">
              <Image src="/images/nuaa-emblem.jpg" alt="南京航空航天大学校徽" width={46} height={46} />
              <p>学校归属标识<br />不作为协会 Logo 使用</p>
            </div>
          </div>
        </div>

        <div className="footer-declarations" aria-label="网站范围声明" data-home-reveal data-home-delay="1">
          {footerScopeStatements.map((statement) => <p key={statement}>{statement}</p>)}
        </div>

        <div className="footer-bottom" data-home-reveal data-home-delay="2">
          <p>© 2026 {associationIdentity.shortName} · {associationIdentity.establishedLabel}</p>
          <p>{homeCompact ? "V2.2 首页体验原型" : "V2.1 静态原型"} · 演示内容均不代表真实历史记录</p>
        </div>
      </div>
    </footer>
  );
}
