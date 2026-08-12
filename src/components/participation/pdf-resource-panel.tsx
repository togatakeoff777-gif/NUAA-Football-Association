type PdfResourcePanelProps = {
  eyebrow: string;
  title: string;
  description: string;
  fileLabel: string;
  href: string;
  children?: React.ReactNode;
};

export function PdfResourcePanel({
  eyebrow,
  title,
  description,
  fileLabel,
  href,
  children,
}: PdfResourcePanelProps) {
  return (
    <article className="participation-pdf-module">
      <header>
        <span>{eyebrow}</span>
        <h2>{title}</h2>
        <p>{description}</p>
      </header>
      {children}
      <div className="participation-pdf-preview">
        <iframe
          loading="lazy"
          src={`${href}#view=FitH`}
          title={`${title} PDF 在线预览`}
        />
        <p>如当前浏览器无法显示 PDF，请使用下方“在线打开”或“下载完整 PDF”。</p>
      </div>
      <footer>
        <a href={href} rel="noopener noreferrer" target="_blank">
          在线打开完整 PDF <span aria-hidden="true">↗</span>
        </a>
        <a download href={href}>
          下载完整 PDF <span aria-hidden="true">↓</span>
        </a>
        <small>{fileLabel}</small>
      </footer>
    </article>
  );
}
