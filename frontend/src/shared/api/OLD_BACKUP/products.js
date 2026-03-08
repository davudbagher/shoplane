import { apiClient } from './client';
/**
 * Products API (Admin)
 * Connects to FastAPI /admin/shops/{shop_id}/products endpoints
 */

export const productsApi = {
  /**
   * Get all products for a shop
   * GET /admin/shops/{shop_id}/products
   */
  getProducts: async (shopId, params = {}) => {
    const response = await apiClient.get(`/admin/shops/${shopId}/products`, { params });
    return response.data.products || response.data || [];
  },

  /**
   * Get single product by ID
   * GET /admin/shops/{shop_id}/products/{product_id}
   */
  getProduct: async (shopId, productId) => {
    const response = await apiClient.get(`/admin/shops/${shopId}/products/${productId}`);
    return response.data;
  },

  /**
   * Create new product
   * POST /admin/shops/{shop_id}/products
   */
  createProduct: async (shopId, productData) => {
    const response = await apiClient.post(`/admin/shops/${shopId}/products`, productData);
    return response.data;
  },

  /**
   * Update product
   * PUT /admin/shops/{shop_id}/products/{product_id}
   */
  updateProduct: async (shopId, productId, productData) => {
    const response = await apiClient.put(`/admin/shops/${shopId}/products/${productId}`, productData);
    return response.data;
  },

  /**
   * Delete product
   * DELETE /admin/shops/{shop_id}/products/{product_id}
   */
  deleteProduct: async (shopId, productId) => {
    await apiClient.delete(`/admin/shops/${shopId}/products/${productId}`);
  },

  /**
   * Toggle product active/inactive
   * PATCH /admin/shops/{shop_id}/products/{product_id}/toggle
   */
  toggleProductStatus: async (shopId, productId) => {
    const response = await apiClient.patch(`/admin/shops/${shopId}/products/${productId}/toggle`);
    return response.data;
  },

  adjustStock: async (shopId, productId, adjustment) => {
    const response = await apiClient.post(
      `/admin/products/${shopId}/products/${productId}/adjust-stock`,
      { adjustment }
    );
    return response.data;
  },
};

