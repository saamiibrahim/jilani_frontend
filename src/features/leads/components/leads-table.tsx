'use client';

import { useState } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { leadsQueryOptions } from '../api/queries';
import { campaignsQueryOptions } from '@/features/campaigns/api/queries';
import { usersQueryOptions } from '@/features/users/api/queries';
import { useQueryStates } from 'nuqs';
import { leadsSearchParams } from '../api/searchparams';
import type {
  LeadFilters,
  Lead,
  LeadStatus,
  LeadSource,
  CallStatus,
  LeadLabel
} from '../api/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { LeadSheet } from './lead-sheet';
import { AddLeadSheet } from './add-lead-sheet';

// ─── Relative time ────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (diff < 60) return rtf.format(-Math.round(diff), 'second');
  if (diff < 3600) return rtf.format(-Math.round(diff / 60), 'minute');
  if (diff < 86400) return rtf.format(-Math.round(diff / 3600), 'hour');
  return rtf.format(-Math.round(diff / 86400), 'day');
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, { label: string; color: string }> = {
  unprocessed: { label: 'Unprocessed', color: 'bg-slate-100 text-slate-600 border-slate-200' },
  qualified: { label: 'Qualified', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  working_deal: { label: 'Working Deal', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  deal_closed: { label: 'Deal Closed', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  lost_deal: { label: 'Lost Deal', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  future_prospect: { label: 'Future Prospect', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  did_not_respond: { label: 'No Response', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  unqualified: { label: 'Unqualified', color: 'bg-red-50 text-red-600 border-red-100' }
};

const CALL_STATUS_CONFIG: Record<
  CallStatus,
  { label: string; icon: keyof typeof Icons; color: string }
> = {
  answered: { label: 'Answered', icon: 'call', color: 'text-emerald-600' },
  did_not_respond: { label: 'No Answer', icon: 'callOff', color: 'text-amber-500' },
  dead_number: { label: 'Dead No.', icon: 'callOff', color: 'text-red-500' },
  not_called: { label: 'Not Called', icon: 'phone', color: 'text-muted-foreground' }
};

const SOURCE_CONFIG: Record<LeadSource, { label: string; color: string; bg: string }> = {
  facebook: { label: 'Facebook', color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
  tiktok: { label: 'TikTok', color: 'text-slate-700', bg: 'bg-slate-100 border-slate-200' },
  website: { label: 'Website', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  csv: { label: 'CSV', color: 'text-slate-600', bg: 'bg-slate-100 border-slate-200' },
  manual: { label: 'Manual', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' }
};

const LABEL_CONFIG: Record<NonNullable<LeadLabel>, { label: string; color: string; bg: string }> = {
  hot: { label: 'Hot', color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
  warm: { label: 'Warm', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  cold: { label: 'Cold', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
  priority: { label: 'Priority', color: 'text-yellow-700', bg: 'bg-yellow-50 border-yellow-200' },
  follow_up: { label: 'Follow Up', color: 'text-purple-700', bg: 'bg-purple-50 border-purple-200' },
  do_not_contact: { label: 'DNC', color: 'text-slate-500', bg: 'bg-slate-100 border-slate-200' }
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  search: string;
  status: string;
  source: string;
  campaignId: string;
  assignedToId: string;
  onSearch: (v: string) => void;
  onStatus: (v: string) => void;
  onSource: (v: string) => void;
  onCampaignId: (v: string) => void;
  onAssignedToId: (v: string) => void;
  onAddLead: () => void;
  hideCampaignFilter?: boolean;
}

function FilterBar({
  search,
  status,
  source,
  campaignId,
  assignedToId,
  onSearch,
  onStatus,
  onSource,
  onCampaignId,
  onAssignedToId,
  onAddLead,
  hideCampaignFilter
}: FilterBarProps) {
  const { data: campaignsData } = useSuspenseQuery(campaignsQueryOptions({}));
  const { data: usersData } = useSuspenseQuery(usersQueryOptions({}));

  return (
    <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4'>
      <div className='flex flex-1 flex-wrap gap-2'>
        {/* Search */}
        <div className='relative flex-1 min-w-[200px] max-w-xs'>
          <Icons.search className='text-muted-foreground absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2' />
          <Input
            placeholder='Search by name or phone…'
            className='pl-8 h-9 text-sm'
            value={search}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Status filter */}
        <Select value={status} onValueChange={onStatus}>
          <SelectTrigger className='h-9 w-[160px] text-sm'>
            <SelectValue placeholder='All statuses' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Statuses</SelectItem>
            {(Object.entries(STATUS_CONFIG) as [LeadStatus, { label: string }][]).map(([k, v]) => (
              <SelectItem key={k} value={k}>
                {v.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Source filter */}
        <Select value={source} onValueChange={onSource}>
          <SelectTrigger className='h-9 w-[140px] text-sm'>
            <SelectValue placeholder='All sources' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Sources</SelectItem>
            <SelectItem value='facebook'>Facebook</SelectItem>
            <SelectItem value='tiktok'>TikTok</SelectItem>
            <SelectItem value='website'>Website</SelectItem>
            <SelectItem value='csv'>CSV</SelectItem>
            <SelectItem value='manual'>Manual</SelectItem>
          </SelectContent>
        </Select>

        {/* Agent filter */}
        <Select value={assignedToId} onValueChange={onAssignedToId}>
          <SelectTrigger className='h-9 w-[160px] text-sm'>
            <SelectValue placeholder='All agents' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Agents</SelectItem>
            {usersData.users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Campaign filter */}
        {!hideCampaignFilter && (
          <Select value={campaignId} onValueChange={onCampaignId}>
            <SelectTrigger className='h-9 w-[180px] text-sm'>
              <SelectValue placeholder='All campaigns' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Campaigns</SelectItem>
              {campaignsData.campaigns.map((camp) => (
                <SelectItem key={camp.id} value={camp.id}>
                  {camp.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Add Lead */}
      <Button size='sm' onClick={onAddLead} className='flex-shrink-0'>
        <Icons.add className='mr-1.5 h-3.5 w-3.5' />
        Add Lead
      </Button>
    </div>
  );
}

// ─── Lead Row ─────────────────────────────────────────────────────────────────

function LeadRow({ lead, onSelect }: { lead: Lead; onSelect: (lead: Lead) => void }) {
  const status = STATUS_CONFIG[lead.status];
  const callStatus = CALL_STATUS_CONFIG[lead.callStatus];
  const source = SOURCE_CONFIG[lead.source];
  const CallIcon = Icons[callStatus.icon];

  return (
    <TableRow
      className='hover:bg-accent/50 cursor-pointer transition-colors duration-300 group'
      onClick={() => onSelect(lead)}
    >
      <TableCell className='min-w-[200px] py-3 px-4'>
        <div className='flex items-center gap-3'>
          {/* <Avatar className='h-8 w-8 flex-shrink-0'>
            <AvatarFallback className='text-xs font-semibold bg-secondary'>{initials(lead.name)}</AvatarFallback>
          </Avatar> */}
          <div className='min-w-0'>
            <span className='block truncate text-sm font-medium leading-tight'>{lead.name}</span>
            <div className='flex items-center gap-1.5 mt-0.5'>
              {/* <span className={cn(
                'rounded-sm border px-1.5 py-0 text-[10px] font-semibold leading-4',
                source.bg, source.color
              )}>
                {source.label}
              </span> */}
              {lead.label && (
                <span
                  className={cn(
                    'rounded-sm border px-1.5 py-0 text-[10px] font-medium leading-4',
                    LABEL_CONFIG[lead.label].bg,
                    LABEL_CONFIG[lead.label].color
                  )}
                >
                  {LABEL_CONFIG[lead.label].label}
                </span>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      <TableCell className='text-muted-foreground text-sm tabular-nums'>{lead.phone}</TableCell>

      <TableCell>
        <Badge variant='outline' className={cn('border text-xs', status.color)}>
          {status.label}
        </Badge>
      </TableCell>

      <TableCell>
        <div className={cn('flex items-center gap-1.5 text-xs font-medium', callStatus.color)}>
          <CallIcon className='h-3.5 w-3.5' />
          {callStatus.label}
        </div>
      </TableCell>

      <TableCell className='text-muted-foreground max-w-[140px] truncate text-xs'>
        {lead.campaignName}
      </TableCell>

      <TableCell className='text-sm'>{lead.assignedTo}</TableCell>

      <TableCell className='text-muted-foreground text-center text-sm tabular-nums'>
        {lead.callCount}
      </TableCell>

      <TableCell className='text-muted-foreground text-xs whitespace-nowrap'>
        {relativeTime(lead.lastActivityAt)}
      </TableCell>

      <TableCell onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant='ghost' size='icon' className='h-7 w-7'>
              <Icons.ellipsis className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-44'>
            <DropdownMenuItem onClick={() => onSelect(lead)}>
              <Icons.user className='mr-2 h-4 w-4' />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSelect(lead)}>
              <Icons.call className='mr-2 h-4 w-4' />
              Log Call
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Icons.edit className='mr-2 h-4 w-4' />
              Edit Lead
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Icons.userPen className='mr-2 h-4 w-4' />
              Reassign
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ─── Inner table (needs Suspense) ─────────────────────────────────────────────

function LeadsTableInner({
  filters,
  onLeadSelect,
  onPageChange
}: {
  filters: LeadFilters;
  onLeadSelect: (lead: Lead) => void;
  onPageChange: (page: number) => void;
}) {
  const { data } = useSuspenseQuery(leadsQueryOptions(filters));

  if (data.leads.length === 0) {
    return (
      <div className='text-muted-foreground flex flex-col items-center justify-center py-16 text-sm'>
        <Icons.leads className='mb-3 h-10 w-10 opacity-30' />
        <p>No leads found matching the current filters.</p>
      </div>
    );
  }

  return (
    <div className='rounded-lg border border-border/40 shadow-sm bg-card'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='min-w-[180px] px-4'>Name</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Call</TableHead>
            <TableHead>Campaign</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead className='text-center'>Calls</TableHead>
            <TableHead>Last Activity</TableHead>
            <TableHead className='w-10' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.leads.map((lead) => (
            <LeadRow key={lead.id} lead={lead} onSelect={onLeadSelect} />
          ))}
        </TableBody>
      </Table>
      <div className='flex items-center justify-between border-t px-4 py-3'>
        <div className='text-muted-foreground text-xs'>
          Showing {(data.page - 1) * data.limit + 1} to{' '}
          {Math.min(data.page * data.limit, data.total)} of {data.total} lead
          {data.total !== 1 ? 's' : ''}
        </div>
        <div className='flex items-center gap-2'>
          <Button
            variant='outline'
            size='sm'
            className='h-8 text-xs'
            disabled={data.page <= 1}
            onClick={() => onPageChange(data.page - 1)}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='h-8 text-xs'
            disabled={data.page * data.limit >= data.total}
            onClick={() => onPageChange(data.page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Leads Table (exported) ───────────────────────────────────────────────────

interface LeadsTableProps {
  filters: LeadFilters;
  /** Optional: called instead of internal sheet when parent wants to control it */
  onLeadSelect?: (lead: Lead) => void;
  /** Hide filter bar (e.g. already filtered by campaign) */
  hideFilters?: boolean;
}

export function LeadsTable({
  filters: initialFilters,
  onLeadSelect,
  hideFilters = false
}: LeadsTableProps) {
  const [queryStates, setQueryStates] = useQueryStates(leadsSearchParams);

  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  const activeFilters: LeadFilters = {
    ...initialFilters,
    search: queryStates.search || undefined,
    status: (queryStates.status !== 'all' ? queryStates.status : undefined) as
      | LeadStatus
      | undefined,
    source: (queryStates.source !== 'all' ? queryStates.source : undefined) as
      | LeadSource
      | undefined,
    campaignId:
      (queryStates.campaignId !== 'all' ? queryStates.campaignId : undefined) ||
      initialFilters.campaignId,
    assignedToId: queryStates.assignedToId !== 'all' ? queryStates.assignedToId : undefined,
    page: queryStates.page,
    limit: queryStates.limit
  };

  function openLead(lead: Lead) {
    if (onLeadSelect) {
      onLeadSelect(lead);
    } else {
      setSelectedLead(lead);
      setSheetOpen(true);
    }
  }

  return (
    <div>
      {!hideFilters && (
        <FilterBar
          search={queryStates.search}
          status={queryStates.status}
          source={queryStates.source}
          campaignId={queryStates.campaignId}
          assignedToId={queryStates.assignedToId}
          onSearch={(v) => setQueryStates({ search: v, page: 1 })}
          onStatus={(v) => setQueryStates({ status: v, page: 1 })}
          onSource={(v) => setQueryStates({ source: v, page: 1 })}
          onCampaignId={(v) => setQueryStates({ campaignId: v, page: 1 })}
          onAssignedToId={(v) => setQueryStates({ assignedToId: v, page: 1 })}
          onAddLead={() => setAddLeadOpen(true)}
          hideCampaignFilter={!!initialFilters.campaignId}
        />
      )}

      <LeadsTableInner
        filters={activeFilters}
        onLeadSelect={openLead}
        onPageChange={(page) => setQueryStates({ page })}
      />

      {/* Internal sheet (only when no external onLeadSelect) */}
      {!onLeadSelect && (
        <LeadSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} />
      )}

      {/* Add Lead sheet */}
      <AddLeadSheet
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        defaultCampaignId={initialFilters.campaignId}
      />
    </div>
  );
}
