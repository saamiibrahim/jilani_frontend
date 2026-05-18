'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { productivityQueryOptions } from '../api/queries';
import type { DashboardFilters } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';

function MetricItem({
  label,
  value,
  suffix,
  previousValue,
  invertTrend = false
}: {
  label: string;
  value: number;
  suffix?: string;
  previousValue: number;
  invertTrend?: boolean;
}) {
  const diff = previousValue > 0 ? ((value - previousValue) / previousValue) * 100 : 0;
  const up = diff >= 0;
  const isPositive = invertTrend ? !up : up;

  return (
    <div className='flex items-center justify-between py-3 first:pt-0 last:pb-0'>
      <span className='text-muted-foreground text-sm'>{label}</span>
      <div className='flex items-center gap-2'>
        <span className='text-sm font-semibold'>
          {value}
          {suffix ?? ''}
        </span>
        <span
          className={cn(
            'flex items-center gap-0.5 text-xs font-medium',
            isPositive ? 'text-green-600' : 'text-red-500'
          )}
        >
          {up ? (
            <Icons.trendingUp className='h-3 w-3' />
          ) : (
            <Icons.trendingDown className='h-3 w-3' />
          )}
          {Math.abs(diff).toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

export function ProductivityMetrics({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(productivityQueryOptions(filters));

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium'>Productivity Metrics</CardTitle>
      </CardHeader>
      <CardContent className='divide-y px-6 py-0 pb-4'>
        <MetricItem
          label={data.meetingsDone.label}
          value={data.meetingsDone.value}
          previousValue={data.meetingsDone.previousValue}
        />
        <MetricItem
          label={data.callAnswerRate.label}
          value={data.callAnswerRate.value}
          suffix='%'
          previousValue={data.callAnswerRate.previousValue}
        />
        <MetricItem
          label={data.avgResponseTime.label}
          value={data.avgResponseTime.value}
          suffix='min'
          previousValue={data.avgResponseTime.previousValue}
          invertTrend // Lower avg response time is better
        />
        <MetricItem
          label={data.overdueTasks.label}
          value={data.overdueTasks.value}
          previousValue={data.overdueTasks.previousValue}
          invertTrend // Fewer overdue tasks is better
        />
      </CardContent>
    </Card>
  );
}
