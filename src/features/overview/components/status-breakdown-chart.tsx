'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { pipelineQueryOptions } from '../api/queries';
import type { DashboardFilters } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export function StatusBreakdownChart({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(pipelineQueryOptions(filters));

  return (
    <Card>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm font-medium'>Pipeline by Status</CardTitle>
      </CardHeader>
      <CardContent className='pt-0'>
        <ResponsiveContainer width='100%' height={240}>
          <BarChart
            data={data.statusBreakdown}
            layout='vertical'
            margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
          >
            <XAxis type='number' tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type='category'
              dataKey='status'
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={110}
            />
            <Tooltip
              formatter={(value: number) => [value, 'Leads']}
              cursor={{ fill: 'transparent' }}
            />
            <Bar dataKey='count' radius={[0, 4, 4, 0]} maxBarSize={18}>
              {data.statusBreakdown.map((entry) => (
                <Cell key={entry.status} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
