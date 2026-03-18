/**
 * Admin API - Aggregates all admin-related API calls
 * Combines shops, products, and orders for easy importing
 */

import { apiClient } from './client';

const adminClient = apiClient; // Uses JWT auth token automatically

export const adminApi = {
  // ===== UPLOAD API =====
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await adminClient.post('/admin/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },
  
  // ===== SHOPS API =====
  
  // Get all shops for current user
  // Get all shops for current user
getShops: async () => {
  const response = await adminClient.get('/admin/shops');
  console.log('🔍 getShops response:', response.data);
  
  // Defensive: Handle array or wrapped object
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data && response.data.shops) {
    return response.data.shops;
  }
  
  return []; // Fallback to empty array
},
  
  // Get single shop by ID
  getShop: async (shopId) => {
    const response = await adminClient.get(`/admin/shops/${shopId}`);
    return response.data;
  },
  
  // Create new shop
  createShop: async (shopData) => {
    const response = await adminClient.post('/admin/shops', shopData);
    return response.data;
  },
  
  // Update shop
  updateShop: async (shopId, shopData) => {
    const response = await adminClient.put(`/admin/shops/${shopId}`, shopData);
    return response.data;
  },
  
  // Delete shop
  deleteShop: async (shopId) => {
    const response = await adminClient.delete(`/admin/shops/${shopId}`);
    return response.data;
  },
  
  // ===== PRODUCTS API =====
  
  // Get all products for a shop
  // Get products for a shop
getProducts: async (shopId) => {
  const response = await adminClient.get(`/admin/shops/${shopId}/products`);
  console.log('🔍 getProducts response:', response.data);
  
  // Defensive: Handle array or wrapped object
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data && response.data.products) {
    return response.data.products;
  } else if (response.data && response.data.data) {
    return response.data.data;
  }
  
  return []; // Fallback to empty array
},
  
  // Get single product
  getProduct: async (shopId, productId) => {
    const response = await adminClient.get(`/admin/shops/${shopId}/products/${productId}`);
    return response.data;
  },
  
  // Create product
  createProduct: async (shopId, productData) => {
    const response = await adminClient.post(`/admin/shops/${shopId}/products`, productData);
    return response.data;
  },
  
  // Update product
  updateProduct: async (shopId, productId, productData) => {
    const response = await adminClient.put(`/admin/shops/${shopId}/products/${productId}`, productData);
    return response.data;
  },
  
  // Delete product
  deleteProduct: async (shopId, productId) => {
    const response = await adminClient.delete(`/admin/shops/${shopId}/products/${productId}`);
    return response.data;
  },
  
  // ===== ORDERS API =====
  
  getOrders: async (shopId, params = {}) => {
    const response = await adminClient.get(`/admin/orders/${shopId}/orders`, { params });
    return response.data;
  },
  
  getOrder: async (shopId, orderId) => {
    const response = await adminClient.get(`/admin/orders/${shopId}/orders/${orderId}`);
    return response.data;
  },
  
  updateOrderStatus: async (shopId, orderId, statusData) => {
    const response = await adminClient.put(`/admin/orders/${shopId}/orders/${orderId}/status`, statusData);
    return response.data;
  },

  cancelOrder: async (shopId, orderId, reason) => {
    const response = await adminClient.post(`/admin/orders/${shopId}/orders/${orderId}/cancel`, null, {
      params: reason ? { reason } : undefined
    });
    return response.data;
  },

  getStats: async (shopId, days = 30) => {
    const response = await adminClient.get(`/admin/orders/${shopId}/stats`, { params: { days } });
    return response.data;
  },

  // ===== COUPONS API =====

  getCoupons: async (shopId) => {
    const response = await adminClient.get(`/admin/shops/${shopId}/coupons`);
    return response.data;
  },

  createCoupon: async (shopId, couponData) => {
    const response = await adminClient.post(`/admin/shops/${shopId}/coupons`, couponData);
    return response.data;
  },

  deleteCoupon: async (shopId, couponId) => {
    const response = await adminClient.delete(`/admin/shops/${shopId}/coupons/${couponId}`);
    return response.data;
  },
};
