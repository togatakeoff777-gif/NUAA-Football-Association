import Link from "next/link";

type EmptyStateProps = {
  title: string;
  description: string;
  href?: string;
  actionLabel?: string;
  compact?: boolean;
};

export function EmptyState({
  title,
  description,
  href,
  actionLabel,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={compact ? "empty-state empty-state-compact" : "empty-state"} role="status">
      <span className="empty-state-mark" aria-hidden="true">—</span>
      <div>
        <h3>{title}</h3>
        <p>{description}</p>
      </div>
      {href && actionLabel ? <Link href={href}>{actionLabel} <span aria-hidden="true">→</span></Link> : null}
    </div>
  );
}
