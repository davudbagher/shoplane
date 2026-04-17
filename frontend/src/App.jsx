import { Routes, Route, Navigate } from "react-router-dom";
import { LoginPage } from "./features/auth/pages";
import { DashboardPage } from "./features/admin/pages/DashboardPage";
import { CouponsPage } from "./features/admin/pages/CouponsPage";
import { CreateShopPage } from "./features/admin/pages/CreateShopPage";
import { ShopManagePage } from "./features/admin/pages/ShopManagePage";
import { CreateProductPage } from "./features/admin/pages/CreateProductPage";
import { EditProductPage } from "./features/admin/pages/EditProductPage";
import { ProductVariantsPage } from "./features/admin/pages/ProductVariantsPage";
import { OrdersPage } from "./features/admin/pages/OrdersPage";
import { OrderDetailPage } from "./features/admin/pages/OrderDetailPage";
import { ShopSettingsPage } from "./features/admin/pages/ShopSettingsPage";
import { ShopHomePage } from "./features/storefront/pages/ShopHomePage";
import { ProductDetailPage } from "./features/storefront/pages/ProductDetailPage";
import { CartPage } from "./features/storefront/pages/CartPage";
import { CheckoutPage } from './features/storefront/pages/CheckoutPage';
import { OrderConfirmationPage } from './features/storefront/pages/OrderConfirmationPage';
import { FavoritesPage } from './features/storefront/pages/FavoritesPage';
import { LandingPage } from './features/landing/pages/LandingPage';
import { PlatformDashboard } from './features/platform/pages/PlatformDashboard';
import { ProtectedRoute } from "./shared/components";
import { getShopSubdomain } from "./shared/api/storefront";

function App() {
  // Detect if we're on admin subdomain or path
  const isAdminRoute = window.location.pathname.startsWith('/admin') ||
    window.location.pathname.startsWith('/kitchen') ||
    window.location.pathname.startsWith('/login');

  const shopSubdomain = getShopSubdomain();
  const isLandingPage = shopSubdomain === null;

  return (
    <Routes>
      {/* ===== AUTH ROUTES (Public) ===== */}
      <Route path="/login" element={<LoginPage />} />

      {/* ===== STOREFRONT ROUTES (Public - Customer Facing) ===== */}
      <Route path="/" element={isLandingPage ? <LandingPage /> : <ShopHomePage />} />
      <Route path="/products/:productId" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/favorites" element={<FavoritesPage />} />
      <Route path="/orders/:orderNumber" element={<OrderConfirmationPage />} />

      {/* ===== PLATFORM ADMIN (The Kitchen) ===== */}
      <Route
        path="/kitchen"
        element={
          <ProtectedRoute>
            <PlatformDashboard />
          </ProtectedRoute>
        }
      />

      {/* ===== ADMIN ROUTES (Protected - Shop Owner) ===== */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/new"
        element={
          <ProtectedRoute>
            <CreateShopPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/:shopId"
        element={
          <ProtectedRoute>
            <ShopManagePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/:shopId/settings"
        element={
          <ProtectedRoute>
            <ShopSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/:shopId/orders"
        element={
          <ProtectedRoute>
            <OrdersPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/:shopId/coupons"
        element={
          <ProtectedRoute>
            <CouponsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/:shopId/orders/:orderId"
        element={
          <ProtectedRoute>
            <OrderDetailPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/:shopId/products/new"
        element={
          <ProtectedRoute>
            <CreateProductPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/:shopId/products/:productId/edit"
        element={
          <ProtectedRoute>
            <EditProductPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/shops/:shopId/products/:productId/variants"
        element={
          <ProtectedRoute>
            <ProductVariantsPage />
          </ProtectedRoute>
        }
      />

      {/* ===== FALLBACK ROUTES ===== */}
      {/* Catch unknown routes - redirect based on context */}
      <Route
        path="*"
        element={
          isAdminRoute
            ? <Navigate to="/admin/dashboard" replace />
            : <Navigate to="/" replace />
        }
      />
    </Routes>
  );
}

export default App;