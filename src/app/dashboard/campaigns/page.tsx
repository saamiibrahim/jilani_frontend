import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { getQueryClient } from '@/lib/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { campaignsQueryOptions } from '@/features/campaigns/api/queries';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CampaignsList } from '@/features/campaigns/components/campaigns-list';
import { CreateCampaignButton } from '@/features/campaigns/components/create-campaign-button';

export const metadata = {
  title: 'Campaigns — Jilani Properties CRM'
};

const filters = {};

export default async function CampaignsPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(campaignsQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageContainer>
        <div className='space-y-6'>
          <div className='flex items-center justify-between'>
            <Heading
              title='Campaigns'
              description='Manage and track your lead generation campaigns'
            />
            <CreateCampaignButton />
          </div>
          <Separator />

          <Suspense
            fallback={
              <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3'>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className='h-52 w-full rounded-xl' />
                ))}
              </div>
            }
          >
            <CampaignsList filters={filters} />
          </Suspense>
        </div>
      </PageContainer>
    </HydrationBoundary>
  );
}
