'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────────────────

export type UserRole =
  | 'administrator'
  | 'head_of_sales'
  | 'marketing_manager'
  | 'manager'
  | 'agent';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  teamId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
  canAccessLeads: (scope: 'all' | 'team' | 'own') => boolean;
}

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Mock User (for development) ────────────────────────────────────────────

const MOCK_USER: AuthUser = {
  id: '1',
  name: 'Imran Javed',
  email: 'imran@jilaniproperties.com',
  role: 'administrator',
  avatar: undefined,
  teamId: 'team-1'
};

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(MOCK_USER);

  const login = useCallback(async (_email: string, _password: string) => {
    // TODO: Replace with real API call to Express.js backend
    // const response = await fetch('/api/auth/login', { ... });
    // const { token, user } = await response.json();
    // localStorage.setItem('token', token);
    setUser(MOCK_USER);
  }, []);

  const logout = useCallback(() => {
    // TODO: Clear JWT token
    // localStorage.removeItem('token');
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!user) return false;
      // Administrator always has access
      if (user.role === 'administrator') return true;
      return roles.includes(user.role);
    },
    [user]
  );

  const canAccessLeads = useCallback(
    (scope: 'all' | 'team' | 'own') => {
      if (!user) return false;
      switch (user.role) {
        case 'administrator':
        case 'head_of_sales':
          return true; // Can access all leads
        case 'manager':
          return scope !== 'all'; // Can access team + own
        case 'agent':
          return scope === 'own'; // Can access own only
        case 'marketing_manager':
          return false; // No direct lead access
        default:
          return false;
      }
    },
    [user]
  );

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, login, logout, hasRole, canAccessLeads }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// ─── Role Hierarchy Helpers ─────────────────────────────────────────────────

const ROLE_LABELS: Record<UserRole, string> = {
  administrator: 'Administrator',
  head_of_sales: 'Head of Sales',
  marketing_manager: 'Marketing Manager',
  manager: 'Manager',
  agent: 'Agent'
};

const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  administrator: 'Full access — manage users, settings, everything',
  head_of_sales: 'Can see all leads and create/manage campaigns, but cannot add users',
  marketing_manager: 'Can only create and manage campaigns',
  manager: "Can see only their team's leads, but cannot add users or create campaigns",
  agent: 'Can only work on and see leads assigned to them'
};

export const ALL_ROLES: UserRole[] = [
  'administrator',
  'head_of_sales',
  'marketing_manager',
  'manager',
  'agent'
];

export function getRoleLabel(role: UserRole): string {
  return ROLE_LABELS[role];
}

export function getRoleDescription(role: UserRole): string {
  return ROLE_DESCRIPTIONS[role];
}
