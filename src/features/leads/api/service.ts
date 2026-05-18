import { delay } from '@/constants/mock-api';
import type {
  Lead,
  LeadFilters,
  LeadListResponse,
  UpdateLeadStatusPayload,
  LogCallPayload,
  UpdateLeadPayload
} from './types';

// ─── In-memory store ─────────────────────────────────────────────────────────

let leads: Lead[] = [
  {
    id: 'lead-1',
    name: 'Asim Mehmood',
    phone: '+92 301 1234567',
    email: 'asim@email.com',
    source: 'facebook',
    campaignId: 'camp-1',
    campaignName: 'Spring 2025 Facebook Drive',
    status: 'qualified',
    callStatus: 'answered',
    label: 'hot',
    assignedTo: 'Ali Yawar',
    assignedToId: '1',
    notes: 'Looking for 5 marla plot in DHA Phase 2',
    callCount: 3,
    lastCalledAt: '2025-04-27T10:00:00Z',
    lastActivityAt: '2025-04-27T10:00:00Z',
    createdAt: '2025-04-20T09:00:00Z',
    updatedAt: '2025-04-27T10:00:00Z',
    activities: [
      {
        id: 'act-1',
        type: 'call',
        description: 'Called — answered, very interested',
        createdAt: '2025-04-27T10:00:00Z',
        createdBy: 'Ali Yawar',
        callOutcome: 'answered',
        notes: 'He wants to visit the site next week'
      },
      {
        id: 'act-2',
        type: 'status_change',
        description: 'Status changed to Qualified',
        createdAt: '2025-04-27T10:05:00Z',
        createdBy: 'Ali Yawar'
      }
    ],
    tasks: [
      {
        id: 't1',
        title: 'Schedule site visit with family',
        completed: false,
        type: 'meeting',
        dueDate: '2025-04-30'
      },
      {
        id: 't2',
        title: 'Send DHA Phase 2 pricing PDF',
        completed: true,
        type: 'email',
        dueDate: '2025-04-27'
      }
    ]
  },
  {
    id: 'lead-2',
    name: 'Kamran Iqbal',
    phone: '+92 333 9876543',
    source: 'tiktok',
    campaignId: 'camp-2',
    campaignName: 'TikTok Q2 Campaign',
    status: 'unprocessed',
    callStatus: 'not_called',
    label: null,
    assignedTo: 'Hms Bhatti',
    assignedToId: '2',
    callCount: 0,
    lastActivityAt: '2025-04-26T08:00:00Z',
    createdAt: '2025-04-26T08:00:00Z',
    updatedAt: '2025-04-26T08:00:00Z',
    activities: [],
    tasks: [{ id: 't3', title: 'Initial reach out call', completed: false, type: 'call' }]
  },
  {
    id: 'lead-3',
    name: 'Sana Rashid',
    phone: '+92 321 5554433',
    email: 'sana@example.com',
    source: 'website',
    campaignId: 'camp-3',
    campaignName: 'Website Inquiry Form',
    status: 'working_deal',
    callStatus: 'answered',
    label: 'warm',
    assignedTo: 'Imran Javed',
    assignedToId: '3',
    notes: 'Interested in 10 marla house in Bahria Town',
    callCount: 5,
    lastCalledAt: '2025-04-25T14:00:00Z',
    lastActivityAt: '2025-04-25T14:00:00Z',
    createdAt: '2025-04-10T09:00:00Z',
    updatedAt: '2025-04-25T14:00:00Z',
    activities: [
      {
        id: 'act-3',
        type: 'meeting',
        description: 'Site visit completed',
        createdAt: '2025-04-24T11:00:00Z',
        createdBy: 'Imran Javed',
        notes: 'Client liked the location, finalizing loan details'
      }
    ],
    tasks: [
      {
        id: 't4',
        title: 'Follow up on loan approval status',
        completed: false,
        type: 'call',
        dueDate: '2025-05-02'
      }
    ]
  },
  {
    id: 'lead-4',
    name: 'Tariq Hassan',
    phone: '+92 312 1112233',
    source: 'facebook',
    campaignId: 'camp-1',
    campaignName: 'Spring 2025 Facebook Drive',
    status: 'did_not_respond',
    callStatus: 'did_not_respond',
    label: 'cold',
    assignedTo: 'Ali Yawar',
    assignedToId: '1',
    callCount: 4,
    lastCalledAt: '2025-04-23T09:00:00Z',
    lastActivityAt: '2025-04-23T09:00:00Z',
    createdAt: '2025-04-15T10:00:00Z',
    updatedAt: '2025-04-23T09:00:00Z',
    activities: [
      {
        id: 'act-4',
        type: 'call',
        description: 'Called — no answer (attempt 4)',
        createdAt: '2025-04-23T09:00:00Z',
        createdBy: 'Ali Yawar',
        callOutcome: 'did_not_respond'
      }
    ],
    tasks: []
  },
  {
    id: 'lead-5',
    name: 'Nadia Farooq',
    phone: '+92 345 6677889',
    email: 'nadia@gmail.com',
    source: 'manual',
    campaignId: 'camp-5',
    campaignName: 'Walk-in Leads — Manual',
    status: 'deal_closed',
    callStatus: 'answered',
    label: 'priority',
    assignedTo: 'Ali Yawar',
    assignedToId: '1',
    notes: 'Bought 1 kanal plot. PKR 4.5M deal closed.',
    callCount: 8,
    lastCalledAt: '2025-04-22T13:00:00Z',
    lastActivityAt: '2025-04-22T13:00:00Z',
    createdAt: '2025-03-20T12:00:00Z',
    updatedAt: '2025-04-22T13:00:00Z',
    activities: [
      {
        id: 'act-5',
        type: 'status_change',
        description: 'Deal Closed! PKR 4.5M',
        createdAt: '2025-04-22T13:00:00Z',
        createdBy: 'Ali Yawar'
      }
    ],
    tasks: []
  }
];

// ─── Service ─────────────────────────────────────────────────────────────────

export async function getLeads(filters: LeadFilters): Promise<LeadListResponse> {
  await delay(500);

  let results = [...leads];

  if (filters.search) {
    const q = filters.search.toLowerCase();
    results = results.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.phone.includes(q) ||
        l.email?.toLowerCase().includes(q)
    );
  }
  if (filters.status) results = results.filter((l) => l.status === filters.status);
  if (filters.source) results = results.filter((l) => l.source === filters.source);
  if (filters.campaignId) results = results.filter((l) => l.campaignId === filters.campaignId);
  if (filters.assignedToId)
    results = results.filter((l) => l.assignedToId === filters.assignedToId);
  if (filters.callStatus) results = results.filter((l) => l.callStatus === filters.callStatus);
  if (filters.label !== undefined) results = results.filter((l) => l.label === filters.label);

  const total = results.length;
  const page = filters.page ?? 1;
  const limit = filters.limit ?? 20;
  const paginated = results.slice((page - 1) * limit, page * limit);

  return { leads: paginated, total, page, limit };
}

export async function getLeadById(id: string): Promise<Lead | null> {
  await delay(300);
  return leads.find((l) => l.id === id) ?? null;
}

export async function updateLeadStatus(payload: UpdateLeadStatusPayload): Promise<Lead> {
  await delay(400);
  const lead = leads.find((l) => l.id === payload.leadId);
  if (!lead) throw new Error(`Lead ${payload.leadId} not found`);

  lead.status = payload.status;
  lead.updatedAt = new Date().toISOString();
  lead.lastActivityAt = new Date().toISOString();
  lead.activities.unshift({
    id: `act-${Date.now()}`,
    type: 'status_change',
    description: `Status changed to ${payload.status}`,
    createdAt: new Date().toISOString(),
    createdBy: 'Current User',
    notes: payload.notes
  });

  return lead;
}

export async function logCall(payload: LogCallPayload): Promise<Lead> {
  await delay(400);
  const lead = leads.find((l) => l.id === payload.leadId);
  if (!lead) throw new Error(`Lead ${payload.leadId} not found`);

  lead.callStatus = payload.callStatus;
  lead.callCount += 1;
  lead.lastCalledAt = new Date().toISOString();
  lead.updatedAt = new Date().toISOString();
  lead.lastActivityAt = new Date().toISOString();
  lead.activities.unshift({
    id: `act-${Date.now()}`,
    type: 'call',
    description: `Called — ${payload.callStatus.replace('_', ' ')}`,
    createdAt: new Date().toISOString(),
    createdBy: 'Current User',
    callOutcome: payload.callStatus,
    notes: payload.notes
  });

  return lead;
}

export async function updateLead(id: string, payload: UpdateLeadPayload): Promise<Lead> {
  await delay(400);
  const lead = leads.find((l) => l.id === id);
  if (!lead) throw new Error(`Lead ${id} not found`);

  Object.assign(lead, payload, { updatedAt: new Date().toISOString() });
  return lead;
}

export async function addManualLead(data: {
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  campaignId: string;
  campaignName: string;
  assignedToId: string;
  assignedTo: string;
}): Promise<Lead> {
  await delay(500);
  const lead: Lead = {
    id: `lead-${Date.now()}`,
    name: data.name,
    phone: data.phone,
    email: data.email,
    source: 'manual',
    campaignId: data.campaignId,
    campaignName: data.campaignName,
    status: 'unprocessed',
    callStatus: 'not_called',
    label: null,
    assignedTo: data.assignedTo,
    assignedToId: data.assignedToId,
    notes: data.notes,
    callCount: 0,
    lastActivityAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activities: [
      {
        id: `act-${Date.now()}`,
        type: 'note',
        description: 'Lead added manually',
        createdAt: new Date().toISOString(),
        createdBy: 'Current User'
      }
    ],
    tasks: []
  };
  leads = [lead, ...leads];
  return lead;
}
