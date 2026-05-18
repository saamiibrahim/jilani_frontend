// ─── Campaign ────────────────────────────────────────────────────────────────

export type CampaignSource = 'facebook' | 'tiktok' | 'website' | 'csv' | 'manual';
export type CampaignStatus = 'active' | 'paused' | 'completed' | 'draft';

// Per-campaign agent assignment
export interface CampaignAgent {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  active: boolean;
  leadsAssigned: number;
  leadsContacted: number;
}

// Lead status breakdown for a campaign
export interface LeadStatusBreakdown {
  qualified: number;
  workingDeal: number;
  dealClosed: number;
  lostDeal: number;
  futureProspect: number;
  didNotRespond: number;
  unqualified: number;
}

export interface Campaign {
  id: string;
  name: string;
  source: CampaignSource;
  status: CampaignStatus;
  totalLeads: number;
  contacted: number;
  pending: number;
  qualified: number;
  dealsClosed: number;
  budget?: number; // PKR
  createdAt: string;
  updatedAt: string;
  assignedTo?: string; // agent or team
  description?: string;
  // Extended detail fields
  leadStatusBreakdown?: LeadStatusBreakdown;
  agents?: CampaignAgent[];
}

export interface CampaignFilters {
  search?: string;
  source?: CampaignSource;
  status?: CampaignStatus;
  page?: number;
  limit?: number;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
  page: number;
  limit: number;
}

// ─── Payloads ────────────────────────────────────────────────────────────────

export type CreateCampaignPayload = Pick<Campaign, 'name' | 'source'> & {
  description?: string;
  budget?: number;
  assignedTo?: string;
};

// ─── Manual Lead Entry (for manual campaigns) ───────────────────────────────

export interface ManualLead {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
}
