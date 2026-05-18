import PageContainer from '@/components/layout/page-container';
import { getQueryClient } from '@/lib/query-client';
import { dehydrate, HydrationBoundary } from '@tanstack/react-query';
import { pipelineQueryOptions, productivityQueryOptions } from '@/features/overview/api/queries';
import { Suspense } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardOverview } from '@/features/overview/components/overview';

export const metadata = { title: 'Dashboard — Jilani Properties CRM' };

const filters = {};

export default async function OverviewPage() {
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery(pipelineQueryOptions(filters));
  void queryClient.prefetchQuery(productivityQueryOptions(filters));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PageContainer
        scrollable
        pageTitle='Dashboard'
        pageDescription='Pipeline overview for Jilani Properties'
      >
        <Suspense fallback={<DashboardSkeleton />}>
          <DashboardOverview filters={filters} />
        </Suspense>
      </PageContainer>
    </HydrationBoundary>
  );
}

function DashboardSkeleton() {
  return (
    <div className='space-y-5'>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-5'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className='h-24 rounded-xl' />
        ))}
      </div>
      <div className='grid gap-4 lg:grid-cols-3'>
        <Skeleton className='h-72 rounded-xl' />
        <Skeleton className='col-span-2 h-72 rounded-xl' />
      </div>
      <div className='grid gap-4 md:grid-cols-2'>
        <Skeleton className='h-56 rounded-xl' />
        <Skeleton className='h-56 rounded-xl' />
      </div>
      <Skeleton className='h-64 rounded-xl' />
    </div>
  );
}
