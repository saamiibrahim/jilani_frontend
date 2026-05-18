'use client';

import type { NavItem, NavGroup } from '@/types';
import { useAuth } from '@/lib/auth';
import type { UserRole } from '@/lib/auth';

/**
 * Role hierarchy for navigation visibility.
 * Maps access.role to which actual roles should see the item.
 */
const ROLE_ACCESS_MAP: Record<string, UserRole[]> = {
  admin: ['administrator'],
  head_of_sales: ['administrator', 'head_of_sales'],
  marketing_manager: ['administrator', 'head_of_sales', 'marketing_manager'],
  manager: ['administrator', 'head_of_sales', 'manager'],
  agent: ['administrator', 'head_of_sales', 'marketing_manager', 'manager', 'agent']
};

function canAccess(userRole: UserRole, requiredRole?: string): boolean {
  if (!requiredRole) return true; // No restriction
  if (userRole === 'administrator') return true; // Admin sees everything

  const allowedRoles = ROLE_ACCESS_MAP[requiredRole];
  if (!allowedRoles) return true;
  return allowedRoles.includes(userRole);
}

export function useFilteredNavItems(items: NavItem[]): NavItem[] {
  const { user } = useAuth();
  if (!user) return [];

  return items.filter((item) => {
    if (!item.access?.role) return true;
    return canAccess(user.role, item.access.role);
  });
}

export function useFilteredNavGroups(groups: NavGroup[]): NavGroup[] {
  const { user } = useAuth();
  if (!user) return [];

  return groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.access?.role) return true;
        return canAccess(user.role, item.access.role);
      })
    }))
    .filter((group) => group.items.length > 0);
}
