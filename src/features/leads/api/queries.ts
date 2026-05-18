import { queryOptions } from '@tanstack/react-query';
import { getLeads, getLeadById } from './service';
import type { LeadFilters } from './types';

export const leadKeys = {
  all: ['leads'] as const,
  list: (filters: LeadFilters) => [...leadKeys.all, 'list', filters] as const,
  detail: (id: string) => [...leadKeys.all, 'detail', id] as const
};

export const leadsQueryOptions = (filters: LeadFilters) =>
  queryOptions({
    queryKey: leadKeys.list(filters),
    queryFn: () => getLeads(filters),
    staleTime: 30 * 1000
  });

export const leadDetailQueryOptions = (id: string) =>
  queryOptions({
    queryKey: leadKeys.detail(id),
    queryFn: () => getLeadById(id),
    staleTime: 60 * 1000,
    enabled: !!id
  });
