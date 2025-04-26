export interface User {
  id: string;
  accessToken: string;
  isBlocked: boolean;
}

export interface Admin {
  username: string;
  password: string;
}

export interface GoogleAuthConfig {
  id: string;
  clientId: string;
  clientSecret: string;
  projectId: string;
  authUri: string;
  tokenUri: string;
  authProviderCertUrl: string;
  isActive: boolean;
  access_token?: string;
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
  rawMatch: any;
  isForwardedEmail: boolean;
  isCluster: boolean;
  isDomainForwarded: boolean;
  isImportant: boolean;
  isGrouped: boolean;
  isLargeCluster?: boolean;
  recipientCount?: number;
  rawContent?: string | null;
  rawHeaders?: string | null;
  forwardedData?: {
    fromEmail: string | null;
    fromName: string | null;
    date: string | null;
    subject: string | null;
    forwardedCount?: number;
    nestedLevel?: number;
    isNetflixRelated?: boolean;
    importantSections?: string[];
  } | null;
  forwardedContent?: Array<{
    from?: string;
    to?: string;
    subject?: string;
    date?: string;
    body?: string;
  }>;
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
  syncInterval: number;
  syncEnabled: boolean;
  updateSyncInterval: (interval: number) => void;
  toggleSync: (enabled: boolean) => void;
  clearEmailsFromLocalStorage: () => void;
  saveEmailsToLocalStorage: (emails: Email[]) => void;
  loadEmailsFromLocalStorage: () => Email[];
}
