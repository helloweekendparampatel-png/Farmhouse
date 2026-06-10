import Link from 'next/link';
import type { ReactNode } from 'react';

export function PageIntro({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-hero">
      <div className="page-hero__content">
        {eyebrow ? <span className="page-eyebrow">{eyebrow}</span> : null}
        <h1>{title}</h1>
        {description ? <p className="page-description">{description}</p> : null}
      </div>
      {actions ? <div className="page-hero__actions">{actions}</div> : null}
    </header>
  );
}

export function HeaderLink({
  href,
  children,
  variant = 'secondary',
}: {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <Link
      href={href}
      className={variant === 'primary' ? 'button-link button-link--primary' : 'button-link'}
    >
      {children}
    </Link>
  );
}

export function SectionCard({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="card section-card">
      <div className="section-card__header">
        <div>
          <h2>{title}</h2>
          {description ? <p>{description}</p> : null}
        </div>
        {aside ? <div className="section-card__aside">{aside}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function StatCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
      {meta ? <div className="stat-meta">{meta}</div> : null}
    </div>
  );
}

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="empty-panel">
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
    </div>
  );
}
