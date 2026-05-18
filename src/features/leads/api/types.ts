// ─── Lead ────────────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'unprocessed'
  | 'qualified'
  | 'working_deal'
  | 'deal_closed'
  | 'lost_deal'
  | 'future_prospect'
  | 'did_not_respond'
  | 'unqualified';

export type LeadSource = 'facebook' | 'tiktok' | 'website' | 'csv' | 'manual';

export type CallStatus = 'answered' | 'did_not_respond' | 'dead_number' | 'not_called';

export type LeadLabel =
  | 'hot'
  | 'warm'
  | 'cold'
  | 'priority'
  | 'follow_up'
  | 'do_not_contact'
  | null;

// ─── Lead ────────────────────────────────────────────────────────────────────

export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: LeadSource;
  campaignId: string;
  campaignName: string;
  status: LeadStatus;
  callStatus: CallStatus;
  label: LeadLabel;
  assignedTo: string; // agent name
  assignedToId: string;
  notes?: string;
  callCount: number;
  lastCalledAt?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
  dealValue?: number;
  // Activity history
  activities: LeadActivity[];
  // Tasks
  tasks: LeadTask[];
}

export interface LeadTask {
  id: string;
  title: string;
  completed: boolean;
  dueDate?: string;
  type: 'call' | 'email' | 'meeting' | 'other';
}

export interface LeadActivity {
  id: string;
  type: 'call' | 'note' | 'status_change' | 'assignment' | 'meeting';
  description: string;
  createdAt: string;
  createdBy: string;
  callOutcome?: CallStatus;
  notes?: string;
}

export interface LeadFilters {
  search?: string;
  status?: LeadStatus;
  source?: LeadSource;
  campaignId?: string;
  assignedToId?: string;
  callStatus?: CallStatus;
  label?: LeadLabel;
  page?: number;
  limit?: number;
  sort?: string;
}

export interface LeadListResponse {
  leads: Lead[];
  total: number;
  page: number;
  limit: number;
}

// ─── Payloads ────────────────────────────────────────────────────────────────

export interface UpdateLeadStatusPayload {
  leadId: string;
  status: LeadStatus;
  notes?: string;
}

export interface LogCallPayload {
  leadId: string;
  callStatus: CallStatus;
  notes?: string;
  duration?: number; // seconds
}

export interface UpdateLeadPayload {
  name?: string;
  phone?: string;
  email?: string;
  status?: LeadStatus;
  label?: LeadLabel;
  assignedToId?: string;
  notes?: string;
}
