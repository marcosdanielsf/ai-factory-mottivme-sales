export interface User {
  user_id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  location_id: string;
  location_name: string;
  role: 'admin' | 'client' | 'viewer';
  custom_permissions?: Record<string, boolean> | null;
}

export interface Location {
  id: string;
  name: string;
}

export interface PendingInvite {
  id: string;
  email: string;
  location_id: string;
  location_name?: string;
  role: 'admin' | 'client' | 'viewer';
  expires_at: string;
  created_at: string;
  token: string;
}

export interface GroupedUser {
  user: User;
  locations: Array<{ location_id: string; location_name: string; role: string; custom_permissions?: Record<string, boolean> | null }>;
}
