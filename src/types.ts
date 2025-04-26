export interface Email {
  id: string;
  from: string;
  to: string;
  subject: string;
  body: string;
  date: string;
  isRead: boolean;
  isHidden: boolean;
  matchedIn?: string;
  extractedRecipients?: string[];
  rawMatch?: any;
  isForwardedEmail?: boolean;
  isCluster?: boolean;
  isDomainForwarded?: boolean;
  isImportant?: boolean;
  isGrouped?: boolean;
}

export interface AccessToken {
  id: string;
  token: string;
  email: string;
  isBlocked: boolean;
  createdAt: string;
}

export interface GoogleConfig {
  id: string;
  email: string;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  createdAt: string;
}

export interface AdminCredentials {
  username: string;
  password: string;
}

export interface DataContextType {
  accessTokens: AccessToken[];
  googleConfigs: GoogleConfig[];
  emails: Email[];
  emailLimit: number;
  fetchEmails: (searchQuery: string) => Promise<Email[]>;
  addAccessToken: (token: AccessToken) => void;
  deleteAccessToken: (id: string) => void;
  blockAccessToken: (id: string, blocked: boolean) => Promise<void>;
  addGoogleConfig: (config: GoogleConfig) => void;
  updateGoogleConfig: (id: string, config: Partial<GoogleConfig>) => Promise<void>;
  deleteGoogleConfig: (id: string) => void;
  toggleEmailVisibility: (id: string) => void;
  updateAdminCredentials: (credentials: AdminCredentials) => void;
  updateEmailLimit: (limit: number) => void;
  defaultSearchEmail: string;
  updateDefaultSearchEmail: (email: string) => void;
  autoRefreshInterval: number;
  autoRefreshEnabled: boolean;
  updateAutoRefreshInterval: (interval: number) => void;
  toggleAutoRefresh: () => void;
  clearEmailsFromLocalStorage: () => void;
  saveEmailsToLocalStorage: (emails: Email[]) => void;
  loadEmailsFromLocalStorage: () => Email[];
} 