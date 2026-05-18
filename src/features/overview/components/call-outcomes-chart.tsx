'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { productivityQueryOptions } from '../api/queries';
import type { DashboardFilters } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export function CallOutcomesChart({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(productivityQueryOptions(filters));

  const total = data.callOutcomes.reduce((sum, c) => sum + c.count, 0);

  return (
    <Card className='flex flex-col'>
      <CardHeader className='pb-0'>
        <CardTitle className='text-sm font-medium'>Call Outcomes</CardTitle>
      </CardHeader>
      <CardContent className='flex flex-1 items-center pb-4'>
        <div className='relative w-full'>
          <ResponsiveContainer width='100%' height={220}>
            <PieChart>
              <Pie
                data={data.callOutcomes}
                cx='50%'
                cy='50%'
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
                dataKey='count'
                nameKey='outcome'
              >
                {data.callOutcomes.map((entry) => (
                  <Cell key={entry.outcome} fill={entry.color} stroke='transparent' />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  `${value} (${((value / total) * 100).toFixed(0)}%)`,
                  'Calls'
                ]}
              />
              <Legend iconType='circle' iconSize={8} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className='pointer-events-none absolute inset-0 flex flex-col items-center justify-center'>
            <span className='text-2xl font-bold'>{total}</span>
            <span className='text-muted-foreground text-xs'>Calls</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
