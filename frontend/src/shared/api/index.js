// Central API export point
// All API modules are re-exported here for easy importing

// ===== CLIENT INSTANCES =====
export { apiClient, authClient, storefrontClient } from './client';

// ===== API MODULES =====

// Auth API (login, register, logout)
export { authApi } from './auth';

// Admin API (shops, products, orders management)
export { adminApi } from './admin';

// Storefront API (customer-facing shop queries)
export { storefrontApi } from './storefront';

// Note: Old API files (shops.js, products.js, orders.js) have been
// consolidated into admin.js for better maintainability and consistency