import {
  createSearchParamsCache,
  createSerializer,
  parseAsInteger,
  parseAsString
} from 'nuqs/server';
import { LeadStatus, LeadSource, CallStatus, LeadLabel } from './types';

export const leadsSearchParams = {
  page: parseAsInteger.withDefault(1),
  limit: parseAsInteger.withDefault(20),
  search: parseAsString.withDefault(''),
  status: parseAsString.withDefault('all'),
  source: parseAsString.withDefault('all'),
  campaignId: parseAsString.withDefault('all'),
  assignedToId: parseAsString.withDefault('all')
};

export const leadsSearchParamsCache = createSearchParamsCache(leadsSearchParams);
export const serialize = createSerializer(leadsSearchParams);
