type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description?: string;
  inverted?: boolean;
  action?: React.ReactNode;
  id?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  inverted = false,
  action,
  id,
}: SectionHeadingProps) {
  return (
    <div className={inverted ? "section-heading section-heading-inverted" : "section-heading"}>
      <div className="section-heading-copy">
        <p className="section-eyebrow">{eyebrow}</p>
        <h2 id={id}>{title}</h2>
      </div>
      <div className="section-heading-aside">
        {description ? <p>{description}</p> : null}
        {action}
      </div>
    </div>
  );
}
