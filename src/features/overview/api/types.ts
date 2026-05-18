// ─── Dashboard KPI Stats ────────────────────────────────────────────────────

export interface KpiStat {
  label: string;
  value: number;
  previousValue: number;
  prefix?: string;
  suffix?: string;
  format?: 'number' | 'currency' | 'percentage';
}

// ─── Lead Source ─────────────────────────────────────────────────────────────

export interface LeadSourceStat {
  source: 'Facebook' | 'TikTok' | 'Website' | 'CSV/Manual';
  count: number;
  color: string;
  icon: string;
}

// ─── Status Breakdown ───────────────────────────────────────────────────────

export interface StatusBreakdown {
  status: string;
  count: number;
  color: string;
}

// ─── Call Outcome ───────────────────────────────────────────────────────────

export interface CallOutcomeStat {
  outcome: string;
  count: number;
  color: string;
}

// ─── Agent Performance ──────────────────────────────────────────────────────

export interface AgentPerformance {
  id: string;
  name: string;
  avatar?: string;
  totalLeads: number;
  leadsContacted: number;
  leadsPending: number;
  qualified: number;
  workingDeals: number;
  dealsClosed: number;
  futureProspects: number;
  lostDeals: number;
  didNotRespond: number;
  unqualified: number;
  totalRevenue: number;
  callsMade: number;
  avgResponseTime: string;
  rank: number;
}

// ─── Dashboard Response ─────────────────────────────────────────────────────

export interface PipelineStats {
  kpis: KpiStat[];
  leadSources: LeadSourceStat[];
  statusBreakdown: StatusBreakdown[];
  topAgents: AgentPerformance[];
  leaderboard: AgentPerformance[];
}

export interface ProductivityStats {
  callOutcomes: CallOutcomeStat[];
  meetingsDone: KpiStat;
  callAnswerRate: KpiStat;
  avgResponseTime: KpiStat;
  overdueTasks: KpiStat;
  topAgents: AgentPerformance[];
  leaderboard: AgentPerformance[];
}

export interface DashboardFilters {
  campaignId?: string;
  agentId?: string;
  dateRange?: string;
}
