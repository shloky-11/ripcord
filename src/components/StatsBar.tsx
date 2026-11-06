import React from 'react';
import { Activity, Download, HardDrive, CheckCircle2 } from 'lucide-react';
import { SystemStats } from '../types';

interface StatsBarProps {
  stats: SystemStats;
  maxConcurrent: number;
}

export const StatsBar: React.FC<StatsBarProps> = ({ stats, maxConcurrent }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xs transition-colors">
      {/* Metric 1: Active Streams */}
      <div className="flex flex-col gap-1 p-2">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span>Active Streams</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {stats.activeDownloads}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400 font-mono">
            / {maxConcurrent} max
          </span>
        </div>
      </div>

      {/* Metric 2: Live Download Speed */}
      <div className="flex flex-col gap-1 p-2 border-l border-neutral-200/60 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <Download className="w-3.5 h-3.5 text-emerald-500" />
          <span>Aggregate Speed</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {stats.activeDownloads > 0 ? stats.totalSpeedFormatted : '0.0 MB/s'}
          </span>
        </div>
      </div>

      {/* Metric 3: Total Downloaded Storage */}
      <div className="flex flex-col gap-1 p-2 border-l border-neutral-200/60 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <HardDrive className="w-3.5 h-3.5 text-purple-500" />
          <span>Total Downloaded</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-xl font-bold font-mono tabular-nums text-neutral-900 dark:text-neutral-100">
            {stats.totalDownloadedFormatted}
          </span>
        </div>
      </div>

      {/* Metric 4: Queue Summary */}
      <div className="flex flex-col gap-1 p-2 border-l border-neutral-200/60 dark:border-neutral-800">
        <div className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <CheckCircle2 className="w-3.5 h-3.5 text-neutral-500" />
          <span>Queue Status</span>
        </div>
        <div className="flex items-baseline gap-2 text-xs text-neutral-600 dark:text-neutral-300">
          <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
            {stats.completedCount}
          </span>
          <span className="text-neutral-500">completed</span>
          <span aria-hidden="true" className="text-neutral-400">·</span>
          <span className="font-mono tabular-nums font-semibold text-neutral-900 dark:text-neutral-100">
            {stats.queuedCount}
          </span>
          <span className="text-neutral-500">queued</span>
        </div>
      </div>
    </div>
  );
};
