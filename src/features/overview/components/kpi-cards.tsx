'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { pipelineQueryOptions } from '../api/queries';
import type { DashboardFilters, KpiStat } from '../api/types';
import { Icons } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

function formatValue(stat: KpiStat): string {
  const { value, format, prefix, suffix } = stat;
  if (format === 'currency') {
    const formatted =
      value >= 1_000_000
        ? `${(value / 1_000_000).toFixed(1)}M`
        : value >= 1_000
          ? `${(value / 1_000).toFixed(0)}K`
          : `${value}`;
    return `${prefix ?? ''} ${formatted}`.trim();
  }
  return `${value}${suffix ?? ''}`;
}

function getTrend(current: number, previous: number) {
  if (previous === 0) return { pct: 0, up: true };
  const diff = ((current - previous) / previous) * 100;
  return { pct: Math.abs(diff).toFixed(1), up: diff >= 0 };
}

interface KpiCardProps {
  stat: KpiStat;
  invertTrend?: boolean; // For "pending" or "overdue" — lower is better
}

function KpiCard({ stat, invertTrend = false }: KpiCardProps) {
  const trend = getTrend(stat.value, stat.previousValue);
  const isPositive = invertTrend ? !trend.up : trend.up;

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-muted-foreground text-sm font-medium'>{stat.label}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='text-2xl font-bold tracking-tight'>{formatValue(stat)}</div>
        <div
          className={cn(
            'mt-1 flex items-center gap-1 text-xs font-medium',
            isPositive ? 'text-green-600' : 'text-red-500'
          )}
        >
          {trend.up ? (
            <Icons.trendingUp className='h-3.5 w-3.5' />
          ) : (
            <Icons.trendingDown className='h-3.5 w-3.5' />
          )}
          <span>{trend.pct}% vs last week</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function KpiCards({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(pipelineQueryOptions(filters));

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
      {data.kpis.map((stat) => (
        <KpiCard key={stat.label} stat={stat} invertTrend={stat.label === 'Pending'} />
      ))}
    </div>
  );
}
