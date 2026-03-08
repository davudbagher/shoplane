import { apiClient } from './client';
/**
 * Shops API (Admin)
 * Connects to FastAPI /admin/shops endpoints
 */

export const shopsApi = {
  /**
   * Create new shop
   * POST /admin/shops
   */
  createShop: async (shopData) => {
    const response = await apiClient.post('/admin/shops', shopData);
    return response.data;
  },

  /**
   * Get all user's shops
   * GET /admin/shops
   */
  getMyShops: async () => {
  const response = await apiClient.get('/admin/shops');
  console.log('getMyShops response:', response.data); // Debug log
  
  // Handle both array and object with shops key
  if (Array.isArray(response.data)) {
    return response.data;
  } else if (response.data.shops) {
    return response.data.shops;
  } else {
    return [];
  }
},

  /**
   * Get shop by ID
   * GET /admin/shops/{shop_id}
   */
  getShop: async (shopId) => {
    const response = await apiClient.get(`/admin/shops/${shopId}`);
    return response.data;
  },

  /**
   * Update shop
   * PUT /admin/shops/{shop_id}
   */
  updateShop: async (shopId, shopData) => {
    const response = await apiClient.put(`/admin/shops/${shopId}`, shopData);
    return response.data;
  },

  /**
   * Upgrade shop to PRO plan (79 AZN/month)
   * POST /admin/shops/{shop_id}/upgrade
   */
  upgradeShop: async (shopId) => {
    const response = await apiClient.post(`/admin/shops/${shopId}/upgrade`);
    return response.data;
  },

  /**
   * Deactivate shop
   * DELETE /admin/shops/{shop_id}
   */
  deactivateShop: async (shopId) => {
    const response = await apiClient.delete(`/admin/shops/${shopId}`);
    return response.data;
  },
};
