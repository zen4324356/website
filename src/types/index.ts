export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Admin {
  username: string;
  password: string;
}

export interface GoogleAuthConfig {
  id: string;
  client_id: string;
  client_secret: string;
  project_id: string | null;
  auth_uri: string;
  token_uri: string;
  auth_provider_cert_url: string;
  is_active: boolean;
  access_token: string | null;
  refresh_token: string | null;
  token_expiry: string | null;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isHidden: boolean;
  matchedIn: string;
  extractedRecipients: string[];
  rawMatch: string | null;
  isForwardedEmail: boolean;
  isCluster: boolean;
  isDomainForwarded: boolean;
  isImportant: boolean;
  isGrouped: boolean;
  source?: 'gmail_api' | 'server_database' | 'local_storage';
  sourceTag?: string;
  lastUpdated?: string;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: User | null;
  admin: Admin | null;
  login: (accessToken: string) => Promise<boolean>;
  adminLogin: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

export interface DataContextType {
  accessTokens: User[];
  googleConfigs: GoogleAuthConfig[];
  emails: Email[];
  emailLimit: number;
  fetchEmails: (emailId: string) => Promise<Email[]>;
  addAccessToken: (token: string) => void;
  deleteAccessToken: (id: string) => void;
  blockAccessToken: (id: string, blocked: boolean) => void;
  addGoogleConfig: (config: Omit<GoogleAuthConfig, "id" | "isActive">) => void;
  updateGoogleConfig: (id: string, config: Partial<GoogleAuthConfig>) => void;
  deleteGoogleConfig: (id: string) => void;
  toggleEmailVisibility: (id: string) => void;
  updateAdminCredentials: (username: string, password: string) => Promise<void>;
  updateEmailLimit: (limit: number) => void;
  defaultSearchEmail: string;
  updateDefaultSearchEmail: (email: string) => Promise<void>;
  autoRefreshInterval: number;
  autoRefreshEnabled: boolean;
  updateAutoRefreshInterval: (interval: number) => void;
  toggleAutoRefresh: (enabled: boolean) => void;
}

export interface AdminSettings {
  id: string;
  email_limit: number;
  auto_refresh_enabled: boolean;
  auto_refresh_interval: number;
  default_search_email: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerStorageStats {
  id: string;
  total_emails: number;
  storage_size: string;
  last_updated: string | null;
  created_at: string;
  updated_at: string;
}

export interface ServerEmail {
  id: string;
  domain: string;
  email_data: Email;
  created_at: string;
  updated_at: string;
}

export interface AccessToken {
  id: string;
  access_token: string;
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}
