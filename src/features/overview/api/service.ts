import { delay } from '@/constants/mock-api';
import type { PipelineStats, ProductivityStats, DashboardFilters } from './types';

// ─── Mock Data ──────────────────────────────────────────────────────────────

const MOCK_AGENTS: AgentPerformance[] = [
  {
    id: '1',
    name: 'Ali Yawar',
    totalLeads: 55,
    leadsContacted: 34,
    leadsPending: 8,
    qualified: 12,
    workingDeals: 6,
    dealsClosed: 5,
    futureProspects: 4,
    lostDeals: 3,
    didNotRespond: 6,
    unqualified: 5,
    totalRevenue: 4500000,
    callsMade: 89,
    avgResponseTime: '12m',
    rank: 1
  },
  {
    id: '2',
    name: 'Hms Bhatti',
    totalLeads: 48,
    leadsContacted: 28,
    leadsPending: 12,
    qualified: 9,
    workingDeals: 5,
    dealsClosed: 4,
    futureProspects: 3,
    lostDeals: 2,
    didNotRespond: 5,
    unqualified: 4,
    totalRevenue: 3200000,
    callsMade: 67,
    avgResponseTime: '18m',
    rank: 2
  },
  {
    id: '3',
    name: 'Imran Javed',
    totalLeads: 42,
    leadsContacted: 22,
    leadsPending: 6,
    qualified: 7,
    workingDeals: 4,
    dealsClosed: 3,
    futureProspects: 2,
    lostDeals: 2,
    didNotRespond: 4,
    unqualified: 3,
    totalRevenue: 2800000,
    callsMade: 54,
    avgResponseTime: '15m',
    rank: 3
  },
  {
    id: '4',
    name: 'Saad Khan',
    totalLeads: 36,
    leadsContacted: 19,
    leadsPending: 10,
    qualified: 5,
    workingDeals: 3,
    dealsClosed: 2,
    futureProspects: 2,
    lostDeals: 1,
    didNotRespond: 4,
    unqualified: 2,
    totalRevenue: 1800000,
    callsMade: 45,
    avgResponseTime: '22m',
    rank: 4
  },
  {
    id: '5',
    name: 'Farhan Ahmed',
    totalLeads: 28,
    leadsContacted: 15,
    leadsPending: 5,
    qualified: 4,
    workingDeals: 2,
    dealsClosed: 1,
    futureProspects: 1,
    lostDeals: 1,
    didNotRespond: 3,
    unqualified: 2,
    totalRevenue: 950000,
    callsMade: 38,
    avgResponseTime: '25m',
    rank: 5
  }
];

export async function getPipelineStats(_filters: DashboardFilters): Promise<PipelineStats> {
  await delay(600);

  return {
    kpis: [
      {
        label: 'Total Leads',
        value: 127,
        previousValue: 113,
        format: 'number'
      },
      {
        label: 'Contacted',
        value: 89,
        previousValue: 76,
        format: 'number'
      },
      {
        label: 'Pending',
        value: 38,
        previousValue: 45,
        format: 'number'
      },
      {
        label: 'Closed',
        value: 14,
        previousValue: 11,
        format: 'number'
      },
      {
        label: 'Total Value',
        value: 12500000,
        previousValue: 9800000,
        prefix: 'PKR',
        format: 'currency'
      }
    ],
    leadSources: [
      { source: 'Facebook', count: 52, color: '#1877F2', icon: 'facebook' },
      { source: 'TikTok', count: 34, color: '#000000', icon: 'tiktok' },
      { source: 'Website', count: 27, color: '#10B981', icon: 'globe' },
      { source: 'CSV/Manual', count: 14, color: '#6B7280', icon: 'csv' }
    ],
    statusBreakdown: [
      { status: 'Unprocessed', count: 23, color: '#EF4444' },
      { status: 'Qualified', count: 31, color: '#22C55E' },
      { status: 'Working Deal', count: 18, color: '#3B82F6' },
      { status: 'Deal Closed', count: 14, color: '#8B5CF6' },
      { status: 'Lost Deal', count: 8, color: '#6B7280' },
      { status: 'Future Prospect', count: 12, color: '#06B6D4' },
      { status: 'Did Not Respond', count: 15, color: '#F59E0B' },
      { status: 'Unqualified', count: 6, color: '#DC2626' }
    ],
    topAgents: MOCK_AGENTS.slice(0, 3),
    leaderboard: MOCK_AGENTS
  };
}

export async function getProductivityStats(_filters: DashboardFilters): Promise<ProductivityStats> {
  await delay(600);

  return {
    callOutcomes: [
      { outcome: 'Answered', count: 64, color: '#22C55E' },
      { outcome: 'Did Not Respond', count: 38, color: '#F59E0B' },
      { outcome: 'Dead Number', count: 12, color: '#EF4444' }
    ],
    meetingsDone: {
      label: 'Meetings Done',
      value: 23,
      previousValue: 18,
      format: 'number'
    },
    callAnswerRate: {
      label: 'Call Answer Rate',
      value: 56,
      previousValue: 49,
      suffix: '%',
      format: 'percentage'
    },
    avgResponseTime: {
      label: 'Avg Response Time',
      value: 18,
      previousValue: 24,
      suffix: 'min',
      format: 'number'
    },
    overdueTasks: {
      label: 'Overdue Tasks',
      value: 7,
      previousValue: 12,
      format: 'number'
    },
    topAgents: MOCK_AGENTS.slice(0, 3),
    leaderboard: MOCK_AGENTS
  };
}
