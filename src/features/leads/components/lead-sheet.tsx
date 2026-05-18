'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Lead, LeadActivity, LeadStatus, CallStatus, LeadLabel } from '../api/types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logCall, updateLeadStatus, updateLead } from '../api/service';
import { leadKeys } from '../api/queries';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

// ─── Types ────────────────────────────────────────────────────────────────────

type ActivePanel = 'call' | 'whatsapp' | 'email' | 'meeting' | 'note' | null;

// ─── Config ──────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<LeadStatus, { label: string; dot: string; badge: string }> = {
  unprocessed: {
    label: 'Unprocessed',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-600 border-slate-200'
  },
  qualified: {
    label: 'Qualified',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200'
  },
  working_deal: {
    label: 'Working Deal',
    dot: 'bg-blue-500',
    badge: 'bg-blue-50 text-blue-700 border-blue-200'
  },
  deal_closed: {
    label: 'Deal Closed',
    dot: 'bg-purple-500',
    badge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  lost_deal: {
    label: 'Lost Deal',
    dot: 'bg-slate-400',
    badge: 'bg-slate-100 text-slate-500 border-slate-200'
  },
  future_prospect: {
    label: 'Future Prospect',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-50 text-cyan-700 border-cyan-200'
  },
  did_not_respond: {
    label: 'Did Not Respond',
    dot: 'bg-amber-500',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  unqualified: {
    label: 'Unqualified',
    dot: 'bg-red-500',
    badge: 'bg-red-50 text-red-600 border-red-100'
  }
};

const LABEL_CONFIG: Record<
  NonNullable<LeadLabel>,
  { label: string; color: string; badge: string }
> = {
  hot: { label: '🔥 Hot', color: 'text-red-600', badge: 'bg-red-50 text-red-700 border-red-200' },
  warm: {
    label: '☀️ Warm',
    color: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700 border-amber-200'
  },
  cold: {
    label: '❄️ Cold',
    color: 'text-blue-500',
    badge: 'bg-blue-50 text-blue-600 border-blue-200'
  },
  priority: {
    label: '⭐ Priority',
    color: 'text-yellow-600',
    badge: 'bg-yellow-50 text-yellow-700 border-yellow-200'
  },
  follow_up: {
    label: '🔄 Follow Up',
    color: 'text-purple-600',
    badge: 'bg-purple-50 text-purple-700 border-purple-200'
  },
  do_not_contact: {
    label: '🚫 DNC',
    color: 'text-gray-500',
    badge: 'bg-gray-100 text-gray-500 border-gray-200'
  }
};

const SOURCE_CONFIG: Record<LeadSource, { label: string; badge: string }> = {
  facebook: { label: 'Facebook', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  tiktok: { label: 'TikTok', badge: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200' },
  website: { label: 'Website', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  csv: { label: 'CSV', badge: 'bg-slate-100 text-slate-700 border-slate-200' },
  manual: { label: 'Manual', badge: 'bg-purple-50 text-purple-700 border-purple-200' }
};

const CALL_STATUS_CONFIG: Record<
  CallStatus,
  { label: string; icon: keyof typeof Icons; color: string }
> = {
  answered: { label: 'Answered', icon: 'call', color: 'text-emerald-600' },
  did_not_respond: { label: 'No Answer', icon: 'callOff', color: 'text-amber-500' },
  dead_number: { label: 'Dead Number', icon: 'close', color: 'text-red-500' },
  not_called: { label: 'Not Called', icon: 'phone', color: 'text-muted-foreground' }
};

const ACTIVITY_ICONS: Record<LeadActivity['type'], keyof typeof Icons> = {
  call: 'call',
  note: 'note',
  status_change: 'circleCheck',
  assignment: 'user',
  meeting: 'meeting'
};

// ─── Panel configs ────────────────────────────────────────────────────────────

const PANEL_CONFIG: Record<
  Exclude<ActivePanel, null>,
  { title: string; outcomes: { value: string; label: string; icon: keyof typeof Icons }[] }
> = {
  call: {
    title: 'Log Call Outcome',
    outcomes: [
      { value: 'answered', label: 'Answered', icon: 'check' },
      { value: 'did_not_respond', label: 'No Answer', icon: 'callOff' },
      { value: 'dead_number', label: 'Dead Number', icon: 'close' }
    ]
  },
  whatsapp: {
    title: 'Log WhatsApp Outcome',
    outcomes: [
      { value: 'replied', label: 'Replied', icon: 'check' },
      { value: 'no_reply', label: 'No Reply', icon: 'callOff' },
      { value: 'wrong_number', label: 'Wrong Number', icon: 'close' }
    ]
  },
  email: {
    title: 'Log Email Outcome',
    outcomes: [
      { value: 'sent', label: 'Sent', icon: 'check' },
      { value: 'no_response', label: 'No Response', icon: 'callOff' },
      { value: 'bounced', label: 'Bounced', icon: 'close' }
    ]
  },
  meeting: {
    title: 'Log Meeting Outcome',
    outcomes: [
      { value: 'attended', label: 'Attended', icon: 'check' },
      { value: 'no_show', label: 'No Show', icon: 'callOff' },
      { value: 'rescheduled', label: 'Rescheduled', icon: 'calendar' }
    ]
  },
  note: {
    title: 'Add Note',
    outcomes: []
  }
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function initials(name: string) {
  if (!name) return '??';
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function formatTaskDate(dateStr: string) {
  const d = new Date(dateStr);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${months[d.getMonth()]} ${d.getDate()}, ${h}:${m} ${ampm}`;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  let h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${m} ${ampm}`;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className='font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
      {children}
    </p>
  );
}

// ─── Unified Log Panel ────────────────────────────────────────────────────────

function LogPanel({
  panelType,
  lead,
  onClose
}: {
  panelType: Exclude<ActivePanel, null>;
  lead: Lead;
  onClose: () => void;
}) {
  const [outcome, setOutcome] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const queryClient = useQueryClient();

  const config = PANEL_CONFIG[panelType];
  const isNoteOnly = panelType === 'note';

  const mutation = useMutation({
    mutationFn: () =>
      logCall({
        leadId: lead.id,
        callStatus: (outcome || 'answered') as CallStatus,
        notes:
          `[${panelType.toUpperCase()}] ${outcome ? `Outcome: ${outcome}.` : ''} ${notes}`.trim()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast.success('Activity logged');
      onClose();
    }
  });

  const canSave = isNoteOnly ? notes.trim().length > 0 : outcome !== null;
  const actionLabel = isNoteOnly ? 'Add Note' : 'Log Outcome';

  return (
    <div className='rounded-lg border bg-muted/30 p-4 space-y-4'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <SectionLabel>{config.title}</SectionLabel>
          {isNoteOnly ? (
            <p className='text-xs text-muted-foreground'>
              Use this note for internal context or follow-up instructions.
            </p>
          ) : (
            <p className='text-xs text-muted-foreground'>
              Select the outcome and add optional notes for the lead activity.
            </p>
          )}
        </div>
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 -mr-1 cursor-pointer'
          onClick={onClose}
        >
          <Icons.close className='h-4 w-4' />
        </Button>
      </div>

      {config.outcomes.length > 0 && (
        <div className='grid grid-cols-3 gap-2'>
          {config.outcomes.map((o) => {
            const Icon = Icons[o.icon];
            const selected = outcome === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setOutcome(o.value)}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-md border px-3 py-3 text-xs font-medium transition-all cursor-pointer',
                  selected
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                <Icon className='h-4 w-4' />
                {o.label}
              </button>
            );
          })}
        </div>
      )}

      <div className='space-y-1.5'>
        <label className='text-xs font-medium text-muted-foreground'>
          {isNoteOnly ? 'Note' : 'Notes (optional)'}
        </label>
        <Textarea
          placeholder={isNoteOnly ? 'Write your note...' : 'Add notes...'}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className='text-sm resize-none'
        />
      </div>

      <div className='flex justify-end gap-2'>
        <Button variant='outline' size='sm' className='cursor-pointer' onClick={onClose}>
          Cancel
        </Button>
        <Button
          size='sm'
          className='cursor-pointer'
          disabled={!canSave || mutation.isPending}
          onClick={() => mutation.mutate()}
        >
          {mutation.isPending && <Icons.spinner className='mr-1.5 h-3.5 w-3.5 animate-spin' />}
          {actionLabel}
        </Button>
      </div>
    </div>
  );
}

// ─── Activity Timeline ────────────────────────────────────────────────────────

function ActivityTimeline({ activities }: { activities: LeadActivity[] }) {
  if (activities.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-10 rounded-lg border border-dashed'>
        <Icons.note className='h-7 w-7 text-muted-foreground/30 mb-2' />
        <p className='text-sm text-muted-foreground'>No activity recorded yet.</p>
      </div>
    );
  }

  const grouped = activities.reduce(
    (acc, act) => {
      const d = formatDate(act.createdAt);
      if (!acc[d]) acc[d] = [];
      acc[d].push(act);
      return acc;
    },
    {} as Record<string, LeadActivity[]>
  );

  return (
    <div className='space-y-6'>
      {Object.entries(grouped).map(([date, acts]) => (
        <div key={date}>
          <p className='font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3'>
            {date}
          </p>
          <div className='relative space-y-4'>
            <div className='absolute left-[7px] top-2 bottom-0 w-px bg-border' />
            {acts.map((act) => {
              const iconKey = ACTIVITY_ICONS[act.type] || 'circle';
              const Icon = Icons[iconKey];
              let outcomeLabel = '';
              let bodyNotes = act.notes;

              if (act.type === 'call' && act.notes) {
                if (act.notes.includes('Did Not Respond')) {
                  outcomeLabel = 'No Answer';
                  bodyNotes = undefined;
                } else if (act.notes.includes('Answered')) {
                  outcomeLabel = 'Answered';
                  bodyNotes = undefined;
                } else if (act.notes.includes('Dead Number')) {
                  outcomeLabel = 'Dead Number';
                  bodyNotes = undefined;
                }
              }

              return (
                <div key={act.id} className='flex gap-3 relative'>
                  <div className='flex-shrink-0 z-10 mt-0.5'>
                    <div className='h-5.5 w-5.5 rounded-full bg-background border-2 border-border flex items-center justify-center'>
                      <Icon className='h-3.5 w-3.5 text-muted-foreground' />
                    </div>
                  </div>
                  <div className='flex-1 pb-2 pt-0.5 min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <p className='text-sm font-medium text-foreground leading-snug'>
                        {act.description}
                      </p>
                      <span className='text-xs text-muted-foreground whitespace-nowrap flex-shrink-0'>
                        {formatTime(act.createdAt)}
                      </span>
                    </div>
                    {(bodyNotes || outcomeLabel) && (
                      <div className='mt-1.5 rounded-md bg-muted/50 border px-3 py-2 text-xs text-muted-foreground'>
                        {outcomeLabel && (
                          <span className='font-semibold text-foreground mr-1.5'>
                            {outcomeLabel}
                          </span>
                        )}
                        {bodyNotes}
                      </div>
                    )}
                    <p className='text-xs text-muted-foreground/60 mt-1'>by {act.createdBy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Lead Sheet ───────────────────────────────────────────────────────────────

interface LeadSheetProps {
  lead: Lead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeadSheet({ lead, open, onOpenChange }: LeadSheetProps) {
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const queryClient = useQueryClient();

  const statusMutation = useMutation({
    mutationFn: (status: LeadStatus) => updateLeadStatus({ leadId: lead!.id, status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast.success('Status updated');
    }
  });

  const labelMutation = useMutation({
    mutationFn: (label: LeadLabel) => updateLead({ leadId: lead!.id, label }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast.success('Label updated');
    }
  });

  if (!lead) return null;

  const statusCfg = STATUS_CONFIG[lead.status];
  const sourceCfg = SOURCE_CONFIG[lead.source];
  const callStatusCfg = CALL_STATUS_CONFIG[lead.callStatus];
  const lastCalled = lead.lastCalledAt ? formatTime(lead.lastCalledAt) : 'Not called yet';
  const taskCount = lead.tasks?.length ?? 0;
  const activityCount = lead.activities?.length ?? 0;

  function togglePanel(panel: Exclude<ActivePanel, null>) {
    setActivePanel((cur) => (cur === panel ? null : panel));
  }

  const QUICK_ACTIONS: {
    id: Exclude<ActivePanel, null>;
    icon: keyof typeof Icons;
    title: string;
    sideEffect?: () => void;
  }[] = [
    { id: 'call', icon: 'call', title: 'Log Call' },
    {
      id: 'whatsapp',
      icon: 'whatsapp',
      title: 'WhatsApp',
      sideEffect: () => {
        if (lead.phone) window.open(`https://wa.me/${lead.phone.replace(/\D/g, '')}`, '_blank');
        else toast.error('No phone number on this lead');
      }
    },
    {
      id: 'email',
      icon: 'email',
      title: 'Email',
      sideEffect: () => {
        if (lead.email) window.location.href = `mailto:${lead.email}`;
        else toast.error('No email address on this lead');
      }
    },
    { id: 'meeting', icon: 'meeting', title: 'Schedule Meeting' },
    { id: 'note', icon: 'comment', title: 'Add Note' }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-[480px]' side='right'>
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className='px-6 pt-6 pb-3 border-b'>
          <div className='flex items-start gap-3'>
            <Avatar className='h-10 w-10 border flex-shrink-0'>
              <AvatarFallback className='bg-primary/10 text-primary text-sm font-semibold'>
                {initials(lead.name)}
              </AvatarFallback>
            </Avatar>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 flex-wrap'>
                <SheetTitle className='text-base font-semibold leading-tight'>
                  {lead.name}
                </SheetTitle>
                {lead.label && (
                  <Badge
                    variant='outline'
                    className={cn('text-xs h-5 px-2 font-medium', LABEL_CONFIG[lead.label].badge)}
                  >
                    {LABEL_CONFIG[lead.label].label}
                  </Badge>
                )}
              </div>
              <p className='text-sm text-muted-foreground mt-0.5'>
                {lead.campaignName || 'No Campaign'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className='flex flex-wrap items-center gap-2 mt-2'>
            {QUICK_ACTIONS.map((action) => {
              const Icon = Icons[action.icon];
              const isActive = activePanel === action.id;
              return (
                <Button
                  key={action.id}
                  variant={isActive ? 'default' : 'outline'}
                  size='icon'
                  title={action.title}
                  className='h-9 w-9 rounded-lg p-0'
                  onClick={() => {
                    action.sideEffect?.();
                    togglePanel(action.id);
                  }}
                >
                  <Icon className='h-4 w-4' />
                </Button>
              );
            })}
          </div>
        </div>

        {/* ── Scrollable Body ─────────────────────────────────────── */}
        <div className='flex-1 overflow-y-auto divide-y divide-border'>
          {/* Active Log Panel */}
          {activePanel && (
            <div className='px-6 py-5'>
              <LogPanel panelType={activePanel} lead={lead} onClose={() => setActivePanel(null)} />
            </div>
          )}

          {/* Details */}
          <div className='px-6 py-4 space-y-4'>
            <SectionLabel>Details</SectionLabel>
            <div className='grid grid-cols-2 gap-x-6 gap-y-4'>
              {[
                { label: 'Phone', value: lead.phone || '—', icon: Icons.phone },
                { label: 'Email', value: lead.email || '—', icon: Icons.email },
                { label: 'Campaign', value: lead.campaignName || 'Organic', icon: Icons.campaign },
                {
                  label: 'Deal Value',
                  value: lead.dealValue ? `PKR ${lead.dealValue.toLocaleString()}` : '—',
                  icon: Icons.billing
                }
              ].map((d) => (
                <div key={d.label} className='space-y-1'>
                  <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                    {/* <d.icon className='h-3 w-3 flex-shrink-0' /> */}
                    <span>{d.label}</span>
                  </div>
                  <p className='text-sm font-medium text-foreground truncate'>{d.value}</p>
                </div>
              ))}

              {/* Status */}
              <div className='space-y-1'>
                <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <Icons.trendingUp className='h-3 w-3 flex-shrink-0' />
                  <span>Status</span>
                </div>
                <Select
                  disabled={statusMutation.isPending}
                  value={lead.status}
                  onValueChange={(val) => statusMutation.mutate(val as LeadStatus)}
                >
                  <SelectTrigger className='h-auto border-1 p-3 cursor-pointer shadow-none bg-transparent focus:ring-0 w-full justify-start'>
                    <SelectValue>
                      <div className='flex items-center gap-1.5'>
                        <div className={cn('h-2 w-2 rounded-full flex-shrink-0', statusCfg?.dot)} />
                        <span className='text-sm font-medium'>{statusCfg?.label}</span>
                      </div>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(STATUS_CONFIG) as [
                        LeadStatus,
                        (typeof STATUS_CONFIG)[LeadStatus]
                      ][]
                    ).map(([key, cfg]) => (
                      <SelectItem key={key} value={key} className='cursor-pointer'>
                        <div className='flex items-center gap-2 '>
                          <div className={cn('h-2 w-2 rounded-full', cfg.dot)} />
                          <span>{cfg.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Assigned To */}
              <div className='space-y-1'>
                <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                  <Icons.user2 className='h-3 w-3 flex-shrink-0' />
                  <span>Assigned To</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Avatar className='h-7 w-7 border flex-shrink-0'>
                    <AvatarFallback className='text-[10px] bg-primary/10 text-primary font-semibold'>
                      {initials(lead.assignedTo || 'UN')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-sm font-medium'>{lead.assignedTo || 'Unassigned'}</p>
                    <p className='text-xs text-muted-foreground'>
                      Last updated {formatTime(lead.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {lead.notes && (
              <div className='rounded-md border bg-muted/30 p-3 space-y-1'>
                <p className='text-xs font-medium text-muted-foreground'>Notes</p>
                <p className='text-sm text-foreground/80 leading-relaxed'>{lead.notes}</p>
              </div>
            )}

            <div className='space-y-1.5'>
              <div className='flex items-center justify-between'>
                {/* <p className='text-xs font-medium text-muted-foreground'>Lead Label</p> */}
                <p className='font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground'>
                  Lead Label
                </p>

                {lead.label && (
                  <Badge
                    variant='outline'
                    className={cn('text-xs h-6 px-2 font-medium', LABEL_CONFIG[lead.label].badge)}
                  >
                    {LABEL_CONFIG[lead.label].label}
                  </Badge>
                )}
              </div>
              <Select
                disabled={labelMutation.isPending}
                value={lead.label || 'none'}
                onValueChange={(val) =>
                  labelMutation.mutate(val === 'none' ? null : (val as LeadLabel))
                }
              >
                <SelectTrigger className='h-9 w-full text-sm'>
                  <SelectValue placeholder='Set label' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='none'>No Label</SelectItem>
                  {(
                    Object.entries(LABEL_CONFIG) as [
                      NonNullable<LeadLabel>,
                      (typeof LABEL_CONFIG)[NonNullable<LeadLabel>]
                    ][]
                  ).map(([key, cfg]) => (
                    <SelectItem key={key} value={key}>
                      <span className={cn('font-medium', cfg.color)}>{cfg.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tasks */}
          <div className='px-6 py-5 space-y-3'>
            <div className='flex items-center justify-between gap-3'>
              <SectionLabel>Tasks</SectionLabel>
              {/* <Button variant='ghost' size='sm' className='h-8 text-xs text-muted-foreground px-3 cursor-pointer' onClick={() => toast.success('Task creation coming soon')}>
                <Icons.add className='h-3.5 w-3.5 mr-1' />
                New Task
              </Button> */}
            </div>
            {lead.tasks && lead.tasks.length > 0 ? (
              <div className='space-y-3'>
                {lead.tasks.map((task) => (
                  <div
                    key={task.id}
                    className='rounded-lg border bg-card p-3 flex items-center justify-between gap-3'
                  >
                    <div className='min-w-0'>
                      <p className='text-sm font-medium text-foreground truncate'>{task.title}</p>
                      <p className='text-xs text-muted-foreground mt-1'>
                        {task.dueDate ? formatTaskDate(task.dueDate) : 'No due date'} · {task.type}
                      </p>
                    </div>
                    <Button
                      size='sm'
                      className='h-8 text-xs flex-shrink-0'
                      onClick={() => toast.success('Task marked complete')}
                    >
                      {task.completed ? 'Completed' : 'Complete'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className='rounded-lg border border-dashed p-6 text-center'>
                <Icons.check className='mx-auto h-5 w-5 text-muted-foreground mb-3' />
                <p className='text-sm text-muted-foreground'>No active tasks scheduled.</p>
              </div>
            )}
          </div>

          {/* Activity */}
          <div className='px-6 py-5 pb-12'>
            <div className='mb-4'>
              <SectionLabel>Activity History</SectionLabel>
            </div>
            <ActivityTimeline activities={lead.activities} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
