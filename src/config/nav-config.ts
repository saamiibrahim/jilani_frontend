import { NavGroup } from '@/types';

/**
 * Jilani Properties CRM — Navigation Configuration
 *
 * RBAC Access Control (5 Roles):
 *   - Administrator: Full access
 *   - Head of Sales: All leads + campaigns, no user management
 *   - Marketing Manager: Campaigns only
 *   - Manager: Team's leads only
 *   - Agent: Assigned leads only
 *
 * Role-based filtering is handled in `src/hooks/use-nav.ts`
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        shortcut: ['d', 'd'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Manage',
    items: [
      {
        title: 'Campaigns',
        url: '/dashboard/campaigns',
        icon: 'campaign',
        shortcut: ['c', 'c'],
        isActive: false,
        items: [],
        access: { role: 'marketing_manager' } // Admin, HoS, Marketing Manager
      },
      {
        title: 'All Leads',
        url: '/dashboard/leads',
        icon: 'leads',
        shortcut: ['l', 'l'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Team',
    items: [
      {
        title: 'Users',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: [],
        access: { role: 'admin' } // Admin only
      }
    ]
  },
  {
    label: '',
    items: [
      {
        title: 'Settings',
        url: '/dashboard/settings',
        icon: 'settings',
        shortcut: ['s', 's'],
        isActive: false,
        items: [],
        access: { role: 'admin' } // Admin only
      }
    ]
  }
];
