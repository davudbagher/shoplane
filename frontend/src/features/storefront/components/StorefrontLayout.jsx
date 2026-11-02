import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { storefrontApi } from '../../../shared/api';
import { StorefrontCategoryBar } from './StorefrontCategoryBar';

export const StorefrontLayout = ({ children, onSearch, searchValue = '', categoryTree, allNames }) => {
  const [shop, setShop] = useState(null);
  const [shopLoading, setShopLoading] = useState(true);
  const [shopError, setShopError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchValue);
  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Determine primary color for category bar active state
  const primaryColor = shop?.primary_color || '#6366f1';

  useEffect(() => {
    loadShop();
    updateCartCount();
    updateFavCount();
    window.addEventListener('cartUpdated', updateCartCount);
    window.addEventListener('favoritesUpdated', updateFavCount);
    return () => {
      window.removeEventListener('cartUpdated', updateCartCount);
      window.removeEventListener('favoritesUpdated', updateFavCount);
    };
  }, []);

  // Sync external searchValue prop
  useEffect(() => {
    setSearchInput(searchValue);
  }, [searchValue]);

  // Auto-focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const loadShop = async () => {
    try {
      setShopLoading(true);
      setShopError(null);
      const shopData = await storefrontApi.getShop();
      console.log('✅ Shop data loaded:', shopData);
      setShop(shopData);
    } catch (err) {
      console.error('❌ Failed to load shop:', err);
      setShopError(err.response?.status === 404 ? 'not_found' : 'error');
    } finally {
      setShopLoading(false);
    }
  };

  const updateCartCount = () => {
    try {
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      setCartCount(cart.reduce((sum, item) => sum + item.quantity, 0));
    } catch {
      setCartCount(0);
    }
  };

  const updateFavCount = () => {
    try {
      const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavCount(favs.length);
    } catch {
      setFavCount(0);
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

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // If we're on the home page, onSearch handles it via debounce already
    // If on another page, navigate to home with search query
    if (location.pathname !== '/') {
      navigate(`/?search=${encodeURIComponent(searchInput)}`);
    }
    setSearchOpen(false);
  };

  const toggleSearch = useCallback(() => {
    setSearchOpen(prev => !prev);
  }, []);

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
            {shopLoading ? (
              // Loading skeleton
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse" />
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
              </div>
            ) : shopError ? (
              // Error state
              <div className="text-center">
                <p className="text-sm font-bold text-red-600">
                  {shopError === 'not_found' ? '🏪 Mağaza tapılmadı' : '⚠️ Xəta baş verdi'}
                </p>
              </div>
            ) : (
              // Shop loaded - show logo and name
              <Link to="/" className="flex items-center gap-2.5 group">
                {shop?.logo_url && shop.logo_url.trim() !== '' ? (
                  <img
                    src={shop.logo_url}
                    alt={shop.name}
                    className="h-8 w-8 rounded-full object-cover border border-gray-100 shadow-sm"
                    onError={(e) => { 
                      e.target.style.display = 'none';
                      // Show fallback icon when image fails
                      const fallback = document.createElement('span');
                      fallback.textContent = '🏪';
                      fallback.className = 'text-lg';
                      e.target.parentNode.insertBefore(fallback, e.target.nextSibling);
                    }}
                  />
                ) : (
                  <span className="text-lg">🏪</span>
                )}
                <span className="text-xl md:text-2xl font-black tracking-widest text-gray-950 uppercase group-hover:opacity-75 transition-opacity font-sans">
                  {shop?.name || 'Mağaza'}
                </span>
              </Link>
            )}
          </div>

          {/* Right Icons Action Tray */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Search Toggle */}
            <button
              onClick={toggleSearch}
              className={`p-2 rounded-full transition-colors ${searchOpen ? 'bg-gray-100 text-gray-900' : 'hover:bg-gray-50 text-gray-800'}`}
              aria-label="Axtar"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Favorites */}
            <Link to="/favorites" className="relative p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-800" aria-label="Sevimlilər">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full h-4 w-4 flex items-center justify-center leading-none">
                  {favCount}
                </span>
              )}
            </Link>

            {/* Instagram (if available) */}
            {shop?.instagram_url && !searchOpen && (
              <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer"
                className="p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-800"
                aria-label="Instagram">
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                </svg>
              </a>
            )}

            {/* Cart */}
            <Link to="/cart" className="relative p-2 hover:bg-gray-50 rounded-full transition-colors text-gray-800" aria-label="Səbət">
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

        {/* ── Search Bar (Slide Down) ── */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-in-out border-t border-gray-100 ${searchOpen ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0 border-t-0'}`}
        >
          <form onSubmit={handleSearchSubmit} className="max-w-screen-xl mx-auto px-6 py-3 flex items-center gap-3">
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Məhsul axtar..."
              className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 border-none outline-none focus:ring-0"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => {
                  setSearchInput('');
                  if (onSearch) onSearch('');
                }}
                className="text-gray-400 hover:text-gray-600 text-xs"
              >
                ✕
              </button>
            )}
            <button
              type="button"
              onClick={() => setSearchOpen(false)}
              className="text-xs text-gray-500 hover:text-gray-900 uppercase tracking-wider font-semibold"
            >
              Bağla
            </button>
          </form>
        </div>
      </header>

      {/* ── Category Bar (Top navigation) ── */}
      {categoryTree && categoryTree.categories?.length > 0 && (
        <StorefrontCategoryBar
          categories={categoryTree.categories}
          allNames={allNames}
          primaryColor={primaryColor}
          onSelect={(leafNames) => {
            // Pass subcategory filter up to parent via window event
            window.dispatchEvent(new CustomEvent('categoryFilterChange', { detail: leafNames }));
          }}
        />
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 relative">
        {children}

        {/* ── EXPIRY OVERLAY (The Pressure) ── */}
        {shop?.subscription_status === 'expired' && (
          <div className="fixed inset-0 z-[100] bg-white/60 backdrop-blur-md flex items-center justify-center p-6 text-center">
            <div className="max-w-md bg-white rounded-[40px] shadow-2xl border border-gray-100 p-10 md:p-14 animate-in fade-in zoom-in duration-500">
              <div className="w-20 h-20 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-8">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-gray-950 mb-4 uppercase tracking-tight italic">Xidmət Müvəqqəti Dayandırılıb</h2>
              <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                Bu mağaza daxili texniki yenilənmə və ya abunəlik müddətinin bitməsi səbəbindən müvəqqəti olaraq sifariş qəbul etmir. 
              </p>
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Mağaza sahibi ilə əlaqə</p>
                <div className="flex flex-col gap-2">
                   <a href={`tel:${shop?.phone}`} className="text-lg font-bold text-gray-900 border-2 border-gray-100 rounded-2xl py-3 hover:bg-gray-50 transition-colors">
                     {shop?.phone || 'Mağaza ilə əlaqə'}
                   </a>
                   <a href="https://1line.az" className="text-sm font-semibold text-primary-600 hover:underline">
                     Öz mağazanızı yaradın — 1line.az
                   </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 text-gray-400 mt-16">
        <div className="max-w-screen-xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            {shopLoading ? (
              <div className="h-6 w-40 bg-gray-800 rounded animate-pulse mb-3" />
            ) : (
              <>
                <p className="text-white font-bold text-lg uppercase tracking-wide mb-3">
                  {shop?.name || 'Mağaza'}
                </p>
                <p className="text-sm leading-relaxed">
                  {shop?.description || 'Azərbaycanda keyfiyyətli məhsullar.'}
                </p>
              </>
            )}
          </div>

          {/* Contact */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Əlaqə</p>
            {shopLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
                <div className="h-4 w-40 bg-gray-800 rounded animate-pulse" />
              </div>
            ) : (
              <div className="space-y-2 text-sm">
                {shop?.phone && <a href={`tel:${shop.phone}`} className="flex items-center gap-2 hover:text-white transition-colors">📞 {shop.phone}</a>}
                {shop?.email && <a href={`mailto:${shop.email}`} className="flex items-center gap-2 hover:text-white transition-colors">✉️ {shop.email}</a>}
                {shop?.address && <p className="flex items-center gap-2">📍 {shop.address}</p>}
                {!shop?.phone && !shop?.email && !shop?.address && <p className="text-gray-600">—</p>}
              </div>
            )}
          </div>

          {/* Payment */}
          <div>
            <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Ödəniş</p>
            {shopLoading ? (
              <div className="flex gap-2">
                <div className="h-6 w-20 bg-gray-800 rounded animate-pulse" />
                <div className="h-6 w-16 bg-gray-800 rounded animate-pulse" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {shop?.allow_cod && <span className="px-3 py-1 border border-gray-700 text-xs rounded text-gray-300">💵 Qapıda Ödəniş</span>}
                {shop?.allow_online_payment && <span className="px-3 py-1 border border-gray-700 text-xs rounded text-gray-300">💳 Kart</span>}
                {shop?.millikart_enabled && <span className="px-3 py-1 border border-indigo-500/40 text-xs rounded text-indigo-300">💳 MilliKart</span>}
              </div>
            )}
          </div>
        </div>

        {/* Social bar — only shown if shop has social links */}
        {!shopLoading && (shop?.instagram_url || shop?.whatsapp_number) && (
          <div className="border-t border-gray-800 py-4">
            <div className="max-w-screen-xl mx-auto px-6 flex items-center gap-4 text-sm">
              {shop?.instagram_url && (
                <a href={shop.instagram_url} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                  Instagram
                </a>
              )}
              {shop?.whatsapp_number && (
                <a href={`https://wa.me/${shop.whatsapp_number.replace(/[^0-9+]/g, '')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-400 hover:text-green-400 transition-colors">
                  💬 WhatsApp
                </a>
              )}
            </div>
          </div>
        )}

        <div className="border-t border-gray-800 py-4">
          <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-between text-xs text-gray-600">
            {shopLoading ? (
              <div className="h-4 w-32 bg-gray-800 rounded animate-pulse" />
            ) : (
              <span>© {new Date().getFullYear()} {shop?.name || 'Mağaza'}</span>
            )}
            <a href="https://1line.az" className="hover:text-gray-400 transition-colors">Powered by 1line.az 🇦🇿</a>
          </div>
        </div>
      </footer>
    </div>
  );
};