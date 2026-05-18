'use client';

import { useSuspenseQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { campaignDetailQueryOptions, campaignKeys } from '../api/queries';
import {
  updateCampaignStatus,
  toggleAgentActive,
  removeAgentFromCampaign,
  addAgentToCampaign
} from '../api/service';
import { Campaign, CampaignAgent } from '../api/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { LeadSheet } from '@/features/leads/components/lead-sheet';
import { LeadsTable } from '@/features/leads/components/leads-table';
import type { Lead } from '@/features/leads/api/types';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { usersQueryOptions } from '@/features/users/api/queries';
import type { User } from '@/features/users/api/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; color: string; icon: keyof typeof Icons }> = {
  facebook: { label: 'Facebook', color: '#1877F2', icon: 'facebook' },
  tiktok: { label: 'TikTok', color: '#010101', icon: 'tiktok' },
  website: { label: 'Website', color: '#10B981', icon: 'globe' },
  csv: { label: 'CSV Import', color: '#6B7280', icon: 'csv' },
  manual: { label: 'Manual Entry', color: '#8B5CF6', icon: 'edit' }
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-100 text-green-700 border-green-200' },
  paused: { label: 'Paused', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600 border-gray-200' }
};

const LEAD_STATUS_CONFIG = [
  { key: 'qualified' as const, label: 'Qualified', color: '#22C55E' },
  { key: 'workingDeal' as const, label: 'Working deal', color: '#3B82F6' },
  { key: 'dealClosed' as const, label: 'Deal closed', color: '#0EA5E9' },
  { key: 'lostDeal' as const, label: 'Lost deal', color: '#6B7280' },
  { key: 'futureProspect' as const, label: 'Future prospect', color: '#06B6D4' },
  { key: 'didNotRespond' as const, label: 'Did not respond', color: '#F59E0B' },
  { key: 'unqualified' as const, label: 'Unqualified', color: '#EF4444' }
] as const;

function initials(name: string) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function relativeDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-PK', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// ─── Add Agent Dialog ─────────────────────────────────────────────────────────

function AddAgentDialog({
  open,
  onOpenChange,
  campaignId,
  existingAgentIds
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaignId: string;
  existingAgentIds: string[];
}) {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();

  // Load all users from the system
  const { data: usersData, isLoading } = useQuery({
    ...usersQueryOptions({ limit: 100 }),
    enabled: open
  });

  const users: User[] = usersData?.users ?? [];

  // Filter by search, exclude already-added agents
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter((u) => {
      const fullName = `${u.first_name} ${u.last_name}`.toLowerCase();
      const alreadyAdded = existingAgentIds.includes(String(u.id));
      return !alreadyAdded && (!q || fullName.includes(q) || u.email.toLowerCase().includes(q));
    });
  }, [users, search, existingAgentIds]);

  const addMutation = useMutation({
    mutationFn: async () => {
      const toAdd = users.filter((u) => selected.has(u.id));
      for (const u of toAdd) {
        const agent: CampaignAgent = {
          id: String(u.id),
          name: `${u.first_name} ${u.last_name}`,
          email: u.email,
          active: u.status === 'Active',
          leadsAssigned: 0,
          leadsContacted: 0
        };
        await addAgentToCampaign(campaignId, agent);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      toast.success(
        selected.size === 1
          ? '1 agent added to campaign'
          : `${selected.size} agents added to campaign`
      );
      setSelected(new Set());
      setSearch('');
      onOpenChange(false);
    }
  });

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleClose() {
    setSelected(new Set());
    setSearch('');
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-md p-0 gap-0 overflow-hidden'>
        <DialogHeader className='px-5 pt-5 pb-4 border-b border-border/40'>
          <DialogTitle className='text-base font-semibold'>Add agent(s) to campaign</DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className='px-4 pt-4 pb-2'>
          <div className='relative'>
            <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search by name or email...'
              className='pl-9 h-9 border-border/50 focus-visible:ring-primary/20 shadow-sm'
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* User list */}
        <div className='max-h-[320px] overflow-y-auto px-2 py-1'>
          {isLoading ? (
            <div className='flex flex-col items-center justify-center py-12 text-muted-foreground text-sm'>
              <Icons.spinner className='mb-3 h-5 w-5 animate-spin' />
              Loading agents...
            </div>
          ) : filtered.length === 0 ? (
            <div className='flex flex-col items-center justify-center py-12 text-center text-muted-foreground text-sm'>
              <Icons.user className='mb-3 h-8 w-8 opacity-20' />
              {search
                ? 'No agents found matching your search.'
                : 'All agents are already in this campaign.'}
            </div>
          ) : (
            filtered.map((user) => {
              const fullName = `${user.first_name} ${user.last_name}`;
              const isChecked = selected.has(user.id);
              return (
                <div
                  key={user.id}
                  onClick={() => toggle(user.id)}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                    isChecked ? 'bg-primary/5' : 'hover:bg-muted/50'
                  )}
                >
                  {/* Checkbox */}
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => toggle(user.id)}
                    onClick={(e) => e.stopPropagation()}
                    className='flex-shrink-0'
                  />

                  {/* Avatar */}
                  <Avatar className='h-8 w-8 flex-shrink-0 border border-border/50'>
                    <AvatarFallback className='bg-primary/5 text-primary text-xs font-semibold'>
                      {initials(fullName)}
                    </AvatarFallback>
                  </Avatar>

                  {/* Info */}
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2'>
                      <span className='text-sm font-medium truncate'>{fullName}</span>
                      {user.status === 'Active' && (
                        <span className='flex items-center gap-1 text-[10px] font-semibold text-green-600'>
                          <span className='inline-block h-1.5 w-1.5 rounded-full bg-green-500' />
                          Active
                        </span>
                      )}
                    </div>
                    <p className='text-xs text-muted-foreground truncate'>{user.email}</p>
                  </div>

                  {/* Role */}
                  <span className='text-xs text-muted-foreground flex-shrink-0'>{user.role}</span>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        <div className='flex items-center justify-between gap-3 px-5 py-4 border-t border-border/40 bg-muted/10'>
          <span className='text-xs text-muted-foreground'>
            {selected.size > 0 ? `${selected.size} selected` : 'Select agents to add'}
          </span>
          <div className='flex gap-2'>
            <Button variant='outline' size='sm' className='h-8' onClick={handleClose}>
              Cancel
            </Button>
            <Button
              size='sm'
              className='h-8 bg-primary text-primary-foreground font-semibold min-w-[60px]'
              disabled={selected.size === 0 || addMutation.isPending}
              onClick={() => addMutation.mutate()}
            >
              {addMutation.isPending ? (
                <Icons.spinner className='h-3.5 w-3.5 animate-spin' />
              ) : (
                'Add'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Agent Row ────────────────────────────────────────────────────────────────

function AgentRow({ agent, campaignId }: { agent: CampaignAgent; campaignId: string }) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (active: boolean) => toggleAgentActive(campaignId, agent.id, active),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      toast.success(agent.active ? 'Agent paused' : 'Agent activated');
    }
  });

  const removeMutation = useMutation({
    mutationFn: () => removeAgentFromCampaign(campaignId, agent.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.detail(campaignId) });
      toast.success(`${agent.name} removed from campaign`);
    }
  });

  const contactRate =
    agent.leadsAssigned > 0 ? Math.round((agent.leadsContacted / agent.leadsAssigned) * 100) : 0;

  return (
    <TableRow className='hover:bg-muted/20 transition-colors group'>
      {/* Active toggle */}
      <TableCell className='py-3.5 px-5 w-20'>
        <Switch
          checked={agent.active}
          onCheckedChange={(v) => toggleMutation.mutate(v)}
          disabled={toggleMutation.isPending}
          className='data-[state=checked]:bg-primary'
        />
      </TableCell>

      {/* User */}
      <TableCell className='py-3.5 px-5'>
        <div className='flex items-center gap-3'>
          <Avatar className='h-8 w-8'>
            <AvatarFallback className='bg-primary/10 text-primary text-[11px] font-bold'>
              {initials(agent.name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className='text-sm font-semibold leading-none mb-0.5'>{agent.name}</p>
            <p className='text-xs text-muted-foreground'>{agent.email}</p>
          </div>
        </div>
      </TableCell>

      {/* Leads Assigned */}
      <TableCell className='py-3.5 px-5'>
        <span className='text-sm font-semibold tabular-nums'>{agent.leadsAssigned}</span>
      </TableCell>

      {/* Leads Contacted + progress */}
      <TableCell className='py-3.5 px-5'>
        <div className='flex items-center gap-2'>
          <span className='text-sm font-semibold tabular-nums'>{agent.leadsContacted}</span>
          <div className='flex-1 max-w-[80px]'>
            <div className='h-1.5 rounded-full bg-muted overflow-hidden'>
              <div
                className='h-full rounded-full bg-primary/60 transition-all'
                style={{ width: `${contactRate}%` }}
              />
            </div>
            <p className='text-[10px] text-muted-foreground mt-0.5 tabular-nums'>{contactRate}%</p>
          </div>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className='py-3.5 px-5 text-right'>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8 opacity-0 focus:opacity-100 group-hover:opacity-100 transition-opacity data-[state=open]:opacity-100'
            >
              <Icons.ellipsis className='h-4 w-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-40'>
            <DropdownMenuItem onClick={() => toggleMutation.mutate(!agent.active)}>
              <Icons.clock className='mr-2 h-3.5 w-3.5' />
              {agent.active ? 'Pause' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuItem
              className='text-destructive focus:text-destructive'
              onClick={() => removeMutation.mutate()}
              disabled={removeMutation.isPending}
            >
              <Icons.trash className='mr-2 h-3.5 w-3.5' />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

// ─── Agents Table ─────────────────────────────────────────────────────────────

function AgentsTable({ agents, campaignId }: { agents: CampaignAgent[]; campaignId: string }) {
  const [search, setSearch] = useState('');

  const filtered = agents.filter(
    (a) =>
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search bar */}
      <div className='mb-4 flex items-center justify-between'>
        <div className='relative w-full max-w-sm'>
          <Icons.search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search agents by name or email...'
            className='pl-9 h-9 text-sm bg-background border-border/50 focus-visible:ring-primary/20 transition-all shadow-sm'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 rounded-xl border border-border/40 border-dashed bg-muted/20'>
          <div className='p-3 rounded-full bg-muted/60 mb-3'>
            <Icons.user className='h-6 w-6 text-muted-foreground/50' />
          </div>
          <p className='text-sm font-medium text-muted-foreground'>No agents assigned yet</p>
          <p className='text-xs text-muted-foreground/70 mt-1'>
            Add agents to manage leads in this campaign
          </p>
        </div>
      ) : (
        <Card className='shadow-sm border-border/40 overflow-hidden'>
          <div className='px-5 py-3 bg-muted/30 border-b border-border/40 flex items-center justify-between'>
            <p className='text-xs font-semibold text-muted-foreground uppercase tracking-widest'>
              Active Agents
            </p>
            <span className='text-xs text-muted-foreground tabular-nums'>
              {filtered.length} agent{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent border-b border-border/40'>
                <TableHead className='py-3 px-5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest w-20'>
                  Active
                </TableHead>
                <TableHead className='py-3 px-5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest'>
                  User
                </TableHead>
                <TableHead className='py-3 px-5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest'>
                  Leads Assigned
                </TableHead>
                <TableHead className='py-3 px-5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-widest'>
                  Leads Contacted
                </TableHead>
                <TableHead className='py-3 px-5 w-12' />
              </TableRow>
            </TableHeader>
            <TableBody className='divide-y divide-border/30'>
              {filtered.map((agent) => (
                <AgentRow key={agent.id} agent={agent} campaignId={campaignId} />
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}

// ─── Status Actions ───────────────────────────────────────────────────────────

function StatusActions({ campaign }: { campaign: Campaign }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: Campaign['status']) => updateCampaignStatus(campaign.id, status),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success(`Campaign ${updated.status}`);
    }
  });

  return (
    <div className='flex items-center gap-2'>
      <Button size='sm' variant='outline' className='h-8 text-xs font-medium gap-1.5'>
        <Icons.settings className='h-3.5 w-3.5 text-muted-foreground' />
        Setup
      </Button>
      <Button size='sm' variant='outline' className='h-8 text-xs font-medium gap-1.5'>
        <Icons.edit className='h-3.5 w-3.5 text-muted-foreground' />
        Edit
      </Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size='sm' variant='outline' className='h-8 w-8 px-0'>
            <Icons.ellipsis className='h-3.5 w-3.5' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-44'>
          {campaign.status !== 'active' && (
            <DropdownMenuItem onClick={() => mutation.mutate('active')}>
              <Icons.circleCheck className='mr-2 h-3.5 w-3.5' />
              Activate
            </DropdownMenuItem>
          )}
          {campaign.status !== 'paused' && (
            <DropdownMenuItem onClick={() => mutation.mutate('paused')}>
              <Icons.clock className='mr-2 h-3.5 w-3.5' />
              Pause
            </DropdownMenuItem>
          )}
          {campaign.status !== 'completed' && (
            <DropdownMenuItem onClick={() => mutation.mutate('completed')}>
              <Icons.checks className='mr-2 h-3.5 w-3.5' />
              Mark Complete
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

// ─── Campaign Detail ──────────────────────────────────────────────────────────

export function CampaignDetail({ id }: { id: string }) {
  const { data: campaign } = useSuspenseQuery(campaignDetailQueryOptions(id));
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'agents' | 'leads'>('agents');
  const [addAgentOpen, setAddAgentOpen] = useState(false);

  if (!campaign) {
    return (
      <div className='text-muted-foreground py-20 text-center'>
        <Icons.campaign className='mx-auto mb-3 h-12 w-12 opacity-20' />
        <p>Campaign not found.</p>
      </div>
    );
  }

  const src = SOURCE_CONFIG[campaign.source] ?? {
    label: campaign.source,
    color: '#666',
    icon: 'campaign' as keyof typeof Icons
  };
  const SrcIcon = Icons[src.icon];
  const status = STATUS_CONFIG[campaign.status] ?? STATUS_CONFIG.draft;
  const breakdown = campaign.leadStatusBreakdown ?? {
    qualified: 0,
    workingDeal: 0,
    dealClosed: 0,
    lostDeal: 0,
    futureProspect: 0,
    didNotRespond: 0,
    unqualified: 0
  };
  const agents = campaign.agents ?? [];

  return (
    <>
      {/* ── Header ─────────────────────────────────────────────── */}
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex items-center gap-3.5'>
          <div
            className='flex h-11 w-11 items-center justify-center rounded-xl text-white flex-shrink-0 shadow-sm'
            style={{ backgroundColor: src.color }}
          >
            <SrcIcon className='h-5 w-5' />
          </div>
          <div>
            <div className='flex items-center gap-2 flex-wrap'>
              <h1 className='text-xl font-bold tracking-tight leading-none font-heading'>
                {campaign.name}
              </h1>
              <Badge
                variant='outline'
                className={cn('border text-[11px] font-medium px-2 py-0.5', status.color)}
              >
                {status.label}
              </Badge>
            </div>
            {campaign.description && (
              <p className='text-muted-foreground mt-1 text-xs'>{campaign.description}</p>
            )}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='text-xs font-medium text-muted-foreground hidden sm:block'>Actions</span>
          <StatusActions campaign={campaign} />
        </div>
      </div>

      {/* ── Top Stats Panel ─────────────────────────────────────── */}
      <Card className='mb-4 shadow-sm border border-border/40 overflow-hidden'>
        <CardContent className='p-0'>
          <div className='grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-border/40'>
            {[
              {
                label: 'Total Leads',
                value: campaign.totalLeads,
                icon: 'leads' as const,
                accent: 'text-primary',
                bgAccent: 'bg-primary/10'
              },
              {
                label: 'Contacted Leads',
                value: campaign.contacted,
                icon: 'call' as const,
                accent: 'text-green-600',
                bgAccent: 'bg-green-500/10'
              },
              {
                label: 'Pending Leads',
                value: campaign.pending ?? 0,
                icon: 'clock' as const,
                accent: 'text-amber-500',
                bgAccent: 'bg-amber-500/10'
              }
            ].map((stat) => {
              const Icon = Icons[stat.icon];
              return (
                <div
                  key={stat.label}
                  className='relative p-5 group transition-colors hover:bg-muted/10'
                >
                  <div className='flex items-start justify-between mb-2'>
                    <p className='text-xs font-medium text-muted-foreground tracking-wide'>
                      {stat.label}
                    </p>
                    <div
                      className={cn(
                        'p-1.5 rounded-md transition-colors',
                        stat.bgAccent,
                        stat.accent
                      )}
                    >
                      <Icon className='h-3.5 w-3.5' />
                    </div>
                  </div>
                  <p
                    className={cn(
                      'text-3xl font-bold tabular-nums tracking-tight font-heading',
                      stat.accent
                    )}
                  >
                    {stat.value}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Lead Status Breakdown ────────────────────────────────── */}
      <Card className='mb-5 shadow-sm border border-border/40'>
        <CardHeader className='px-5 pt-4 pb-3'>
          <CardTitle className='text-sm font-semibold tracking-tight'>Lead Status</CardTitle>
        </CardHeader>
        <CardContent className='px-5 pb-5'>
          <div className='grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3'>
            {LEAD_STATUS_CONFIG.map((s) => {
              const total = campaign.totalLeads || 1;
              const pct = Math.round((breakdown[s.key] / total) * 100);
              return (
                <div
                  key={s.key}
                  className='group p-3 rounded-xl border border-border/30 bg-muted/10 hover:bg-muted/30 transition-colors'
                >
                  <div className='flex items-center gap-2 mb-2.5'>
                    <span
                      className='inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 shadow-sm'
                      style={{ backgroundColor: s.color }}
                    />
                    <span className='text-[11px] font-medium text-muted-foreground truncate leading-none'>
                      {s.label}
                    </span>
                  </div>
                  <p className='text-2xl font-bold tabular-nums tracking-tight font-heading mb-2 text-foreground/90'>
                    {breakdown[s.key]}
                  </p>
                  <div className='h-1.5 w-full rounded-full bg-muted/80 overflow-hidden'>
                    <div
                      className='h-full rounded-full transition-all duration-500 shadow-sm'
                      style={{ width: `${pct}%`, backgroundColor: s.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ── Details ─────────────────────────────────────────────── */}
      <div className='mb-2 flex items-center justify-between'>
        <h2 className='text-lg font-semibold tracking-tight'>Details</h2>
        <Button
          size='sm'
          variant='default'
          className='h-8 text-xs gap-1.5 font-medium shadow-sm'
          onClick={() => setAddAgentOpen(true)}
        >
          <Icons.add className='h-3.5 w-3.5' />
          Add agent
        </Button>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────── */}
      <div className='mb-5 border-b border-border/40'>
        <div className='flex'>
          {[
            { key: 'agents' as const, label: 'Agents', count: agents.length },
            { key: 'leads' as const, label: 'Leads', count: campaign.totalLeads }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors',
                activeTab === tab.key
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
              )}
            >
              {tab.label}
              <span
                className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-full tabular-nums',
                  activeTab === tab.key
                    ? 'bg-primary/10 text-primary'
                    : 'bg-muted text-muted-foreground'
                )}
              >
                {tab.count}
              </span>
              {activeTab === tab.key && (
                <span className='absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-t-full' />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Tab Content ─────────────────────────────────────────── */}
      {activeTab === 'agents' ? (
        <AgentsTable agents={agents} campaignId={campaign.id} />
      ) : (
        <div>
          <div className='mb-3 flex items-center justify-between'>
            <p className='text-sm text-muted-foreground'>
              {campaign.totalLeads} leads in this campaign
            </p>
            <Button size='sm' variant='outline' className='h-8 text-xs'>
              <Icons.export className='mr-1.5 h-3.5 w-3.5' />
              Export CSV
            </Button>
          </div>
          <LeadsTable
            filters={{ campaignId: campaign.id }}
            onLeadSelect={(lead) => {
              setSelectedLead(lead);
              setSheetOpen(true);
            }}
          />
        </div>
      )}

      <AddAgentDialog
        open={addAgentOpen}
        onOpenChange={setAddAgentOpen}
        campaignId={campaign.id}
        existingAgentIds={agents.map((a) => a.id)}
      />

      <LeadSheet lead={selectedLead} open={sheetOpen} onOpenChange={setSheetOpen} />
    </>
  );
}
