import axios from 'axios';

// Create axios instance with default configuration
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Hardcoded API URL
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage if it exists
    const adminToken = localStorage.getItem('adminToken');
    const userToken = localStorage.getItem('userToken');
    
    // If token exists, add to headers
    if (adminToken) {
      config.headers.Authorization = `Bearer ${adminToken}`;
    } else if (userToken) {
      config.headers.Authorization = `Bearer ${userToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('API Error:', error);
    
    // Handle unauthorized responses (401)
    if (error.response && error.response.status === 401) {
      // Clear localStorage tokens
      localStorage.removeItem('adminToken');
      localStorage.removeItem('userToken');
      
      // Redirect to login if not already on login page
      if (!window.location.pathname.includes('/login') && 
          !window.location.pathname.includes('/token-login')) {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;

// Token API calls
export const tokenApi = {
  getAllTokens: () => api.get('/tokens'),
  createToken: (tokenData) => api.post('/tokens', tokenData),
  getTokenById: (id) => api.get(`/tokens/${id}`),
  updateTokenStatus: (id, status) => api.put(`/tokens/${id}/status`, { status }),
  deleteToken: (id) => api.delete(`/tokens/${id}`)
};

// Email API calls
export const emailApi = {
  searchByRecipient: (recipient) => api.get(`/emails/search?recipient=${encodeURIComponent(recipient)}`),
  getEmailStats: () => api.get('/emails/stats'),
  listEmails: (page = 1, limit = 20) => api.get(`/emails/list?page=${page}&limit=${limit}`)
};

// OAuth API calls
export const oauthApi = {
  getCredentials: () => api.get('/oauth/credentials'),
  saveCredentials: (credentials) => api.post('/oauth/credentials', credentials),
  generateOAuthUrl: () => api.get('/oauth/url'),
  handleCallback: (code) => api.get(`/oauth/callback?code=${code}`),
  deleteCredentials: () => api.delete('/oauth/credentials'),
  refreshToken: () => api.post('/oauth/refresh')
};

// Admin API calls
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getAdminLogs: (page = 1, limit = 20) => api.get(`/admin/logs?page=${page}&limit=${limit}`),
  getAdminAccount: () => api.get('/admin/account')
}; 