import { supabase } from '../lib/supabase';
import { Token, SiteSettings, GoogleAuthCredentials, GoogleAuthConfig } from '../types';

// Site settings management
export const getSiteSettings = async (): Promise<SiteSettings> => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1)
      .single();

    if (error) {
      console.error('Error fetching site settings:', error);
      return {
        name: 'Unknown Household Access',
        logoUrl: '',
        backgroundVideo: null,
        transparency: 50
      };
    }

    return {
      name: data.name || 'Unknown Household Access',
      logoUrl: data.logo_url || '',
      backgroundVideo: data.background_video_url,
      transparency: data.transparency || 50
    };
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return {
      name: 'Unknown Household Access',
      logoUrl: '',
      backgroundVideo: null,
      transparency: 50
    };
  }
};

export const updateSiteSettings = async (settings: SiteSettings): Promise<boolean> => {
  try {
    const { data: existingSettings } = await supabase
      .from('site_settings')
      .select('id')
      .limit(1)
      .single();

    if (existingSettings) {
      const { error } = await supabase
        .from('site_settings')
        .update({
          name: settings.name,
          logo_url: settings.logoUrl,
          background_video_url: settings.backgroundVideo,
          transparency: settings.transparency,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingSettings.id);
      
      return !error;
    } else {
      const { error } = await supabase
        .from('site_settings')
        .insert([{
          name: settings.name,
          logo_url: settings.logoUrl,
          background_video_url: settings.backgroundVideo,
          transparency: settings.transparency
        }]);
      
      return !error;
    }
  } catch (error) {
    console.error('Error updating site settings:', error);
    return false;
  }
};

// Google Auth management
export const getGoogleAuthCredentials = async (): Promise<GoogleAuthCredentials[]> => {
  try {
    const { data, error } = await supabase
      .from('google_auth_credentials')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching Google Auth credentials:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching Google Auth credentials:', error);
    return [];
  }
};

export const addGoogleAuthCredentials = async (config: GoogleAuthConfig): Promise<boolean> => {
  try {
    const { web } = config;
    
    // Validate required fields
    if (!web.client_id || !web.project_id || !web.auth_uri || !web.token_uri || 
        !web.auth_provider_x509_cert_url || !web.client_secret || 
        !web.redirect_uris) {
      throw new Error('Missing required fields in Google Auth configuration');
    }

    // Ensure redirect_uri matches the Supabase Edge Function
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth-callback`;
    if (!web.redirect_uris.includes(edgeFunctionUrl)) {
      web.redirect_uris = [edgeFunctionUrl];
    }

    const { error } = await supabase
      .from('google_auth_credentials')
      .insert([{
        client_id: web.client_id,
        client_secret: web.client_secret,
        project_id: web.project_id,
        auth_uri: web.auth_uri,
        token_uri: web.token_uri,
        auth_provider_cert_url: web.auth_provider_x509_cert_url,
        redirect_uris: web.redirect_uris,
        javascript_origins: web.javascript_origins || [window.location.origin]
      }]);

    if (error) {
      console.error('Error adding Google Auth credentials:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error adding Google Auth credentials:', error);
    return false;
  }
};

export const addGoogleAuthCredentialsManually = async (credentials: {
  clientId: string;
  clientSecret: string;
  projectId: string;
}): Promise<boolean> => {
  try {
    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth-callback`;
    
    const { error } = await supabase
      .from('google_auth_credentials')
      .insert([{
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        project_id: credentials.projectId,
        auth_uri: 'https://accounts.google.com/o/oauth2/v2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        redirect_uris: [edgeFunctionUrl],
        javascript_origins: [window.location.origin]
      }]);

    if (error) {
      console.error('Error adding Google Auth credentials:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error adding Google Auth credentials manually:', error);
    return false;
  }
};

export const deleteGoogleAuthCredentials = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('google_auth_credentials')
      .delete()
      .eq('id', id);

    return !error;
  } catch (error) {
    console.error('Error deleting Google Auth credentials:', error);
    return false;
  }
};

export const authorizeGoogleAuth = async (id: string, clientId: string): Promise<string> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error('No valid session found');
    }

    // Store the auth token and session info
    const { error: updateError } = await supabase
      .from('google_auth_credentials')
      .update({ 
        auth_token: session.access_token,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (updateError) {
      throw new Error('Failed to update auth token');
    }

    const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-auth-callback`;
    
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.insert',
      'https://www.googleapis.com/auth/gmail.labels',
      'https://www.googleapis.com/auth/gmail.metadata',
      'https://www.googleapis.com/auth/gmail.settings.basic',
      'https://www.googleapis.com/auth/gmail.settings.sharing'
    ].join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('state', `${id}:${session.access_token}`);

    return authUrl.toString();
  } catch (error) {
    console.error('Error generating auth URL:', error);
    throw error;
  }
};

// Password validation
export const validatePasswordStrength = (password: string) => {
  const requirements = {
    minLength: password.length >= 8,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const isStrong = Object.values(requirements).every(Boolean);

  return {
    requirements,
    isStrong
  };
};

// Admin auth
export const verifyAdminCredentials = async (email: string, password: string) => {
  try {
    // Sign in with Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('Admin login error:', error);
      return false;
    }

    // Verify the user exists in admin_credentials
    const { data: adminData, error: adminError } = await supabase
      .from('admin_credentials')
      .select('id')
      .eq('email', email)
      .single();

    if (adminError || !adminData) {
      console.error('Admin verification error:', adminError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Admin login error:', error);
    return false;
  }
};

export const updateAdminCredentials = async (newPassword: string) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      return { success: false, error: 'No authenticated user found' };
    }

    // Update password in auth
    const { error: authError } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (authError) {
      return { success: false, error: authError.message || 'Failed to update password' };
    }

    // Get current password history
    const { data: adminData, error: adminCheckError } = await supabase
      .from('admin_credentials')
      .select('password_history')
      .eq('email', user.email)
      .single();

    if (adminCheckError) {
      return { success: false, error: 'Failed to retrieve password history' };
    }

    // Create new history entry and append to existing history
    const currentHistory = adminData?.password_history || [];
    const newHistoryEntry = {
      password: newPassword,
      changed_at: new Date().toISOString()
    };
    const updatedHistory = [...currentHistory, newHistoryEntry];

    // Update admin_credentials with the new password and updated history
    const { error: updateError } = await supabase
      .from('admin_credentials')
      .update({ 
        password: newPassword,
        updated_at: new Date().toISOString(),
        password_history: updatedHistory
      })
      .eq('email', user.email);

    if (updateError) {
      return { success: false, error: 'Failed to update password' };
    }

    return { success: true };
  } catch (error: any) {
    console.error('Admin update error:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred while updating the password'
    };
  }
};

// User token auth
export const verifyUserToken = async (token: string): Promise<{ isValid: boolean; message?: string }> => {
  if (!token || token.trim() === '') {
    return { isValid: false, message: 'Please enter an access token' };
  }

  try {
    // Check if token exists and get its status
    const { data: tokenData, error: tokenError } = await supabase
      .from('access_tokens')
      .select('blocked')
      .eq('value', token.trim())
      .maybeSingle();

    if (tokenError) {
      console.error('Token verification error:', tokenError);
      return { isValid: false, message: 'An error occurred while verifying the token' };
    }

    // If token doesn't exist
    if (!tokenData) {
      return { isValid: false, message: 'Invalid token. Please check your access token and try again.' };
    }

    // If token is blocked
    if (tokenData.blocked) {
      return { isValid: false, message: 'This token is blocked. Please contact your administrator.' };
    }

    return { isValid: true };
  } catch (error) {
    console.error('Token verification error:', error);
    return { isValid: false, message: 'An error occurred while verifying the token' };
  }
};

// Token management
export const getTokens = async (): Promise<Token[]> => {
  try {
    const { data, error } = await supabase
      .from('access_tokens')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tokens:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return [];
  }
};

export const addToken = async (token: string) => {
  if (!token || token.trim() === '') {
    return false;
  }

  try {
    const { data: existingToken, error: checkError } = await supabase
      .from('access_tokens')
      .select('id')
      .eq('value', token.trim())
      .maybeSingle();

    if (checkError) {
      console.error('Error checking token:', checkError);
      return false;
    }

    if (existingToken) {
      return false; // Token already exists
    }

    const { error } = await supabase
      .from('access_tokens')
      .insert([{ value: token.trim() }]);

    if (error) {
      console.error('Error adding token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error adding token:', error);
    return false;
  }
};

export const removeToken = async (token: string) => {
  if (!token || token.trim() === '') {
    return false;
  }

  try {
    const { error } = await supabase
      .from('access_tokens')
      .delete()
      .eq('value', token.trim());

    if (error) {
      console.error('Error removing token:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing token:', error);
    return false;
  }
};

export const toggleTokenBlock = async (token: string, shouldBlock: boolean) => {
  if (!token || token.trim() === '') {
    return false;
  }

  try {
    const { error } = await supabase
      .from('access_tokens')
      .update({ blocked: shouldBlock })
      .eq('value', token.trim());

    if (error) {
      console.error('Error toggling token block:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error toggling token block:', error);
    return false;
  }
};