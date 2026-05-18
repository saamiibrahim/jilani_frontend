'use client';

import { useSuspenseQuery } from '@tanstack/react-query';
import { pipelineQueryOptions, productivityQueryOptions } from '../api/queries';
import type { DashboardFilters, AgentPerformance } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Icons } from '@/components/icons';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  PieChart,
  Pie,
  AreaChart,
  Area,
  Cell
} from 'recharts';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';

// ─── Design tokens ────────────────────────────────────────────────────────────
const COLOR_PRIMARY = 'var(--chart-1)'; // Champagne Gold
const COLOR_SECONDARY = 'var(--chart-2)'; // Dark Slate
const COLOR_TERTIARY = 'var(--chart-3)'; // Deep Bronze

// ─── Helpers ─────────────────────────────────────────────────────────────────

function pct(current: number, previous: number) {
  if (previous === 0) return { label: '0.0%', up: true };
  const diff = ((current - previous) / previous) * 100;
  return {
    label: `${Math.abs(diff).toFixed(1)}%`,
    up: diff >= 0
  };
}

function formatMoney(v: number) {
  if (v >= 1_000_000) return `PKR ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `PKR ${(v / 1_000).toFixed(0)}K`;
  return `PKR ${v}`;
}

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

const KPI_META: Record<
  string,
  {
    sub1: string;
    sub2: string;
    invert?: boolean;
    last?: boolean;
  }
> = {
  'Total Leads': { sub1: 'Leads', sub2: 'Across all campaigns' },
  Contacted: { sub1: 'Leads', sub2: 'Good engagement rate' },
  Pending: { sub1: 'Leads', sub2: 'Priority attention needed', invert: true },
  Closed: { sub1: 'Leads', sub2: 'Meets growth projections' },
  'Total Value': { sub1: 'PKR', sub2: 'Steady performance increase' }
};

// {
//   'Total Leads': { sub1: 'Trending up', sub2: 'Across all campaigns' },
//   'Contacted': { sub1: 'Active calling', sub2: 'Good engagement rate' },
//   'Pending': { sub1: 'Need follow-up', sub2: 'Priority attention needed', invert: true },
//   'Deals Closed': { sub1: 'Revenue milestone', sub2: 'Meets growth projections' },
//   'Total Value': { sub1: 'Monthly projection', sub2: 'Steady performance increase' },
// };

function KpiCard({
  stat
}: {
  stat: { label: string; value: number; previousValue: number; format?: string };
}) {
  const trend = pct(stat.value, stat.previousValue);
  const meta = KPI_META[stat.label] ?? { sub1: 'Trending', sub2: 'Last 30 days' };

  const invertTrend = meta.invert ?? false;
  const isGood = invertTrend ? !trend.up : trend.up;

  let displayValue: string;
  if (stat.format === 'currency' && stat.value >= 1_000_000) {
    displayValue = `${(stat.value / 1_000_000).toFixed(1)}M`;
  } else if (stat.format === 'currency') {
    displayValue = `${(stat.value / 1_000).toFixed(0)}K`;
  } else {
    displayValue = stat.value.toLocaleString();
  }

  const TrendIcon = trend.up ? Icons.trendingUp : Icons.trendingDown;
  const lastCards = meta.last ?? 'col-span-2';
  return (
    <Card className='group py-0 gap-0 shadow-sm border border-border/40 bg-card hover:shadow-md hover:border-ring/30 transition-all duration-500 ease-out'>
      <CardHeader className='flex flex-row items-center justify-between py-4 px-4 space-y-0'>
        <CardTitle className='text-xs font-bold tracking-wide text-muted-foreground uppercase'>
          {stat.label}
        </CardTitle>
        <div
          className={cn(
            'flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-sm transition-transform duration-500 ease-out group-hover:-translate-y-0.5',
            isGood ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          <TrendIcon className='h-3 w-3' />
          <span>
            {trend.up ? '+' : '-'}
            {trend.label}
          </span>
        </div>
      </CardHeader>
      <CardContent className='py-4 px-4'>
        <div className='text-3xl font-medium tracking-tight mb-0.5 text-foreground font-heading'>
          {displayValue}
        </div>
        <p className='text-[12px] text-muted-foreground leading-relaxed'>
          <span className={cn('font-medium', isGood ? 'text-primary' : 'text-foreground')}>
            {meta.sub1}
          </span>
          {/* {' · '}{meta.sub2} */}
        </p>
      </CardContent>
    </Card>
  );
}

// ─── SVG Gradients ─────────────────────────────────────────────────────────────

function ChartGradients() {
  return (
    <div className='absolute w-0 h-0 pointer-events-none overflow-hidden'>
      <svg>
        <defs>
          <linearGradient id='gradient-primary' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor={COLOR_PRIMARY} stopOpacity={0.15} />
            <stop offset='100%' stopColor={COLOR_PRIMARY} stopOpacity={0} />
          </linearGradient>
          <linearGradient id='gradient-secondary' x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor={COLOR_SECONDARY} stopOpacity={0.1} />
            <stop offset='100%' stopColor={COLOR_SECONDARY} stopOpacity={0} />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

const MONTHLY_PIPELINE = [
  { month: 'Jan', new: 18, closed: 4 },
  { month: 'Feb', new: 32, closed: 8 },
  { month: 'Mar', new: 27, closed: 6 },
  { month: 'Apr', new: 38, closed: 9 },
  { month: 'May', new: 22, closed: 5 },
  { month: 'Jun', new: 41, closed: 12 },
  { month: 'Jul', new: 35, closed: 10 }
];

function DashboardBarChart() {
  return (
    <Card className='py-0 gap-0 shadow-sm border border-border/40 bg-card h-full flex flex-col hover:shadow-md transition-shadow duration-500'>
      <CardHeader className='py-4 px-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1.5'>
            <CardTitle className='text-xl font-heading font-semibold text-foreground tracking-tight'>
              Lead Pipeline
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              New leads vs closed deals · Jan – Jul 2025
            </CardDescription>
          </div>
          <Badge
            variant='outline'
            className='rounded-sm font-bold text-xs px-2.5 py-1 gap-1.5 bg-primary/5 text-primary border-primary/20'
          >
            <Icons.trendingUp className='h-3.5 w-3.5' />
            +18.4%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='py-4 px-4 flex-1'>
        <ResponsiveContainer width='100%' height={300}>
          <BarChart data={MONTHLY_PIPELINE} margin={{ top: 10, right: 10, left: -20, bottom: 10 }}>
            <CartesianGrid
              vertical={false}
              stroke='var(--border)'
              strokeDasharray='4 4'
              opacity={0.3}
            />
            <XAxis
              dataKey='month'
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={15}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dx={-15}
            />
            <Tooltip
              cursor={{ fill: 'var(--muted)', opacity: 0.4 }}
              contentStyle={{
                fontSize: 13,
                borderRadius: '6px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'var(--card)',
                padding: '12px'
              }}
            />
            <Bar
              dataKey='new'
              name='New Leads'
              fill={COLOR_PRIMARY}
              radius={[2, 2, 0, 0]}
              maxBarSize={28}
            />
            <Bar
              dataKey='closed'
              name='Deals Closed'
              fill={COLOR_SECONDARY}
              radius={[2, 2, 0, 0]}
              maxBarSize={28}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Area Chart ───────────────────────────────────────────────────────────────

const AREA_DATA = [
  { month: 'Jan', contacted: 45, qualified: 12 },
  { month: 'Feb', contacted: 62, qualified: 18 },
  { month: 'Mar', contacted: 55, qualified: 15 },
  { month: 'Apr', contacted: 78, qualified: 22 },
  { month: 'May', contacted: 70, qualified: 20 },
  { month: 'Jun', contacted: 89, qualified: 28 },
  { month: 'Jul', contacted: 83, qualified: 25 }
];

function DashboardAreaChart() {
  return (
    <Card className='py-0 gap-0 shadow-sm border border-border/40 bg-card h-full flex flex-col hover:shadow-md transition-shadow duration-500'>
      <CardHeader className='py-4 px-4'>
        <div className='flex items-center justify-between'>
          <div className='space-y-1.5'>
            <CardTitle className='text-xl font-heading font-semibold text-foreground tracking-tight'>
              Contact Trend
            </CardTitle>
            <CardDescription className='text-sm text-muted-foreground'>
              Leads contacted & qualified for the last 6 months
            </CardDescription>
          </div>
          <Badge
            variant='outline'
            className='rounded-sm font-bold text-xs px-2.5 py-1 gap-1.5 bg-primary/5 text-primary border-primary/20'
          >
            <Icons.trendingUp className='h-3.5 w-3.5' />
            +23.6%
          </Badge>
        </div>
      </CardHeader>
      <CardContent className='py-4 px-4 flex-1'>
        <ResponsiveContainer width='100%' height={300}>
          <AreaChart data={AREA_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid
              vertical={false}
              stroke='var(--border)'
              strokeDasharray='4 4'
              opacity={0.3}
            />
            <XAxis
              dataKey='month'
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dy={15}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--muted-foreground)', fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              dx={-15}
            />
            <Tooltip
              contentStyle={{
                fontSize: 13,
                borderRadius: '6px',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-lg)',
                backgroundColor: 'var(--card)',
                padding: '12px'
              }}
            />
            <Area
              type='monotone'
              dataKey='contacted'
              name='Contacted'
              stroke={COLOR_PRIMARY}
              strokeWidth={2}
              fillOpacity={1}
              fill='url(#gradient-primary)'
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
            <Area
              type='monotone'
              dataKey='qualified'
              name='Qualified'
              stroke={COLOR_SECONDARY}
              strokeWidth={2}
              fillOpacity={1}
              fill='url(#gradient-secondary)'
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// ─── Lead Sources & Status ──────────────────────────────────────────────────────
const CHART_PALETTE = [
  '#C5A059', // Champagne Gold
  '#1f2937', // Dark Slate
  '#8C6C36', // Deep Bronze
  '#475569', // Slate 600
  '#d97706', // Amber 600
  '#334155', // Slate 700
  '#94a3b8', // Slate 400
  '#0f172a' // Slate 900
];

function LeadSourcesCard({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(pipelineQueryOptions(filters));
  const sources = data.leadSources;

  const maxCount = Math.max(...sources.map((s) => s.count), 1);

  return (
    <Card className='py-0 gap-0 shadow-sm border border-border/40 bg-card h-full flex flex-col hover:shadow-md transition-shadow duration-500'>
      <CardHeader className='py-4 px-4'>
        <div className='space-y-1.5'>
          <CardTitle className='text-xl font-heading font-semibold text-foreground tracking-tight'>
            Lead sources
          </CardTitle>
          <CardDescription className='text-sm text-muted-foreground'>
            Distribution of incoming lead channels
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='py-4 px-4 flex-1 space-y-4 flex flex-col justify-center'>
        {sources.map((source, idx) => {
          const width = `${(source.count / maxCount) * 100}%`;
          let Icon = Icons.globe;
          let barColor = 'var(--primary)'; // Default Deep Bronze

          if (source.icon === 'facebook') {
            Icon = Icons.facebook;
            barColor = '#1877F2'; // Facebook Blue
          } else if (source.icon === 'tiktok') {
            Icon = Icons.tiktok;
            barColor = '#000000'; // TikTok Black
          } else if (source.icon === 'csv') {
            Icon = Icons.csv;
            barColor = '#10B981'; // Emerald Green
          } else if (source.source.toLowerCase().includes('website')) {
            barColor = '#F59E0B'; // Amber/Orange
          }

          return (
            <div key={source.source}>
              <div className='flex justify-between text-sm mb-1.5'>
                <span className='flex items-center gap-2 text-muted-foreground font-medium'>
                  <Icon className='w-4 h-4' />
                  {source.source}
                </span>
                <span className='font-semibold tabular-nums text-foreground'>{source.count}</span>
              </div>
              <div className='bg-muted h-2 w-full overflow-hidden rounded-full'>
                <div
                  className='h-full rounded-full transition-all duration-500 ease-out'
                  style={{ width, backgroundColor: barColor }}
                />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Unprocessed: '#94a3b8', // Slate 400
  Qualified: '#3b82f6', // Blue 500
  'Working Deal': '#8b5cf6', // Violet 500
  'Deal Closed': '#10b981', // Emerald 500
  'Lost Deal': '#ef4444', // Red 500
  'Future Prospect': '#0ea5e9', // Sky 500
  'Did Not Respond': '#f59e0b', // Amber 500
  Unqualified: '#64748b' // Slate 500
};

function StatusDonutCard({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(pipelineQueryOptions(filters));
  const statuses = data.statusBreakdown;
  const total = statuses.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card className='py-0 gap-0 shadow-sm border border-border/40 bg-card h-full flex flex-col hover:shadow-md transition-shadow duration-500'>
      <CardHeader className='py-4 px-4'>
        <div className='space-y-1.5'>
          <CardTitle className='text-xl font-heading font-semibold text-foreground tracking-tight'>
            Pipeline Status
          </CardTitle>
          <CardDescription className='text-sm text-muted-foreground'>
            Current state of all active leads
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='py-4 px-4 flex-1 flex items-center'>
        <div className='grid grid-cols-1 md:grid-cols-5 w-full gap-2 items-center'>
          {/* Legend Section */}
          <div className='md:col-span-3 grid grid-cols-2 gap-y-3 gap-x-2'>
            {statuses.slice(0, 8).map((s, i) => {
              const pct = total === 0 ? 0 : ((s.count / total) * 100).toFixed(1);
              const color = STATUS_COLORS[s.status] || CHART_PALETTE[i % CHART_PALETTE.length];
              return (
                <div key={s.status} className='flex items-start gap-2 group'>
                  <div
                    className='w-2 h-2 rounded-full mt-1.5 flex-shrink-0 transition-transform duration-300 group-hover:scale-150'
                    style={{ backgroundColor: color }}
                  />
                  <div className='flex flex-col'>
                    <span className='text-[12px] text-muted-foreground transition-colors group-hover:text-foreground line-clamp-1'>
                      {s.status} - {s.count}
                    </span>
                    <span className='text-[11px] text-muted-foreground'>({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Donut Section */}
          <div className='md:col-span-2 flex justify-center relative h-[220px]'>
            <ResponsiveContainer width='100%' height='100%'>
              <PieChart>
                <Pie
                  data={statuses}
                  cx='50%'
                  cy='50%'
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey='count'
                  stroke='none'
                  cornerRadius={2}
                >
                  {statuses.map((e, i) => (
                    <Cell
                      key={e.status}
                      fill={STATUS_COLORS[e.status] || CHART_PALETTE[i % CHART_PALETTE.length]}
                      style={{ transition: 'all 0.3s ease' }}
                      className='hover:opacity-80 cursor-pointer'
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    fontSize: 13,
                    borderRadius: '6px',
                    border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-lg)',
                    backgroundColor: 'var(--card)'
                  }}
                  itemStyle={{ fontWeight: 600 }}
                />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Text */}
            <div className='absolute inset-0 flex flex-col items-center justify-center pointer-events-none'>
              <span className='text-2xl font-bold text-foreground'>{total}</span>
              <span className='text-[11px] text-muted-foreground'>Contacted Leads</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Recent Deals ─────────────────────────────────────────────────────────────

const RECENT_DEALS = [
  { name: 'Nadia Farooq', email: 'nadia.farooq@gmail.com', amount: 4500000, up: true },
  { name: 'Sana Rashid', email: 'sana@example.com', amount: 2800000, up: true },
  { name: 'Asim Mehmood', email: 'asim@email.com', amount: 3200000, up: true },
  { name: 'Kamran Iqbal', email: 'kamran@outlook.com', amount: 1900000, up: true },
  { name: 'Tariq Hassan', email: 'tariq.h@gmail.com', amount: 2100000, up: false }
];

function RecentDeals() {
  return (
    <Card className='flex flex-col h-full py-0 gap-0 shadow-sm border border-border/40 bg-card hover:shadow-md transition-shadow duration-500'>
      <CardHeader className='py-4 px-4'>
        <div className='space-y-1.5'>
          <CardTitle className='text-xl font-heading font-semibold text-foreground tracking-tight'>
            Recent Deals
          </CardTitle>
          <CardDescription className='text-sm text-muted-foreground'>
            You made {RECENT_DEALS.length} sales this month.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className='py-4 px-4 flex-1'>
        <div className='space-y-4'>
          {RECENT_DEALS.map((d) => (
            <div
              key={d.name}
              className='flex items-center gap-4 group p-2 -mx-2 rounded-lg hover:bg-muted/40 transition-colors duration-300'
            >
              <Avatar className='h-11 w-11 flex-shrink-0 ring-1 ring-border/50 group-hover:ring-primary/40 transition-all duration-300 group-hover:scale-105'>
                <AvatarFallback className='text-[13px] font-bold bg-primary/5 text-primary'>
                  {initials(d.name)}
                </AvatarFallback>
              </Avatar>
              <div className='min-w-0 flex-1 space-y-0.5'>
                <p className='text-[14px] font-semibold leading-none text-foreground'>{d.name}</p>
                <p className='text-[13px] text-muted-foreground truncate'>{d.email}</p>
              </div>
              <div
                className={cn(
                  'text-[14px] font-bold transition-transform duration-300 group-hover:translate-x-1',
                  d.up ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {d.up ? '+' : ''}
                {formatMoney(d.amount)}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Agent Performance ──────────────────────────────────────────────────────

function TopAgentsCards({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(pipelineQueryOptions(filters));
  const agents = data.topAgents;

  return (
    <div className='grid gap-4 md:grid-cols-3'>
      {agents.map((agent) => (
        <Card
          key={agent.id}
          className='py-0 gap-0 shadow-sm border border-border/40 bg-card h-full flex flex-col hover:shadow-md transition-shadow duration-500'
        >
          <CardHeader className='py-4 px-4 pb-2'>
            <div className='flex items-center gap-3'>
              <Avatar className='h-10 w-10 border border-border/50'>
                <AvatarFallback className='bg-primary/10 text-primary font-bold text-sm'>
                  {initials(agent.name)}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className='text-base font-heading font-semibold text-foreground tracking-tight'>
                  {agent.name}
                </CardTitle>
                <CardDescription className='text-xs text-muted-foreground'>
                  Rank #{agent.rank}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className='py-4 px-4 pt-2 flex-1'>
            <div className='grid grid-cols-3 gap-2 mt-2'>
              <div className='flex flex-col items-center p-2 bg-muted/30 rounded-md'>
                <span className='text-[11px] text-muted-foreground mb-1 text-center leading-tight'>
                  Contacted
                </span>
                <span className='text-lg font-bold text-foreground'>{agent.leadsContacted}</span>
              </div>
              <div className='flex flex-col items-center p-2 bg-muted/30 rounded-md'>
                <span className='text-[11px] text-muted-foreground mb-1 text-center leading-tight'>
                  Qualified
                </span>
                <span className='text-lg font-bold text-foreground'>{agent.qualified}</span>
              </div>
              <div className='flex flex-col items-center p-2 bg-muted/30 rounded-md border border-primary/20 bg-primary/5'>
                <span className='text-[11px] text-primary/80 font-medium mb-1 text-center leading-tight'>
                  Closed
                </span>
                <span className='text-lg font-bold text-primary'>{agent.dealsClosed}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function AgentLeaderboard({ filters }: { filters: DashboardFilters }) {
  const { data } = useSuspenseQuery(pipelineQueryOptions(filters));
  const leaderboard = data.leaderboard;

  return (
    <Card className='py-0 shadow-sm border border-border/40 bg-card overflow-hidden'>
      <CardHeader className='py-4 px-4'>
        <CardTitle className='text-xl font-heading font-semibold text-foreground tracking-tight'>
          Agent Leaderboard
        </CardTitle>
        <CardDescription className='text-sm text-muted-foreground'>
          Performance breakdown across all pipeline stages
        </CardDescription>
      </CardHeader>
      <Table className='min-w-[1000px] w-full'>
        <TableHeader className='bg-muted/50'>
          <TableRow className='hover:bg-transparent border-border/50'>
            <TableHead className='w-[180px] text-[11px] uppercase tracking-wider font-semibold'>
              Agent
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right'>
              Total
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right'>
              Contacted
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right'>
              Pending
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right'>
              Qualified
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right'>
              Working
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right text-primary'>
              Closed
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right text-sky-600 dark:text-sky-400'>
              Future
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right text-red-600 dark:text-red-400'>
              Lost
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right text-amber-600 dark:text-amber-400'>
              No Resp
            </TableHead>
            <TableHead className='text-[11px] uppercase tracking-wider font-semibold text-right text-slate-500'>
              Unqual
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leaderboard.map((agent) => (
            <TableRow
              key={agent.id}
              className='hover:bg-muted/30 transition-colors border-border/40'
            >
              <TableCell className='font-medium'>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-7 w-7'>
                    <AvatarFallback className='text-[10px] bg-primary/10 text-primary font-bold'>
                      {initials(agent.name)}
                    </AvatarFallback>
                  </Avatar>
                  <span className='text-[13px] whitespace-nowrap'>{agent.name}</span>
                </div>
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums font-medium'>
                {agent.totalLeads}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums'>
                {agent.leadsContacted}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums text-muted-foreground'>
                {agent.leadsPending}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums'>
                {agent.qualified}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums'>
                {agent.workingDeals}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums font-bold text-primary bg-primary/5'>
                {agent.dealsClosed}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums text-sky-600 dark:text-sky-400'>
                {agent.futureProspects}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums text-red-600 dark:text-red-400'>
                {agent.lostDeals}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums text-amber-600 dark:text-amber-400'>
                {agent.didNotRespond}
              </TableCell>
              <TableCell className='text-right text-[13px] tabular-nums text-slate-500'>
                {agent.unqualified}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function DashboardOverview({ filters }: { filters: DashboardFilters }) {
  const { data: pipeline } = useSuspenseQuery(pipelineQueryOptions(filters));
  const { data: productivity } = useSuspenseQuery(productivityQueryOptions(filters));
  void productivity;

  return (
    <div className='space-y-4 pb-6 pt-2 max-w-[1600px] mx-auto animate-in fade-in duration-700 slide-in-from-bottom-4'>
      <ChartGradients />

      {/* KPI Cards — 5 across on large screens */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
        {pipeline.kpis.slice(0, 5).map((stat, i) => (
          <div
            key={stat.label}
            style={{ animationDelay: `${i * 100}ms` }}
            className='animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700'
          >
            <KpiCard stat={stat} />
          </div>
        ))}
      </div>

      {/* Row 2: Lead Sources + Status (1/1 Split) */}
      <div className='grid gap-4 lg:grid-cols-2'>
        <div className='animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-200'>
          <LeadSourcesCard filters={filters} />
        </div>
        <div className='animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-300'>
          <StatusDonutCard filters={filters} />
        </div>
      </div>

      {/* Row 3: Bar Chart (full width) */}
      <div className='grid gap-4 lg:grid-cols-1'>
        <div className='animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-400'>
          <DashboardBarChart />
        </div>
      </div>

      {/* Row 4: Area Chart + Recent Deals (2/1 Split) */}
      {/* <div className='grid gap-4 lg:grid-cols-3'>
        <div className='lg:col-span-2 animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-500'>
          <DashboardAreaChart />
        </div>
        <div className='lg:col-span-1 animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-600'>
          <RecentDeals />
        </div>
      </div> */}

      {/* Row 5: Top Agents */}
      <div className='animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-700'>
        <TopAgentsCards filters={filters} />
      </div>

      {/* Row 6: Leaderboard */}
      <div className='animate-in fade-in slide-in-from-bottom-4 fill-mode-both duration-700 delay-700'>
        <AgentLeaderboard filters={filters} />
      </div>
    </div>
  );
}
