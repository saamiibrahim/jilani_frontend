'use client';

import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createCampaign, addManualLeads } from '../api/service';
import { campaignKeys } from '../api/queries';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface LeadRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  error?: string;
}

function newRow(): LeadRow {
  return { id: crypto.randomUUID(), name: '', phone: '', email: '' };
}

// ─── Step Indicator ───────────────────────────────────────────────────────────

const STEPS = [{ label: 'Campaign Info' }, { label: 'Add Leads' }, { label: 'Review' }];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className='flex items-center gap-0'>
      {STEPS.map((step, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <div key={i} className='flex items-center'>
            <div className='flex flex-col items-center'>
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                  done
                    ? 'bg-primary text-primary-foreground'
                    : active
                      ? 'border-primary border-2 text-primary bg-background'
                      : 'border-border border-2 text-muted-foreground bg-background'
                )}
              >
                {done ? <Icons.check className='h-3.5 w-3.5' /> : i + 1}
              </div>
              <span
                className={cn(
                  'mt-1 text-[10px] font-medium whitespace-nowrap',
                  active ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {step.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px w-10 mb-4 mx-1 transition-colors',
                  done ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Step 1: Campaign Info ────────────────────────────────────────────────────

function StepCampaignInfo({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  onNext
}: {
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  onNext: () => void;
}) {
  const [error, setError] = useState('');

  function handleNext() {
    if (!name.trim()) {
      setError('Campaign name is required');
      return;
    }
    setError('');
    onNext();
  }

  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex-1 space-y-5 p-6'>
        <div>
          <p className='text-muted-foreground text-xs font-semibold uppercase tracking-widest mb-4'>
            Campaign Details
          </p>

          <div className='space-y-4'>
            <div className='space-y-1.5'>
              <Label htmlFor='mc-name' className='text-sm'>
                Campaign Name <span className='text-red-500'>*</span>
              </Label>
              <Input
                id='mc-name'
                placeholder='e.g. Walk-in Leads April 2025'
                value={name}
                onChange={(e) => {
                  onNameChange(e.target.value);
                  if (error) setError('');
                }}
                autoFocus
                className={error ? 'border-red-400' : ''}
              />
              {error && <p className='text-xs text-red-500'>{error}</p>}
            </div>

            <div className='space-y-1.5'>
              <Label htmlFor='mc-desc' className='text-sm'>
                Description{' '}
                <span className='text-muted-foreground text-xs font-normal'>(optional)</span>
              </Label>
              <Textarea
                id='mc-desc'
                placeholder='Describe the campaign — source of leads, purpose, event, etc.'
                value={description}
                onChange={(e) => onDescriptionChange(e.target.value)}
                rows={4}
                className='resize-none text-sm'
              />
            </div>
          </div>
        </div>

        <div className='rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground'>
          <p className='font-medium text-foreground mb-1 text-xs'>Manual Entry Campaign</p>
          <p className='text-xs'>
            You&apos;ll add leads one by one in the next step. You can always add more leads later
            from the campaign detail page.
          </p>
        </div>
      </div>

      <div className='border-t px-6 py-4'>
        <Button className='w-full' onClick={handleNext}>
          Continue to Add Leads
          <Icons.chevronRight className='ml-1.5 h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 2: Add Leads ────────────────────────────────────────────────────────

function StepAddLeads({
  leads,
  onChange,
  onBack,
  onNext
}: {
  leads: LeadRow[];
  onChange: (leads: LeadRow[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const lastRowRef = useRef<HTMLInputElement>(null);

  function updateRow(id: string, field: keyof LeadRow, value: string) {
    onChange(leads.map((r) => (r.id === id ? { ...r, [field]: value, error: undefined } : r)));
  }

  function addRow() {
    onChange([...leads, newRow()]);
    // Focus new row after render
    setTimeout(() => lastRowRef.current?.focus(), 50);
  }

  function removeRow(id: string) {
    if (leads.length === 1) {
      onChange([newRow()]);
    } else {
      onChange(leads.filter((r) => r.id !== id));
    }
  }

  function handleNext() {
    // Validate: at least one lead with name + phone
    const validated = leads.map((r) => ({
      ...r,
      error:
        r.name.trim() || r.phone.trim()
          ? !r.name.trim()
            ? 'Name required'
            : !r.phone.trim()
              ? 'Phone required'
              : undefined
          : undefined
    }));
    const hasErrors = validated.some((r) => r.error);
    const filledLeads = validated.filter((r) => r.name.trim() && r.phone.trim());

    if (hasErrors) {
      onChange(validated);
      return;
    }
    if (filledLeads.length === 0) {
      // No leads is fine — they can add later
      onNext();
      return;
    }
    // Remove blank rows before proceeding
    onChange(filledLeads.length > 0 ? filledLeads : [newRow()]);
    onNext();
  }

  const filledCount = leads.filter((r) => r.name.trim() && r.phone.trim()).length;

  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex-1 overflow-y-auto p-6 space-y-3'>
        <div className='flex items-center justify-between mb-1'>
          <p className='text-muted-foreground text-xs font-semibold uppercase tracking-widest'>
            Leads
          </p>
          {filledCount > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {filledCount} lead{filledCount !== 1 ? 's' : ''} ready
            </Badge>
          )}
        </div>

        {/* Column headers */}
        <div className='grid grid-cols-[1fr_1fr_1fr_auto] gap-2 px-1'>
          <p className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide'>
            Name *
          </p>
          <p className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide'>
            Phone *
          </p>
          <p className='text-[10px] font-medium text-muted-foreground uppercase tracking-wide'>
            Email
          </p>
          <span className='w-7' />
        </div>

        {/* Lead rows */}
        <div className='space-y-2'>
          {leads.map((row, idx) => (
            <div key={row.id} className='space-y-1'>
              <div className='grid grid-cols-[1fr_1fr_1fr_auto] gap-2 items-center'>
                <Input
                  ref={idx === leads.length - 1 ? lastRowRef : undefined}
                  placeholder='Full name'
                  value={row.name}
                  onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                  className={cn('h-8 text-sm', row.error === 'Name required' && 'border-red-400')}
                />
                <Input
                  placeholder='+92 300…'
                  value={row.phone}
                  onChange={(e) => updateRow(row.id, 'phone', e.target.value)}
                  className={cn('h-8 text-sm', row.error === 'Phone required' && 'border-red-400')}
                />
                <Input
                  placeholder='email (opt.)'
                  value={row.email}
                  onChange={(e) => updateRow(row.id, 'email', e.target.value)}
                  className='h-8 text-sm'
                />
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-7 text-muted-foreground hover:text-red-500'
                  onClick={() => removeRow(row.id)}
                  tabIndex={-1}
                >
                  <Icons.close className='h-3.5 w-3.5' />
                </Button>
              </div>
              {row.error && <p className='text-xs text-red-500 pl-1'>{row.error}</p>}
            </div>
          ))}
        </div>

        {/* Add row */}
        <Button
          variant='outline'
          size='sm'
          className='w-full border-dashed text-muted-foreground hover:text-foreground mt-1'
          onClick={addRow}
        >
          <Icons.add className='mr-1.5 h-3.5 w-3.5' />
          Add Another Lead
        </Button>

        <p className='text-center text-xs text-muted-foreground pt-1'>
          You can skip this step and add leads later from the campaign page.
        </p>
      </div>

      <div className='border-t px-6 py-4 flex gap-3'>
        <Button variant='outline' className='flex-1' onClick={onBack}>
          <Icons.chevronLeft className='mr-1 h-4 w-4' />
          Back
        </Button>
        <Button className='flex-1' onClick={handleNext}>
          Review & Create
          <Icons.chevronRight className='ml-1.5 h-4 w-4' />
        </Button>
      </div>
    </div>
  );
}

// ─── Step 3: Review ───────────────────────────────────────────────────────────

function StepReview({
  name,
  description,
  leads,
  onBack,
  onSubmit,
  isPending
}: {
  name: string;
  description: string;
  leads: LeadRow[];
  onBack: () => void;
  onSubmit: () => void;
  isPending: boolean;
}) {
  const filledLeads = leads.filter((r) => r.name.trim() && r.phone.trim());

  return (
    <div className='flex flex-1 flex-col'>
      <div className='flex-1 overflow-y-auto p-6 space-y-5'>
        {/* Campaign summary */}
        <div className='rounded-xl border bg-muted/20 p-4 space-y-3'>
          <div className='flex items-center gap-2'>
            <div className='flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100 text-purple-700'>
              <Icons.edit className='h-4 w-4' />
            </div>
            <div>
              <p className='text-xs text-muted-foreground uppercase tracking-widest font-semibold'>
                Campaign
              </p>
              <p className='font-semibold text-sm'>{name}</p>
            </div>
          </div>
          {description && (
            <p className='text-sm text-muted-foreground border-t pt-3'>{description}</p>
          )}
          <div className='flex items-center gap-4 border-t pt-3 text-xs text-muted-foreground'>
            <span>
              Source: <strong className='text-foreground'>Manual Entry</strong>
            </span>
            <span>
              Status: <strong className='text-foreground'>Draft</strong>
            </span>
          </div>
        </div>

        {/* Leads summary */}
        <div>
          <div className='flex items-center justify-between mb-3'>
            <p className='text-muted-foreground text-xs font-semibold uppercase tracking-widest'>
              Leads to Import
            </p>
            <Badge variant={filledLeads.length > 0 ? 'default' : 'secondary'} className='text-xs'>
              {filledLeads.length} lead{filledLeads.length !== 1 ? 's' : ''}
            </Badge>
          </div>

          {filledLeads.length === 0 ? (
            <div className='rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground'>
              No leads added yet. You can add them after creating the campaign.
            </div>
          ) : (
            <div className='rounded-lg border divide-y overflow-hidden'>
              {filledLeads.slice(0, 5).map((lead, i) => (
                <div key={lead.id} className='flex items-center justify-between px-3 py-2'>
                  <div className='flex items-center gap-2.5'>
                    <div className='flex h-6 w-6 items-center justify-center rounded-full bg-muted text-xs font-semibold'>
                      {i + 1}
                    </div>
                    <div>
                      <p className='text-sm font-medium'>{lead.name}</p>
                      <p className='text-xs text-muted-foreground'>{lead.phone}</p>
                    </div>
                  </div>
                  {lead.email && <p className='text-xs text-muted-foreground'>{lead.email}</p>}
                </div>
              ))}
              {filledLeads.length > 5 && (
                <div className='px-3 py-2 text-xs text-muted-foreground text-center'>
                  +{filledLeads.length - 5} more leads
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className='border-t px-6 py-4 flex gap-3'>
        <Button variant='outline' className='flex-1' onClick={onBack} disabled={isPending}>
          <Icons.chevronLeft className='mr-1 h-4 w-4' />
          Back
        </Button>
        <Button className='flex-1' onClick={onSubmit} disabled={isPending}>
          {isPending ? (
            <>
              <Icons.spinner className='mr-1.5 h-4 w-4 animate-spin' />
              Creating…
            </>
          ) : (
            <>
              <Icons.circleCheck className='mr-1.5 h-4 w-4' />
              Create Campaign
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Dialog ──────────────────────────────────────────────────────────────

interface ManualCampaignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManualCampaignDialog({ open, onOpenChange }: ManualCampaignDialogProps) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [leads, setLeads] = useState<LeadRow[]>([newRow()]);

  const mutation = useMutation({
    mutationFn: async () => {
      // Step 1: create campaign
      const campaign = await createCampaign({
        name: name.trim(),
        source: 'manual',
        description: description.trim() || undefined
      });

      // Step 2: add leads if any
      const filledLeads = leads.filter((r) => r.name.trim() && r.phone.trim());
      if (filledLeads.length > 0) {
        await addManualLeads(
          campaign.id,
          filledLeads.map((r) => ({
            name: r.name.trim(),
            phone: r.phone.trim(),
            email: r.email.trim() || undefined
          }))
        );
      }

      return campaign;
    },
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      const filledLeads = leads.filter((r) => r.name.trim() && r.phone.trim());
      toast.success(
        `Campaign "${campaign.name}" created${filledLeads.length > 0 ? ` with ${filledLeads.length} lead${filledLeads.length !== 1 ? 's' : ''}` : ''}`
      );
      handleClose();
      router.push(`/dashboard/campaigns/${campaign.id}`);
    },
    onError: () => toast.error('Failed to create campaign')
  });

  function handleClose() {
    onOpenChange(false);
    // Reset after close animation
    setTimeout(() => {
      setStep(0);
      setName('');
      setDescription('');
      setLeads([newRow()]);
    }, 300);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='flex flex-col gap-0 p-0 sm:max-w-2xl max-h-[90vh]'>
        {/* Header */}
        <DialogHeader className='border-b px-6 py-4 shrink-0'>
          <div className='flex items-center gap-3'>
            <div className='flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 text-purple-700'>
              <Icons.edit className='h-4 w-4' />
            </div>
            <div>
              <DialogTitle className='text-base'>New Manual Campaign</DialogTitle>
              <DialogDescription className='text-xs'>Add leads one by one</DialogDescription>
            </div>
          </div>
          <div className='flex justify-center pt-3'>
            <StepIndicator current={step} />
          </div>
        </DialogHeader>

        {/* Step content */}
        <div className='flex flex-1 flex-col overflow-hidden min-h-0'>
          {step === 0 && (
            <StepCampaignInfo
              name={name}
              description={description}
              onNameChange={setName}
              onDescriptionChange={setDescription}
              onNext={() => setStep(1)}
            />
          )}
          {step === 1 && (
            <StepAddLeads
              leads={leads}
              onChange={setLeads}
              onBack={() => setStep(0)}
              onNext={() => setStep(2)}
            />
          )}
          {step === 2 && (
            <StepReview
              name={name}
              description={description}
              leads={leads}
              onBack={() => setStep(1)}
              onSubmit={() => mutation.mutate()}
              isPending={mutation.isPending}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
