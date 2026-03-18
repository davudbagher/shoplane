/**
 * API Client Configuration
 * Three specialized axios instances for different use cases
 */

import axios from 'axios';

// API Base URL - reads from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ===== 1. MAIN API CLIENT (Admin/Protected Routes with JWT) =====
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds (Azerbaijan internet can be slow)
});

// Request interceptor - Add JWT token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle 401 Unauthorized (token expired)
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      // Redirect to login if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (!error.response) {
      console.error('Network error - check if backend is running at', API_BASE_URL);
    }

    return Promise.reject(error);
  }
);

// ===== 2. AUTH CLIENT (Login/Register - No JWT Needed) =====
export const authClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded', // OAuth2 format
  },
  timeout: 15000,
});

// ===== 3. STOREFRONT CLIENT (Public Shop Access with Subdomain) =====
export const storefrontClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Add subdomain header to storefront requests automatically
storefrontClient.interceptors.request.use(
  (config) => {
    // Get subdomain from localStorage or URL query
    const subdomain = localStorage.getItem('subdomain') || 
                     new URLSearchParams(window.location.search).get('subdomain');
    
    if (subdomain) {
      config.headers['X-Shop-Subdomain'] = subdomain;
      console.log('🌐 Using dev subdomain:', subdomain);
    } else {
      // Production: Extract from hostname (e.g., 1001xirdavat.1line.az)
      const hostname = window.location.hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
        const subdomainFromHost = hostname.split('.')[0];
        if (subdomainFromHost !== '1link') { // Not the main domain
          config.headers['X-Shop-Subdomain'] = subdomainFromHost;
          console.log('🌐 Using subdomain from host:', subdomainFromHost);
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle network errors for storefront
storefrontClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      console.error('🔥 Storefront network error - check backend connection');
    }
    return Promise.reject(error);
  }
);