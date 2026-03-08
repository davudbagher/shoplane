import { apiClient } from './client';
/**
 * Orders API (Admin)
 * Connects to FastAPI /admin/orders endpoints
 */

export const ordersApi = {
  /**
   * Get all orders for shop
   * GET /admin/orders/{shop_id}/orders
   */
  getOrders: async (shopId, params = {}) => {
    const response = await apiClient.get(
      `/admin/orders/${shopId}/orders`,
      { params }
    );
    return response.data;
  },

  /**
   * Get order by ID
   * GET /admin/orders/{shop_id}/orders/{order_id}
   */
  getOrder: async (shopId, orderId) => {
    const response = await apiClient.get(
      `/admin/orders/${shopId}/orders/${orderId}`
    );
    return response.data;
  },

  /**
   * Update order status
   * PUT /admin/orders/{shop_id}/orders/{order_id}/status
   */
  updateOrderStatus: async (shopId, orderId, statusData) => {
    const response = await apiClient.put(
      `/admin/orders/${shopId}/orders/${orderId}/status`,
      statusData
    );
    return response.data;
  },

  /**
   * Get order statistics
   * GET /admin/orders/{shop_id}/stats
   */
  getOrderStats: async (shopId) => {
    const response = await apiClient.get(
      `/admin/orders/${shopId}/stats`
    );
    return response.data;
  },

  /**
   * Cancel order
   * POST /admin/orders/{shop_id}/orders/{order_id}/cancel
   */
  cancelOrder: async (shopId, orderId) => {
    const response = await apiClient.post(
      `/admin/orders/${shopId}/orders/${orderId}/cancel`
    );
    return response.data;
  },
};
