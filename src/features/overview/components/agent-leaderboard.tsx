'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { pipelineQueryOptions } from '../api/queries';
import type { DashboardFilters } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const RANK_COLORS = ['text-yellow-500', 'text-slate-400', 'text-orange-600'];
const RANK_MEDALS = ['🥇', '🥈', '🥉'];

function formatRevenue(value: number): string {
  if (value >= 1_000_000) return `PKR ${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `PKR ${(value / 1_000).toFixed(0)}K`;
  return `PKR ${value}`;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function AgentLeaderboard({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(pipelineQueryOptions(filters));

  return (
    <Card>
      <CardHeader className='pb-3'>
        <CardTitle className='text-sm font-medium'>Agent Leaderboard</CardTitle>
      </CardHeader>
      <CardContent className='p-0'>
        <div className='divide-y'>
          {data.leaderboard.map((agent) => (
            <div
              key={agent.id}
              className='hover:bg-muted/40 flex items-center gap-3 px-6 py-3 transition-colors'
            >
              {/* Rank */}
              <div
                className={cn(
                  'w-5 text-center text-sm font-bold',
                  agent.rank <= 3 ? RANK_COLORS[agent.rank - 1] : 'text-muted-foreground'
                )}
              >
                {agent.rank <= 3 ? RANK_MEDALS[agent.rank - 1] : agent.rank}
              </div>

              {/* Avatar */}
              <Avatar className='h-8 w-8'>
                <AvatarFallback className='text-xs'>{initials(agent.name)}</AvatarFallback>
              </Avatar>

              {/* Name */}
              <div className='min-w-0 flex-1'>
                <p className='truncate text-sm font-medium'>{agent.name}</p>
                <p className='text-muted-foreground text-xs'>
                  {agent.callsMade} calls · {agent.avgResponseTime} avg
                </p>
              </div>

              {/* Stats */}
              <div className='flex flex-col items-end gap-1'>
                <Badge variant='outline' className='text-xs tabular-nums'>
                  {agent.dealsClosed} closed
                </Badge>
                <span className='text-muted-foreground text-xs tabular-nums'>
                  {formatRevenue(agent.totalRevenue)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
