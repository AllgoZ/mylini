'use client';

import { Ruler, X as XIcon } from 'lucide-react';

interface SizeChartModalProps {
  open: boolean;
  sizeChartUrl: string;
  onClose: () => void;
}

// Extracted from ProductDetailClient so it can be code-split (next/dynamic) — it's only
// rendered after a click, and only for the subset of products that have a size chart.
export function SizeChartModal({ open, sizeChartUrl, onClose }: SizeChartModalProps) {
  if (!open || !sizeChartUrl) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-ink/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative bg-canvas rounded-2xl shadow-[0_24px_80px_rgba(0,0,0,0.35)] max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft">
          <div className="flex items-center gap-2">
            <Ruler size={16} className="text-clay" />
            <span className="font-bold text-[0.95rem] text-ink">Size Chart</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface hover:bg-surface-2 flex items-center justify-center transition-colors"
          >
            <XIcon size={16} className="text-text-mid" />
          </button>
        </div>
        <div className="overflow-auto p-4 flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={sizeChartUrl}
            alt="Size chart"
            className="max-w-full rounded-xl object-contain"
          />
        </div>
      </div>
    </div>
  );
}
