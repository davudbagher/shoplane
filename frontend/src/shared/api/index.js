// Central API export point
// All API modules are re-exported here for easy importing

// Export client instances
export { apiClient, authClient, storefrontClient } from './client';

// Export API modules
export { authApi } from './auth';
export { adminApi } from './admin';          // ← Aggregate admin API (new!)
export { storefrontApi } from './storefront';

// Export individual admin modules (for direct access if needed)
export { shopsApi } from './shops';
export { productsApi } from './products';
export { ordersApi } from './orders';