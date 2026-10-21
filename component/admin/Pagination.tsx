import Link from 'next/link';

export interface PaginationProps {
  basePath: string;
  // Active filters, kept in every page link.
  params: Record<string, string>;
  page: number;
  totalPages: number;
}

function hrefFor(basePath: string, params: Record<string, string>, page: number) {
  const search = new URLSearchParams(params);
  if (page > 1) search.set('page', String(page));
  const query = search.toString();
  return query ? `${basePath}?${query}` : basePath;
}

// First, last, and a window around the current page, with gaps collapsed to ellipses.
function visiblePages(page: number, totalPages: number): (number | 'gap')[] {
  const wanted = new Set([1, totalPages, page - 1, page, page + 1]);
  const pages = [...wanted].filter((p) => p >= 1 && p <= totalPages).sort((a, b) => a - b);
  const result: (number | 'gap')[] = [];
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) result.push('gap');
    result.push(p);
  });
  return result;
}

const linkClassName = 'rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted';

export default function Pagination({ basePath, params, page, totalPages }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center gap-2">
      {page > 1 ? (
        <Link href={hrefFor(basePath, params, page - 1)} className={linkClassName}>
          Previous
        </Link>
      ) : (
        <span className={`${linkClassName} pointer-events-none opacity-40`}>Previous</span>
      )}

      {visiblePages(page, totalPages).map((p, i) =>
        p === 'gap' ? (
          <span key={`gap-${i}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={hrefFor(basePath, params, p)}
            aria-current={p === page ? 'page' : undefined}
            className={`${linkClassName} ${p === page ? 'bg-foreground text-background hover:bg-foreground' : ''}`}
          >
            {p}
          </Link>
        ),
      )}

      {page < totalPages ? (
        <Link href={hrefFor(basePath, params, page + 1)} className={linkClassName}>
          Next
        </Link>
      ) : (
        <span className={`${linkClassName} pointer-events-none opacity-40`}>Next</span>
      )}
    </nav>
  );
}
