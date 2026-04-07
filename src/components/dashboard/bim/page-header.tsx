import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border bg-white p-6 shadow-sm">
      <div className="space-y-2">
        {eyebrow && (
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-blue-600">
            {eyebrow}
          </p>
        )}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-zinc-500">{description}</p>
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
