import axios from 'axios';

/**
 * Storefront API Client (Public - No Auth)
 * For customer-facing shop pages
 */

// Helper: Get shop subdomain from URL or env
export const getShopSubdomain = () => {
  const hostname = window.location.hostname;

  // Production: shop.1line.az
  if (hostname.includes('.1line.az')) {
    if (hostname === 'www.1line.az') return null;
    return hostname.split('.1line.az')[0];
  }

  // Development: ?shop=subdomain sets and sticks for the session
  const params = new URLSearchParams(window.location.search);
  const queryShop = params.get('shop');
  if (queryShop) {
    sessionStorage.setItem('dev_shop_subdomain', queryShop);
    return queryShop;
  }

  // Development: reuse shop set earlier in this session
  const sessionShop = sessionStorage.getItem('dev_shop_subdomain');
  if (sessionShop) return sessionShop;

  // Fallback: localStorage (legacy)
  return localStorage.getItem('dev_shop_subdomain') || null;
};

// Helper: Get API Base URL dynamically
const getApiBaseURL = () => {
  const hostname = window.location.hostname;
  
  // Production: Route to API subdomain on 1line.az
  if (hostname.includes('.1line.az')) {
    return 'https://api.1line.az';
  }
  
  // Development/Local Fallback
  return import.meta.env.VITE_API_URL || 'http://localhost:8000';
};

// Create storefront-specific axios instance
const storefrontClient = axios.create({
  baseURL: getApiBaseURL(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor: Add shop subdomain to every request
storefrontClient.interceptors.request.use(
  (config) => {
    const subdomain = getShopSubdomain();
    if (subdomain) {
      config.headers['X-Shop-Subdomain'] = subdomain;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Handle response errors
storefrontClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

/**
 * Storefront API Methods
 */
export const storefrontApi = {
  /** Get shop info — GET /storefront/shop */
  getShop: async () => {
    const response = await storefrontClient.get('/storefront/shop');
    return response.data;
  },

  /** Get products with filters/pagination — GET /storefront/products */
  getProducts: async (params = {}) => {
    const response = await storefrontClient.get('/storefront/products', { params });
    return response.data;
  },

  /** Get single product by ID — GET /storefront/products/{product_id} */
  getProduct: async (productId) => {
    const response = await storefrontClient.get(`/storefront/products/${productId}`);
    return response.data;
  },

  /** Get available categories — GET /storefront/categories */
  getCategories: async () => {
    const response = await storefrontClient.get('/storefront/categories');
    return response.data;
  },

  /** Get hierarchical categories tree — GET /storefront/categories/tree */
  getCategoryTree: async () => {
    const response = await storefrontClient.get('/storefront/categories/tree');
    return response.data;
  },

  /** Create order (checkout) — POST /storefront/orders */
  createOrder: async (orderData) => {
    const response = await storefrontClient.post('/storefront/orders', orderData);
    return response.data;
  },

  /** Track order — GET /storefront/orders/{order_number}?phone={phone} */
  trackOrder: async (orderNumber, phone) => {
    const response = await storefrontClient.get(`/storefront/orders/${orderNumber}`, {
      params: { phone }
    });
    return response.data;
  },

  /** Validate coupon code — POST /storefront/validate-coupon */
  validateCoupon: async (requestData) => {
    const response = await storefrontClient.post('/storefront/validate-coupon', requestData);
    return response.data;
  },
};

/**
 * Helper: Change shop subdomain (for testing multiple shops)
 */
export const setDevShopSubdomain = (subdomain) => {
  localStorage.setItem('dev_shop_subdomain', subdomain);
  window.location.reload();
};