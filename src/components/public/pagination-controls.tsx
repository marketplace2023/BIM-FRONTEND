"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationControlsProps {
  page: number;
  total: number;
  limit: number;
  onPageChange: (page: number) => void;
}

function buildPages(currentPage: number, totalPages: number) {
  const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
  return Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
}

export function PaginationControls({ page, total, limit, onPageChange }: PaginationControlsProps) {
  const totalPages = Math.max(1, Math.ceil(total / Math.max(limit, 1)));

  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPages(page, totalPages);

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      <Button variant="outline" size="sm" className="rounded-full" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
        <ChevronLeft className="h-4 w-4" />
      </Button>

      {pages.map((pageNumber, index) => {
        const previous = pages[index - 1];
        const showGap = previous && pageNumber - previous > 1;

        return (
          <div key={pageNumber} className="flex items-center gap-2">
            {showGap && <span className="px-1 text-sm text-zinc-400">...</span>}
            <Button
              variant={pageNumber === page ? "default" : "outline"}
              size="sm"
              className="min-w-9 rounded-full"
              onClick={() => onPageChange(pageNumber)}
            >
              {pageNumber}
            </Button>
          </div>
        );
      })}

      <Button variant="outline" size="sm" className="rounded-full" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}
