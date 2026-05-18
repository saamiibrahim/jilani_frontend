import { queryOptions } from '@tanstack/react-query';
import { getCampaigns, getCampaignById } from './service';
import type { CampaignFilters } from './types';

export const campaignKeys = {
  all: ['campaigns'] as const,
  list: (filters: CampaignFilters) => [...campaignKeys.all, 'list', filters] as const,
  detail: (id: string) => [...campaignKeys.all, 'detail', id] as const
};

export const campaignsQueryOptions = (filters: CampaignFilters) =>
  queryOptions({
    queryKey: campaignKeys.list(filters),
    queryFn: () => getCampaigns(filters),
    staleTime: 30 * 1000
  });

export const campaignDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: campaignKeys.detail(id),
    queryFn: () => getCampaignById(id),
    staleTime: 60 * 1000,
    enabled: !!id
  });
