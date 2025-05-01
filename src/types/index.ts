export interface Token {
  id: string;
  value: string;
  blocked: boolean;
  createdAt: string;
}

export interface User {
  type: 'user' | 'admin';
  token?: string;
  email?: string;
}

export interface AuthContextType {
  user: User | null;
  login: (type: 'admin' | 'user', credentials: { email?: string, password?: string, token?: string }) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface SiteSettings {
  name: string;
  logoUrl: string;
  backgroundVideo: string | null;
  transparency: number;
}

export interface GoogleAuthCredentials {
  id: string;
  client_id: string;
  client_secret: string;
  project_id: string;
  auth_uri: string;
  token_uri: string;
  auth_provider_cert_url: string;
  redirect_uris: string[];
  javascript_origins: string[];
  authorized: boolean;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
  created_at: string;
  updated_at: string;
}

export interface GoogleAuthConfig {
  web: {
    client_id: string;
    project_id: string;
    auth_uri: string;
    token_uri: string;
    auth_provider_x509_cert_url: string;
    client_secret: string;
    redirect_uris: string[];
    javascript_origins: string[];
  };
}