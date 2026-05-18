import { queryOptions } from '@tanstack/react-query';
import { getPipelineStats, getProductivityStats } from './service';
import type { DashboardFilters } from './types';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  pipeline: (filters: DashboardFilters) => [...dashboardKeys.all, 'pipeline', filters] as const,
  productivity: (filters: DashboardFilters) =>
    [...dashboardKeys.all, 'productivity', filters] as const
};

export const pipelineQueryOptions = (filters: DashboardFilters) =>
  queryOptions({
    queryKey: dashboardKeys.pipeline(filters),
    queryFn: () => getPipelineStats(filters),
    staleTime: 60 * 1000 // 1 minute
  });

export const productivityQueryOptions = (filters: DashboardFilters) =>
  queryOptions({
    queryKey: dashboardKeys.productivity(filters),
    queryFn: () => getProductivityStats(filters),
    staleTime: 60 * 1000
  });
