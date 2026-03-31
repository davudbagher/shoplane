import { apiClient } from './client';

/**
 * Super Admin API Module (The Kitchen)
 *
 * Used only by platform administrators to manage the entire Shoplane platform.
 * Requires JWT authentication (is_superuser required).
 */
export const superAdminApi = {
  /**
   * Upload an image file.
   */
  uploadImage: async (file) => {
    const response = await apiClient.post('/admin/upload', file, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  /**
   * Get all shops on the platform.
   */
  listAllShops: async () => {
    const response = await apiClient.get('/admin/super-admin/shops');
    return response.data;
  },

  /**
   * Get high-level platform statistics.
   */
  getStats: async () => {
    const response = await apiClient.get('/admin/super-admin/stats');
    return response.data;
  },

  /**
   * Onboard a new merchant (creates User + Shop).
   * @param {Object} data { email, full_name, shop_name, subdomain, plan_type }
   */
  onboardMerchant: async (data) => {
    const response = await apiClient.post('/admin/super-admin/onboard', data);
    return response.data;
  },

  /**
   * Manually renew a shop's subscription.
   * @param {number} shopId
   * @param {number} days
   */
  renewSubscription: async (shopId, days = 30) => {
    const response = await apiClient.post(`/admin/super-admin/shops/${shopId}/renew`, { days });
    return response.data;
  },

  /**
   * Toggle a hard "is_active" status for a shop.
   */
  toggleStatus: async (shopId) => {
    const response = await apiClient.post(`/admin/super-admin/shops/${shopId}/toggle-status`);
    return response.data;
  },

  /**
   * Get all merchant leads.
   */
  listLeads: async () => {
    const response = await apiClient.get('/admin/super-admin/leads');
    return response.data;
  },

  /**
   * Submit a new lead (Public - no auth required).
   */
  submitLead: async (data) => {
    const response = await apiClient.post('/admin/super-admin/leads', data);
    return response.data;
  },

  /**
   * Create a shop from an existing lead.
   * @param {number} leadId - The ID of the lead
   * @param {Object} payload - Optional payload (e.g., custom subdomain)
   */
  createShopFromLead: async (leadId, payload = {}) => {
    const response = await apiClient.post(`/admin/super-admin/leads/${leadId}/create-shop`, payload);
    return response.data;
  },

  /**
   * Delete/cancel a pending lead.
   * @param {number} leadId - The ID of the lead to delete
   */
  deleteLead: async (leadId) => {
    const response = await apiClient.delete(`/admin/super-admin/leads/${leadId}`);
    return response.data;
  }
};
