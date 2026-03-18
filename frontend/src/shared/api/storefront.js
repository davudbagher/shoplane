import axios from 'axios';

/**
 * Storefront API Client (Public - No Auth)
 * For customer-facing shop pages
 */

// Helper: Get shop subdomain from URL or default for dev
const getShopSubdomain = () => {
  const hostname = window.location.hostname;
  
  // Production: 1001xirdavat.1link.az
  if (hostname.includes('.1link.az')) {
    const subdomain = hostname.split('.1link.az')[0];
    console.log('🏪 Detected subdomain (production):', subdomain);
    return subdomain;
  }
  
  // Development: localhost or 192.168.x.x
  if (hostname === 'localhost' || hostname.startsWith('192.168') || hostname.startsWith('127.0.0.1')) {
    // Check localStorage for dev subdomain
    let devSubdomain = localStorage.getItem('dev_shop_subdomain');
    
    // Auto-fix old hardcoded default to point to the user's actual shop
    if (devSubdomain === '1001xirdavat') {
      devSubdomain = 'cheechak';
      localStorage.setItem('dev_shop_subdomain', 'cheechak');
    }
    
    if (!devSubdomain) {
      // Auto-set default for development
      console.warn('⚠️ No dev_shop_subdomain in localStorage, setting default: cheechak');
      localStorage.setItem('dev_shop_subdomain', 'cheechak');
      return 'cheechak';
    }
    
    console.log('🏪 Using dev subdomain:', devSubdomain);
    return devSubdomain;
  }
  
  console.error('❌ Cannot detect shop subdomain from hostname:', hostname);
  return null;
};

// Create storefront-specific axios instance
const storefrontClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
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
      console.log('✅ Request to:', config.url, 'with subdomain:', subdomain);
    } else {
      console.error('❌ No subdomain available for request:', config.url);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Interceptor: Log response errors
storefrontClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('❌ Storefront API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers
    });
    return Promise.reject(error);
  }
);

/**
 * Storefront API Methods
 */
export const storefrontApi = {
  /**
   * Get shop info
   * GET /storefront/shop
   */
  getShop: async () => {
    const response = await storefrontClient.get('/storefront/shop');
    return response.data;
  },

  /**
   * Get products with filters/pagination
   * GET /storefront/products
   */
  getProducts: async (params = {}) => {
    const response = await storefrontClient.get('/storefront/products', { params });
    return response.data;
  },

  /**
   * Get single product by ID
   * GET /storefront/products/{product_id}
   */
  getProduct: async (productId) => {
    const response = await storefrontClient.get(`/storefront/products/${productId}`);
    return response.data;
  },

  /**
   * Get available categories
   * GET /storefront/categories
   */
  getCategories: async () => {
    const response = await storefrontClient.get('/storefront/categories');
    return response.data;
  },

  /**
   * Create order (checkout)
   * POST /storefront/orders
   */
  createOrder: async (orderData) => {
    const response = await storefrontClient.post('/storefront/orders', orderData);
    return response.data;
  },

  /**
   * Track order
   * GET /storefront/orders/{order_number}?phone={phone}
   */
  trackOrder: async (orderNumber, phone) => {
    const response = await storefrontClient.get(`/storefront/orders/${orderNumber}`, {
      params: { phone }
    });
    return response.data;
  },

  /**
   * Validate coupon code
   * POST /storefront/validate-coupon
   */
  validateCoupon: async (requestData) => {
    const response = await storefrontClient.post('/storefront/validate-coupon', requestData);
    return response.data;
  },
};

/**
 * Helper: Change shop subdomain (for testing multiple shops)
 */
export const setDevShopSubdomain = (subdomain) => {
  console.log('🔄 Changing dev shop to:', subdomain);
  localStorage.setItem('dev_shop_subdomain', subdomain);
  window.location.reload();
};