'use client';

import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignsQueryOptions, campaignKeys } from '../api/queries';
import { updateCampaignStatus } from '../api/service';
import type { CampaignFilters, Campaign, CampaignSource } from '../api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';
import { FieldSeparator } from '@/components/ui/field';

// ─── Source Config ────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<
  CampaignSource,
  { label: string; color: string; icon: keyof typeof Icons }
> = {
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'facebook' },
  tiktok: { label: 'TikTok', color: '#000000', icon: 'tiktok' },
  website: { label: 'Website', color: '#10B981', icon: 'globe' },
  csv: { label: 'CSV Upload', color: '#6B7280', icon: 'csv' },
  manual: { label: 'Manual Entry', color: '#8B5CF6', icon: 'edit' }
};

const STATUS_BADGE: Record<Campaign['status'], string> = {
  active: 'bg-green-100 text-green-700 border-green-200',
  paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  completed: 'bg-blue-100 text-blue-700 border-blue-200',
  draft: 'bg-gray-100 text-gray-600 border-gray-200'
};

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className='flex items-center gap-2'>
      <div className='bg-muted h-1.5 flex-1 overflow-hidden rounded-full'>
        <div
          className='h-full rounded-full transition-all duration-500'
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className='text-muted-foreground w-8 text-right text-xs tabular-nums'>{pct}%</span>
    </div>
  );
}

// ─── Campaign Card ────────────────────────────────────────────────────────────

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const queryClient = useQueryClient();
  const srcConfig = SOURCE_CONFIG[campaign.source];
  const Icon = Icons[srcConfig.icon];

  const pauseMutation = useMutation({
    mutationFn: () =>
      updateCampaignStatus(campaign.id, campaign.status === 'paused' ? 'active' : 'paused'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success(campaign.status === 'paused' ? 'Campaign resumed' : 'Campaign paused');
    }
  });

  return (
    <div className='bg-card shadow-sm border border-border/40 hover:shadow-md hover:border-ring/30 group flex flex-col gap-4 rounded-lg p-4 transition-all duration-500 ease-out'>
      {/* Header */}
      <div className='flex items-start justify-between gap-2'>
        <div className='flex items-center gap-2.5 min-w-0'>
          {/* <div
            className='flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-white'
            style={{ backgroundColor: srcConfig.color }}
          >
            <Icon className='h-4 w-4' />
          </div> */}
          <div className='min-w-0'>
            <Link
              href={`/dashboard/campaigns/${campaign.id}`}
              className='hover:text-primary line-clamp-1 font-semibold transition-colors'
            >
              {campaign.name}
            </Link>
            {/* <p className='text-muted-foreground text-[11px] uppercase tracking-wider font-semibold'>{srcConfig.label}</p> */}
          </div>
        </div>
        <Badge
          variant='outline'
          className={cn('flex-shrink-0 border text-xs capitalize', STATUS_BADGE[campaign.status])}
        >
          {campaign.status}
        </Badge>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-4 gap-2 text-center'>
        {[
          { label: 'Total', value: campaign.totalLeads },
          { label: 'Contacted', value: campaign.contacted },
          { label: 'Qualified', value: campaign.qualified },
          { label: 'Closed', value: campaign.dealsClosed }
        ].map((s) => (
          <div key={s.label}>
            <p className='text-lg font-bold tabular-nums'>{s.value}</p>
            <p className='text-muted-foreground text-xs'>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Progress bars */}
      <div className='space-y-1.5'>
        <div className='flex items-center justify-between text-xs'>
          <span className='text-muted-foreground'>Contacted</span>
        </div>
        <ProgressBar value={campaign.contacted} max={campaign.totalLeads} color='var(--chart-1)' />
        <ProgressBar
          value={campaign.dealsClosed}
          max={campaign.totalLeads}
          color='var(--chart-3)'
        />
      </div>

      {/* Actions */}
      <div className='flex items-center gap-2 pt-1'>
        <Button variant='outline' size='sm' className='flex-1 text-xs' asChild>
          <Link href={`/dashboard/leads?campaignId=${campaign.id}`}>
            <Icons.leads className='mr-1.5 h-3.5 w-3.5' />
            View Leads
          </Link>
        </Button>
        {campaign.status !== 'completed' && (
          <Button
            variant='ghost'
            size='sm'
            className='text-xs'
            onClick={() => pauseMutation.mutate()}
            disabled={pauseMutation.isPending}
          >
            {campaign.status === 'paused' ? (
              <Icons.trendingUp className='h-3.5 w-3.5' />
            ) : (
              <Icons.clock className='h-3.5 w-3.5' />
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Campaigns List ───────────────────────────────────────────────────────────

export function CampaignsList({ filters }: { filters: CampaignFilters }) {
  const { data } = useSuspenseQuery(campaignsQueryOptions(filters));

  if (data.campaigns.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center py-16 text-sm'>
        <Icons.campaign className='mb-3 h-10 w-10 opacity-30' />
        <p>No campaigns found.</p>
        <p className='text-xs mt-1'>Create your first campaign to start tracking leads.</p>
      </div>
    );
  }

  return (
    <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
      {data.campaigns.map((campaign) => (
        <CampaignCard key={campaign.id} campaign={campaign} />
      ))}
    </div>
  );
}
