type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
  statusLabel?: string;
  variant: "category" | "list" | "data" | "detail" | "archive" | "process";
  aside?: React.ReactNode;
};

export function PageIntro({ eyebrow, title, description, statusLabel, variant, aside }: PageIntroProps) {
  return (
    <section className={`template-intro template-intro-${variant}`} aria-labelledby="template-page-title">
      <div className={aside ? "page-shell template-intro-grid" : "page-shell template-intro-grid template-intro-grid-single"}>
        <div className="template-intro-copy">
          <p className="template-eyebrow">{eyebrow}</p>
          <h1 id="template-page-title">{title}</h1>
          <p>{description}</p>
          {statusLabel ? <span className="template-status">{statusLabel}</span> : null}
        </div>
        {aside ? <div className="template-intro-aside">{aside}</div> : null}
      </div>
    </section>
  );
}
