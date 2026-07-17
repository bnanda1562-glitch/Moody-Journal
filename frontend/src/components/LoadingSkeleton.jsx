import React from 'react';

export const CardSkeleton = () => (
  <div className="glass-card p-6 w-full space-y-4">
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full skeleton"></div>
      <div className="space-y-2 flex-1">
        <div className="h-4 w-1/3 skeleton"></div>
        <div className="h-3 w-1/4 skeleton"></div>
      </div>
    </div>
    <div className="space-y-2 pt-2">
      <div className="h-3.5 w-full skeleton"></div>
      <div className="h-3.5 w-5/6 skeleton"></div>
      <div className="h-3.5 w-2/3 skeleton"></div>
    </div>
  </div>
);

export const ChartSkeleton = () => (
  <div className="glass-card p-6 w-full space-y-4">
    <div className="h-5 w-1/4 skeleton"></div>
    <div className="h-48 w-full skeleton rounded-xl"></div>
  </div>
);

export const HeatmapSkeleton = () => (
  <div className="glass-card p-6 w-full space-y-4">
    <div className="h-5 w-1/4 skeleton"></div>
    <div className="grid grid-cols-24 gap-1">
      {Array.from({ length: 48 }).map((_, i) => (
        <div key={i} className="aspect-square skeleton rounded-sm"></div>
      ))}
    </div>
  </div>
);

export const JournalItemSkeleton = () => (
  <div className="p-4 rounded-xl border border-slate-200/20 dark:border-slate-800/20 bg-white/20 dark:bg-black/20 flex justify-between gap-4">
    <div className="space-y-2 flex-1">
      <div className="h-4 w-2/3 skeleton"></div>
      <div className="h-3.5 w-full skeleton"></div>
      <div className="h-3 w-1/3 skeleton"></div>
    </div>
    <div className="w-12 h-12 rounded-lg skeleton"></div>
  </div>
);
