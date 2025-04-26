
export interface User {
  id: string;
  accessToken: string;
  isBlocked: boolean;
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
  access_token: string | null;
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
}

export interface Admin {
  username: string;
  password: string;
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
  addAccessToken: (token: string) => Promise<void>;
  deleteAccessToken: (id: string) => Promise<void>;
  blockAccessToken: (id: string, blocked: boolean) => Promise<void>;
  addGoogleConfig: (config: Omit<GoogleAuthConfig, "id" | "isActive">) => Promise<void>;
  updateGoogleConfig: (id: string, config: Partial<GoogleAuthConfig>) => Promise<void>;
  deleteGoogleConfig: (id: string) => Promise<void>;
  toggleEmailVisibility: (id: string) => Promise<void>;
  updateAdminCredentials: (username: string, password: string) => Promise<void>;
  updateEmailLimit: (limit: number) => void;
}
