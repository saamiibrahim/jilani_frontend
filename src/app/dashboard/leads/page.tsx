import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { leadsQueryOptions } from '@/features/leads/api/queries';
import { campaignsQueryOptions } from '@/features/campaigns/api/queries';
import { usersQueryOptions } from '@/features/users/api/queries';
import { leadsSearchParamsCache } from '@/features/leads/api/searchparams';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { LeadsTable } from '@/features/leads/components/leads-table';

export const metadata = {
  title: 'All Leads — Jilani Properties CRM'
};

export default async function LeadsPage(props: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const searchParams = await props.searchParams;
  const parsedParams = leadsSearchParamsCache.parse(searchParams);

  const filters = {
    page: parsedParams.page,
    limit: parsedParams.limit,
    search: parsedParams.search || undefined,
    status: parsedParams.status !== 'all' ? (parsedParams.status as any) : undefined,
    source: parsedParams.source !== 'all' ? (parsedParams.source as any) : undefined,
    campaignId: parsedParams.campaignId !== 'all' ? parsedParams.campaignId : undefined,
    assignedToId: parsedParams.assignedToId !== 'all' ? parsedParams.assignedToId : undefined
  };

  const queryClient = getQueryClient();
  // Prefetch leads + campaigns (needed for Add Lead dropdown)
  void queryClient.prefetchQuery(leadsQueryOptions(filters));
  void queryClient.prefetchQuery(campaignsQueryOptions({}));
  void queryClient.prefetchQuery(usersQueryOptions({}));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageContainer
        scrollable
        pageTitle='All Leads'
        pageDescription='View and manage leads across all campaigns'
      >
        <Suspense fallback={<LeadsTableSkeleton />}>
          <LeadsTable filters={filters} />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}

function LeadsTableSkeleton() {
  return (
    <div className='space-y-3'>
      <div className='flex gap-2'>
        <Skeleton className='h-9 w-64 rounded-md' />
        <Skeleton className='h-9 w-40 rounded-md' />
        <Skeleton className='h-9 w-36 rounded-md' />
        <Skeleton className='ml-auto h-9 w-24 rounded-md' />
      </div>
      <Skeleton className='h-[420px] w-full rounded-lg' />
    </div>
  );
}
