'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { pipelineQueryOptions } from '../api/queries';
import type { DashboardFilters } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function LeadSourceChart({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(pipelineQueryOptions(filters));

  const chartData = data.leadSources.map((s) => ({
    name: s.source,
    value: s.count,
    color: s.color
  }));

  const total = chartData.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className='flex flex-col'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-sm font-medium'>Lead Sources</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-1 items-center pb-4'>
        <div className='relative w-full'>
          <ResponsiveContainer width='100%' height={240}>
            <PieChart>
              <Pie
                data={chartData}
                cx='50%'
                cy='50%'
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey='value'
              >
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} stroke='transparent' />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value} (${((value / total) * 100).toFixed(0)}%)`,
                  'Leads'
                ]}
              />
              <Legend iconType='circle' iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-2xl font-bold'>{total}</span>
            <span className='text-muted-foreground text-xs'>Total</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
