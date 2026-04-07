import Link from "next/link";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
            {item.href && !isLast ? (
              <Link href={item.href} className="transition-colors hover:text-zinc-900">
                {item.label}
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-zinc-900" : undefined}>
                {item.label}
              </span>
            )}
            {!isLast && <span className="text-zinc-300">/</span>}
          </span>
        );
      })}
    </nav>
  );
}
