import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { storefrontApi } from '../../../shared/api';

export const StorefrontLayout = ({ children, onSearch, searchValue = '' }) => {
  const [shop, setShop] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [searchInput, setSearchInput] = useState(searchValue);
  const debounceRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadShop();
    updateCartCount();
    window.addEventListener('cartUpdated', updateCartCount);
    return () => window.removeEventListener('cartUpdated', updateCartCount);
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
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      const count = cart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  const handleSearchChange = (e) => {
    const val = e.target.value;
    setSearchInput(val);
    if (onSearch) {
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => onSearch(val), 400);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">


      {/* ── Main Header ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-screen-xl mx-auto px-6 py-5 flex items-center justify-between relative">

          {/* Left spacer for centering logo */}
          <div className="flex-1 lg:flex hidden">
          </div>

          {/* Logo - Centered Absolutely */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <Link to="/" className="flex items-center gap-2 group">
              {shop?.logo_url ? (
                <img src={shop.logo_url} alt={shop.name} className="h-8 w-8 rounded-full object-cover" />
              ) : null}
              <span className="text-xl md:text-2xl font-black tracking-widest text-gray-950 uppercase group-hover:opacity-75 transition-opacity font-sans">
                {shop?.name || 'Mağaza'}
              </span>
            </Link>
          </div>

          {/* Right Icons Action Tray */}
          <div className="flex items-center gap-1.5 ml-auto">
            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            <Link to="/profile" className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-800 relative">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 7a4 4 0 11-8 0 4 4 0 01-8 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </Link>

            <button className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </button>

            <Link to="/cart" className="relative p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-800">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute top-1 right-1 bg-gray-950 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>


      </header>

      {/* ── Main Content ── */}
      <main className="flex-1">{children}</main>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 mt-16">
        <div className="max-w-screen-xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <p className="text-white font-bold text-lg uppercase tracking-wide mb-3">
              {shop?.name || 'Mağaza'}
            </p>
            <p className="text-sm leading-relaxed">
              {shop?.description || 'Azərbaycanda keyfiyyətli məhsullar.'}
            </p>
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Əlaqə</p>
            <div className="space-y-2 text-sm">
              {shop?.phone && <a href={`tel:${shop.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">📞 {shop.phone}</a>}
              {shop?.email && <a href={`mailto:${shop.email}`} className="flex items-center gap-2 hover:text-white transition-colors">✉️ {shop.email}</a>}
              {shop?.address && <p className="flex items-center gap-2">📍 {shop.address}</p>}
              {!shop?.phone && !shop?.email && !shop?.address && <p className="text-gray-600">—</p>}
            </div>
          </div>

          {/* Payment */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Ödəniş</p>
            <div className="flex flex-wrap gap-2">
              {shop?.allow_cod && <span className="px-3 py-1 border border-gray-700 text-xs rounded text-gray-300">💵 Qapıda Ödəniş</span>}
              {shop?.allow_online_payment && <span className="px-3 py-1 border border-gray-700 text-xs rounded text-gray-300">💳 Kart</span>}
            </div>
          </div>
        </div>

        <div className="border-t border-gray-800 py-4">
          <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between text-xs text-gray-600">
            <span>© {new Date().getFullYear()} {shop?.name || 'Mağaza'}</span>
            <a href="https://1link.az" className="hover:text-gray-400 transition-colors">Powered by 1link.az 🇦🇿</a>
          </div>
        </div>
      </footer>
    </div>
  );
};