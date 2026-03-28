import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { storefrontApi } from '../../../shared/api';

export const StorefrontLayout = ({ children, onSearch, searchValue = '' }) => {
  const [shop, setShop] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [favCount, setFavCount] = useState(0);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchValue);
  const debounceRef = useRef(null);
  const searchInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

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
      const shopData = await storefrontApi.getShop();
      setShop(shopData);
    } catch (err) {
      // Shop load failed silently
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
            <Link to="/" className="flex items-center gap-2.5 group">
              {shop?.logo_url && shop.logo_url.trim() !== '' && (
                <img
                  src={shop.logo_url}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover border border-gray-100 shadow-sm"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
              <span className="text-xl md:text-2xl font-black tracking-widest text-gray-950 uppercase group-hover:opacity-75 transition-opacity font-sans">
                {shop?.name || 'Mağaza'}
              </span>
            </Link>
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
            <a href="https://1line.az" className="hover:text-gray-400 transition-colors">Powered by 1line.az 🇦🇿</a>
          </div>
        </div>
      </footer>
    </div>
  );
};