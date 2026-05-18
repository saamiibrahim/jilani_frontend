import { delay } from '@/constants/mock-api';
import type {
  Campaign,
  CampaignAgent,
  CampaignFilters,
  CampaignListResponse,
  CreateCampaignPayload,
  ManualLead
} from './types';

// ─── In-memory store ─────────────────────────────────────────────────────────

let campaigns: Campaign[] = [
  {
    id: 'camp-1',
    name: 'Spring 2025 Facebook Drive',
    source: 'facebook',
    status: 'active',
    totalLeads: 52,
    contacted: 38,
    pending: 14,
    qualified: 14,
    dealsClosed: 5,
    budget: 50000,
    createdAt: '2025-03-01T09:00:00Z',
    updatedAt: '2025-04-20T14:30:00Z',
    description: 'Facebook lead ads targeting Islamabad & Rawalpindi buyers',
    leadStatusBreakdown: {
      qualified: 14,
      workingDeal: 8,
      dealClosed: 5,
      lostDeal: 3,
      futureProspect: 6,
      didNotRespond: 7,
      unqualified: 9
    },
    agents: [
      {
        id: 'agent-1',
        name: 'Ali Yawar',
        email: 'ali@jilani.com',
        active: true,
        leadsAssigned: 28,
        leadsContacted: 20
      },
      {
        id: 'agent-2',
        name: 'Imran Javed',
        email: 'imran@jilani.com',
        active: true,
        leadsAssigned: 24,
        leadsContacted: 18
      }
    ]
  },
  {
    id: 'camp-2',
    name: 'TikTok Q2 Campaign',
    source: 'tiktok',
    status: 'active',
    totalLeads: 34,
    contacted: 22,
    pending: 12,
    qualified: 9,
    dealsClosed: 3,
    budget: 30000,
    createdAt: '2025-04-01T10:00:00Z',
    updatedAt: '2025-04-25T11:00:00Z',
    description: 'Short-form video ads for younger buyers',
    leadStatusBreakdown: {
      qualified: 9,
      workingDeal: 5,
      dealClosed: 3,
      lostDeal: 2,
      futureProspect: 4,
      didNotRespond: 6,
      unqualified: 5
    },
    agents: [
      {
        id: 'agent-1',
        name: 'Ali Yawar',
        email: 'ali@jilani.com',
        active: true,
        leadsAssigned: 34,
        leadsContacted: 22
      }
    ]
  },
  {
    id: 'camp-3',
    name: 'Website Inquiry Form',
    source: 'website',
    status: 'active',
    totalLeads: 27,
    contacted: 20,
    pending: 7,
    qualified: 8,
    dealsClosed: 4,
    createdAt: '2025-01-15T08:00:00Z',
    updatedAt: '2025-04-27T09:00:00Z',
    description: 'Organic leads from jilaniproperties.com contact forms',
    leadStatusBreakdown: {
      qualified: 8,
      workingDeal: 4,
      dealClosed: 4,
      lostDeal: 2,
      futureProspect: 3,
      didNotRespond: 4,
      unqualified: 2
    },
    agents: [
      {
        id: 'agent-3',
        name: 'Sara Khan',
        email: 'sara@jilani.com',
        active: true,
        leadsAssigned: 27,
        leadsContacted: 20
      }
    ]
  },
  {
    id: 'camp-4',
    name: 'Bahria Town CSV Import',
    source: 'csv',
    status: 'completed',
    totalLeads: 14,
    contacted: 14,
    pending: 0,
    qualified: 4,
    dealsClosed: 2,
    createdAt: '2025-02-10T10:00:00Z',
    updatedAt: '2025-03-15T16:00:00Z',
    description: 'Bulk import from Bahria Town expo attendees list',
    leadStatusBreakdown: {
      qualified: 4,
      workingDeal: 2,
      dealClosed: 2,
      lostDeal: 3,
      futureProspect: 1,
      didNotRespond: 1,
      unqualified: 1
    },
    agents: [
      {
        id: 'agent-2',
        name: 'Imran Javed',
        email: 'imran@jilani.com',
        active: false,
        leadsAssigned: 14,
        leadsContacted: 14
      }
    ]
  },
  {
    id: 'camp-5',
    name: 'Walk-in Leads — Manual',
    source: 'manual',
    status: 'active',
    totalLeads: 8,
    contacted: 6,
    pending: 2,
    qualified: 3,
    dealsClosed: 1,
    createdAt: '2025-03-20T12:00:00Z',
    updatedAt: '2025-04-26T15:00:00Z',
    description: 'Manually entered walk-in or referral leads',
    leadStatusBreakdown: {
      qualified: 3,
      workingDeal: 1,
      dealClosed: 1,
      lostDeal: 1,
      futureProspect: 1,
      didNotRespond: 0,
      unqualified: 1
    },
    agents: [
      {
        id: 'agent-1',
        name: 'Ali Yawar',
        email: 'ali@jilani.com',
        active: true,
        leadsAssigned: 8,
        leadsContacted: 6
      }
    ]
  }
];

// ─── Service ─────────────────────────────────────────────────────────────────

export async function getCampaigns(filters: CampaignFilters): Promise<CampaignListResponse> {
  await delay(500);

  let results = [...campaigns];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (c) => c.name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
    );
  }
  if (filters.source) results = results.filter((c) => c.source === filters.source);
  if (filters.status) results = results.filter((c) => c.status === filters.status);

  const total = results.length;
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const paginated = results.slice((page - 1) * limit, page * limit);

  return { campaigns: paginated, total, page, limit };
}

export async function getCampaignById(id: string): Promise<Campaign | null> {
  await delay(300);
  return campaigns.find((c) => c.id === id) ?? null;
}

export async function createCampaign(payload: CreateCampaignPayload): Promise<Campaign> {
  await delay(600);
  const campaign: Campaign = {
    id: `camp-${Date.now()}`,
    name: payload.name,
    source: payload.source,
    status: 'draft',
    totalLeads: 0,
    contacted: 0,
    pending: 0,
    qualified: 0,
    dealsClosed: 0,
    budget: payload.budget,
    description: payload.description,
    assignedTo: payload.assignedTo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    leadStatusBreakdown: {
      qualified: 0,
      workingDeal: 0,
      dealClosed: 0,
      lostDeal: 0,
      futureProspect: 0,
      didNotRespond: 0,
      unqualified: 0
    },
    agents: []
  };
  campaigns = [campaign, ...campaigns];
  return campaign;
}

export async function addManualLeads(
  campaignId: string,
  leads: ManualLead[]
): Promise<{ added: number }> {
  await delay(500);
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (campaign) {
    campaign.totalLeads += leads.length;
    campaign.pending += leads.length;
    campaign.updatedAt = new Date().toISOString();
  }
  return { added: leads.length };
}

export async function updateCampaignStatus(
  id: string,
  status: Campaign['status']
): Promise<Campaign> {
  await delay(400);
  const campaign = campaigns.find((c) => c.id === id);
  if (!campaign) throw new Error(`Campaign ${id} not found`);
  campaign.status = status;
  campaign.updatedAt = new Date().toISOString();
  return campaign;
}

export async function addAgentToCampaign(
  campaignId: string,
  agent: CampaignAgent
): Promise<Campaign> {
  await delay(300);
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
  campaign.agents = campaign.agents ?? [];
  const existing = campaign.agents.findIndex((a) => a.id === agent.id);
  if (existing === -1) {
    campaign.agents.push(agent);
  }
  campaign.updatedAt = new Date().toISOString();
  return campaign;
}

export async function removeAgentFromCampaign(
  campaignId: string,
  agentId: string
): Promise<Campaign> {
  await delay(300);
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
  campaign.agents = (campaign.agents ?? []).filter((a) => a.id !== agentId);
  campaign.updatedAt = new Date().toISOString();
  return campaign;
}

export async function toggleAgentActive(
  campaignId: string,
  agentId: string,
  active: boolean
): Promise<Campaign> {
  await delay(200);
  const campaign = campaigns.find((c) => c.id === campaignId);
  if (!campaign) throw new Error(`Campaign ${campaignId} not found`);
  const agent = (campaign.agents ?? []).find((a) => a.id === agentId);
  if (agent) agent.active = active;
  campaign.updatedAt = new Date().toISOString();
  return campaign;
}
