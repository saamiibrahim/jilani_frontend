import { getQueryClient } from '@/lib/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { campaignDetailQueryOptions } from '@/features/campaigns/api/queries';
import { leadsQueryOptions } from '@/features/leads/api/queries';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignDetail } from '@/features/campaigns/components/campaign-detail';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata(props: Props) {
  const { id } = await props.params;
  return { title: `Campaign — Jilani Properties CRM` };
}

export default async function CampaignDetailPage(props: Props) {
  const { id } = await props.params;
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(campaignDetailQueryOptions(id));
  void queryClient.prefetchQuery(leadsQueryOptions({ campaignId: id }));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageContainer scrollable>
        <div className='mb-4'>
          <Button variant='ghost' size='sm' asChild className='text-muted-foreground -ml-2'>
            <Link href='/dashboard/campaigns'>
              <Icons.chevronLeft className='mr-1 h-4 w-4' />
              Back to Campaigns
            </Link>
          </Button>
        </div>
        <Suspense fallback={<CampaignDetailSkeleton />}>
          <CampaignDetail id={id} />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}

function CampaignDetailSkeleton() {
  return (
    <div className='space-y-5'>
      <Skeleton className='h-20 w-full rounded-xl' />
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-24 rounded-xl' />
        ))}
      </div>
      <div className='grid gap-6 lg:grid-cols-3'>
        <Skeleton className='h-64 rounded-xl' />
        <Skeleton className='col-span-2 h-64 rounded-xl' />
      </div>
      <Skeleton className='h-80 rounded-xl' />
    </div>
  );
}
