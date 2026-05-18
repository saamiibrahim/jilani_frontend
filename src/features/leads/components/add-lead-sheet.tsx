'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { addManualLead } from '../api/service';
import { leadKeys } from '../api/queries';
import { campaignsQueryOptions } from '@/features/campaigns/api/queries';
import { toast } from 'sonner';

// ─── Agents list (mock — replace with real query later) ──────────────────────

const AGENTS = [
  { id: '1', name: 'Ali Yawar' },
  { id: '2', name: 'Hms Bhatti' },
  { id: '3', name: 'Imran Javed' },
  { id: '4', name: 'Saad Khan' },
  { id: '5', name: 'Farhan Ahmed' }
];

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  phone: string;
  email: string;
  campaignId: string;
  assignedToId: string;
  notes: string;
}

const INITIAL: FormState = {
  name: '',
  phone: '',
  email: '',
  campaignId: '',
  assignedToId: '',
  notes: ''
};

// ─── Component ────────────────────────────────────────────────────────────────

interface AddLeadSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCampaignId?: string;
}

export function AddLeadSheet({ open, onOpenChange, defaultCampaignId }: AddLeadSheetProps) {
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    campaignId: defaultCampaignId ?? ''
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const queryClient = useQueryClient();

  // useQuery (not Suspense) — handles loading gracefully in select
  const { data: campaignData } = useQuery(campaignsQueryOptions({}));
  const campaigns = campaignData?.campaigns ?? [];

  const selectedCampaign = campaigns.find((c) => c.id === form.campaignId);
  const selectedAgent = AGENTS.find((a) => a.id === form.assignedToId);

  const mutation = useMutation({
    mutationFn: () =>
      addManualLead({
        name: form.name,
        phone: form.phone,
        email: form.email || undefined,
        notes: form.notes || undefined,
        campaignId: form.campaignId,
        campaignName: selectedCampaign?.name ?? 'Unknown Campaign',
        assignedToId: form.assignedToId,
        assignedTo: selectedAgent?.name ?? 'Unassigned'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: leadKeys.all });
      toast.success(`Lead "${form.name}" added successfully`);
      setForm({ ...INITIAL, campaignId: defaultCampaignId ?? '' });
      onOpenChange(false);
    },
    onError: () => toast.error('Failed to add lead')
  });

  function validate(): boolean {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = 'Name is required';
    if (!form.phone.trim()) e.phone = 'Phone number is required';
    if (!form.campaignId) e.campaignId = 'Campaign is required';
    if (!form.assignedToId) e.assignedToId = 'Assign to an agent';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) mutation.mutate();
  }

  function field(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='flex w-full flex-col gap-0 p-0 sm:max-w-md' side='right'>
        <SheetHeader className='border-b px-6 py-4'>
          <div className='flex items-center gap-2'>
            <div className='bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-lg'>
              <Icons.add className='h-4 w-4' />
            </div>
            <div>
              <SheetTitle className='text-base'>Add New Lead</SheetTitle>
              <SheetDescription className='text-xs'>
                Enter lead details to add manually
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='flex flex-1 flex-col overflow-y-auto'>
          <div className='flex-1 space-y-5 p-6'>
            {/* Contact Info */}
            <div className='space-y-3'>
              <p className='text-muted-foreground text-xs font-semibold uppercase tracking-widest'>
                Contact Information
              </p>

              <div className='space-y-1.5'>
                <Label htmlFor='lead-name' className='text-sm'>
                  Full Name <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='lead-name'
                  placeholder='e.g. Asim Mehmood'
                  value={form.name}
                  onChange={(e) => field('name', e.target.value)}
                  className={errors.name ? 'border-red-400 focus-visible:ring-red-300' : ''}
                />
                {errors.name && <p className='text-xs text-red-500'>{errors.name}</p>}
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='lead-phone' className='text-sm'>
                  Phone Number <span className='text-red-500'>*</span>
                </Label>
                <Input
                  id='lead-phone'
                  placeholder='+92 300 1234567'
                  value={form.phone}
                  onChange={(e) => field('phone', e.target.value)}
                  className={errors.phone ? 'border-red-400 focus-visible:ring-red-300' : ''}
                />
                {errors.phone && <p className='text-xs text-red-500'>{errors.phone}</p>}
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='lead-email' className='text-sm'>
                  Email{' '}
                  <span className='text-muted-foreground text-xs font-normal'>(optional)</span>
                </Label>
                <Input
                  id='lead-email'
                  type='email'
                  placeholder='name@email.com'
                  value={form.email}
                  onChange={(e) => field('email', e.target.value)}
                />
              </div>
            </div>

            {/* Assignment */}
            <div className='space-y-3'>
              <p className='text-muted-foreground text-xs font-semibold uppercase tracking-widest'>
                Assignment
              </p>

              <div className='space-y-1.5'>
                <Label htmlFor='lead-campaign' className='text-sm'>
                  Campaign <span className='text-red-500'>*</span>
                </Label>
                <Select
                  value={form.campaignId}
                  onValueChange={(v) => field('campaignId', v)}
                  disabled={campaigns.length === 0}
                >
                  <SelectTrigger
                    id='lead-campaign'
                    className={`text-sm ${errors.campaignId ? 'border-red-400' : ''}`}
                  >
                    <SelectValue
                      placeholder={
                        campaigns.length === 0 ? 'Loading campaigns…' : 'Select campaign…'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {campaigns.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.campaignId && <p className='text-xs text-red-500'>{errors.campaignId}</p>}
              </div>

              <div className='space-y-1.5'>
                <Label htmlFor='lead-agent' className='text-sm'>
                  Assign To <span className='text-red-500'>*</span>
                </Label>
                <Select value={form.assignedToId} onValueChange={(v) => field('assignedToId', v)}>
                  <SelectTrigger
                    id='lead-agent'
                    className={`text-sm ${errors.assignedToId ? 'border-red-400' : ''}`}
                  >
                    <SelectValue placeholder='Select agent…' />
                  </SelectTrigger>
                  <SelectContent>
                    {AGENTS.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.assignedToId && (
                  <p className='text-xs text-red-500'>{errors.assignedToId}</p>
                )}
              </div>
            </div>

            {/* Notes */}
            <div className='space-y-1.5'>
              <Label htmlFor='lead-notes' className='text-sm'>
                Notes <span className='text-muted-foreground text-xs font-normal'>(optional)</span>
              </Label>
              <Textarea
                id='lead-notes'
                placeholder='e.g. Looking for 5 marla plot in DHA Phase 2, budget PKR 2.5M'
                rows={3}
                value={form.notes}
                onChange={(e) => field('notes', e.target.value)}
                className='text-sm resize-none'
              />
            </div>
          </div>

          {/* Footer */}
          <div className='border-t px-6 py-4 flex gap-3'>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type='submit' className='flex-1' disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Icons.spinner className='mr-1.5 h-3.5 w-3.5 animate-spin' />
                  Adding…
                </>
              ) : (
                <>
                  <Icons.add className='mr-1.5 h-3.5 w-3.5' />
                  Add Lead
                </>
              )}
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
}
