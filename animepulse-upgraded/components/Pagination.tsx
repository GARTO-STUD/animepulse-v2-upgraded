/**
 * components/Pagination.tsx
 * Reusable pagination component.
 */
'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export default function Pagination({ page, pages, onPageChange, className = '' }: PaginationProps) {
  if (pages <= 1) return null;

  // Build page numbers to show: first, last, current ±2
  const range: (number | '...')[] = [];
  const addPage = (n: number) => {
    if (n >= 1 && n <= pages && !range.includes(n)) range.push(n);
  };

  addPage(1);
  if (page > 4) range.push('...');
  for (let i = Math.max(2, page - 2); i <= Math.min(pages - 1, page + 2); i++) addPage(i);
  if (page < pages - 3) range.push('...');
  addPage(pages);

  return (
    <div className={`flex items-center justify-center gap-1 ${className}`}>
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-xl bg-[#0d1117] border border-[#1a2235] text-[#8892a4] hover:text-white hover:border-[#e85d04]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {range.map((n, i) =>
        n === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2 text-[#8892a4] text-sm">…</span>
        ) : (
          <button
            key={n}
            onClick={() => onPageChange(n as number)}
            className={`w-9 h-9 rounded-xl text-sm font-bold transition-colors ${
              n === page
                ? 'bg-[#e85d04] text-white shadow-lg shadow-[#e85d04]/20'
                : 'bg-[#0d1117] border border-[#1a2235] text-[#8892a4] hover:text-white hover:border-[#e85d04]/30'
            }`}
          >
            {n}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        className="p-2 rounded-xl bg-[#0d1117] border border-[#1a2235] text-[#8892a4] hover:text-white hover:border-[#e85d04]/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}
