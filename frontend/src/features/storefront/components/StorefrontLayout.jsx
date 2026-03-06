import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { storefrontApi } from '../../../shared/api';

export const StorefrontLayout = ({ children }) => {
  const [shop, setShop] = useState(null);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    loadShop();
    updateCartCount();
  }, []);

  const loadShop = async () => {
    try {
      const shopData = await storefrontApi.getShop();
      setShop(shopData);
    } catch (err) {
      console.error('Failed to load shop:', err);
    }
  };

  const updateCartCount = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const count = cart.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo/Shop Name */}
            <Link to="/" className="flex items-center space-x-2">
              {shop?.logo_url ? (
                <img 
                  src={shop.logo_url} 
                  alt={shop.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 bg-primary-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {shop?.name?.charAt(0) || '🏪'}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {shop?.name || 'Mağaza'}
                </h1>
                {shop?.subdomain && (
                  <p className="text-xs text-gray-500">
                    {shop.subdomain}.1link.az
                  </p>
                )}
              </div>
            </Link>

            {/* Cart Icon */}
            <Link 
              to="/cart" 
              className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg 
                className="w-6 h-6 text-gray-700" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" 
                />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-danger-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>

          {/* Shop Description */}
          {shop?.description && (
            <p className="mt-2 text-sm text-gray-600 line-clamp-2">
              {shop.description}
            </p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Contact Info */}
          {(shop?.phone || shop?.email || shop?.address) && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Əlaqə</h3>
              <div className="space-y-2 text-sm text-gray-600">
                {shop.phone && (
                  <a 
                    href={`tel:${shop.phone}`}
                    className="flex items-center hover:text-primary-600"
                  >
                    📞 {shop.phone}
                  </a>
                )}
                {shop.email && (
                  <a 
                    href={`mailto:${shop.email}`}
                    className="flex items-center hover:text-primary-600"
                  >
                    ✉️ {shop.email}
                  </a>
                )}
                {shop.address && (
                  <p className="flex items-center">
                    📍 {shop.address}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Methods */}
          <div className="mb-6 pb-6 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-3">Ödəniş Üsulları</h3>
            <div className="flex flex-wrap gap-2">
              {shop?.allow_cod && (
                <span className="px-3 py-1 bg-success-100 text-success-700 rounded-full text-sm">
                  💵 Qapıda Ödəniş
                </span>
              )}
              {shop?.allow_online_payment && (
                <>
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm">
                    💳 Kart
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Powered by */}
          <div className="text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} {shop?.name || 'Mağaza'}</p>
            <p className="mt-1">
              Powered by{' '}
              <a 
                href="https://1link.az" 
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                1link.az
              </a>
              {' '}🇦🇿
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
