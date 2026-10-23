import Link from 'next/link';

export default function DashboardStatCard({ label, value, note, href }: {
  label: string; value: string; note: string; href?: string;
}) {
  const content = <>
    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="mt-3 text-3xl font-bold tabular-nums">{value}</p>
    <p className="mt-2 text-xs text-muted-foreground">{note}</p>
  </>;
  const className = 'rounded-xl border border-border bg-background p-6';
  return href ? <Link href={href} className={`${className} transition-colors hover:bg-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-foreground`}>{content}</Link>
    : <div className={className}>{content}</div>;
}
