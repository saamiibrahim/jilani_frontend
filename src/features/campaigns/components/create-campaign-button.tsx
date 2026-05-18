'use client';

import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { campaignKeys } from '../api/queries';
import { createCampaign } from '../api/service';
import type { CampaignSource, CreateCampaignPayload } from '../api/types';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { ManualCampaignDialog } from './manual-campaign-sheet';

// ─── Source Options ───────────────────────────────────────────────────────────

const SOURCE_OPTIONS: {
  source: CampaignSource;
  label: string;
  description: string;
  icon: keyof typeof Icons;
  color: string;
}[] = [
  {
    source: 'facebook',
    label: 'Facebook Ads',
    description: 'Connect a Facebook Lead Ad form',
    icon: 'facebook',
    color: '#1877F2'
  },
  {
    source: 'tiktok',
    label: 'TikTok Ads',
    description: 'Connect a TikTok Lead Generation campaign',
    icon: 'tiktok',
    color: '#000000'
  },
  {
    source: 'website',
    label: 'Website Form',
    description: 'Embed our form on your website',
    icon: 'globe',
    color: '#10B981'
  },
  {
    source: 'csv',
    label: 'CSV Upload',
    description: 'Bulk import leads from a spreadsheet',
    icon: 'csv',
    color: '#6B7280'
  },
  {
    source: 'manual',
    label: 'Manual Entry',
    description: 'Add leads manually one by one',
    icon: 'edit',
    color: '#8B5CF6'
  }
];

// ─── Create Campaign Dialog ───────────────────────────────────────────────────

function CreateCampaignDialog({
  open,
  source,
  onOpenChange
}: {
  open: boolean;
  source: CampaignSource | null;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const srcOption = SOURCE_OPTIONS.find((s) => s.source === source);
  const Icon = srcOption ? Icons[srcOption.icon] : Icons.campaign;

  const mutation = useMutation({
    mutationFn: (payload: CreateCampaignPayload) => createCampaign(payload),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: campaignKeys.all });
      toast.success(`Campaign "${campaign.name}" created`);
      onOpenChange(false);
      setName('');
      setDescription('');
      router.push(`/dashboard/campaigns/${campaign.id}`);
    },
    onError: () => toast.error('Failed to create campaign')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!source || !name.trim()) return;
    mutation.mutate({ name: name.trim(), source, description });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <div className='flex items-center gap-3 mb-1'>
            {srcOption && (
              <div
                className='flex h-9 w-9 items-center justify-center rounded-lg text-white'
                style={{ backgroundColor: srcOption.color }}
              >
                <Icon className='h-5 w-5' />
              </div>
            )}
            <div>
              <DialogTitle>New {srcOption?.label ?? ''} Campaign</DialogTitle>
              <DialogDescription>{srcOption?.description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4 pt-2'>
          <div className='space-y-1.5'>
            <Label htmlFor='campaign-name'>Campaign Name</Label>
            <Input
              id='campaign-name'
              placeholder='e.g. Spring 2025 Facebook Drive'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className='space-y-1.5'>
            <Label htmlFor='campaign-desc'>
              Description <span className='text-muted-foreground font-normal'>(optional)</span>
            </Label>
            <Textarea
              id='campaign-desc'
              placeholder='Brief description of this campaign…'
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <div className='flex gap-2 pt-2'>
            <Button
              type='button'
              variant='outline'
              className='flex-1'
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' className='flex-1' disabled={mutation.isPending || !name.trim()}>
              {mutation.isPending ? (
                <Icons.spinner className='mr-2 h-4 w-4 animate-spin' />
              ) : (
                <Icons.add className='mr-2 h-4 w-4' />
              )}
              Create Campaign
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Create Campaign Button ───────────────────────────────────────────────────

export function CreateCampaignButton() {
  const [selectedSource, setSelectedSource] = useState<CampaignSource | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [manualSheetOpen, setManualSheetOpen] = useState(false);

  const handleSourceSelect = (source: CampaignSource) => {
    if (source === 'manual') {
      setManualSheetOpen(true);
    } else {
      setSelectedSource(source);
      setDialogOpen(true);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button>
            <Icons.add className='mr-2 h-4 w-4' />
            New Campaign
            <Icons.chevronDown className='ml-2 h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-60'>
          <DropdownMenuLabel>Choose a lead source</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {SOURCE_OPTIONS.map((option) => {
            const Icon = Icons[option.icon];
            return (
              <>
                <DropdownMenuItem
                  key={option.source}
                  onClick={() => handleSourceSelect(option.source)}
                  className='gap-3 py-2.5'
                >
                  {/* <div
                  className='flex h-7 w-7 flex-shrink-0 items-center justify-center rounded text-white'
                  style={{ backgroundColor: option.color }}
                >
                  <Icon className='h-3.5 w-3.5' />
                </div> */}
                  <div className='cursor-pointer'>
                    <p className='text-sm font-medium'>{option.label}</p>
                    <p className='text-muted-foreground text-xs'>{option.description}</p>
                  </div>
                </DropdownMenuItem>
              </>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Simple dialog for non-manual sources */}
      <CreateCampaignDialog
        open={dialogOpen}
        source={selectedSource}
        onOpenChange={setDialogOpen}
      />

      {/* Multi-step dialog for Manual Entry */}
      <ManualCampaignDialog open={manualSheetOpen} onOpenChange={setManualSheetOpen} />
    </>
  );
}
