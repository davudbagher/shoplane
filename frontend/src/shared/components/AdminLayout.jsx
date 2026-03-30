import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useShopStore } from '../store/shopStore';

export const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Zustand Store
  const { shops, activeShopId, setActiveShop, fetchShops, clearStore, isLoading } = useShopStore();
  const activeShop = shops.find(s => s.id.toString() === activeShopId?.toString());

  useEffect(() => {
    if (shops.length === 0) {
      fetchShops();
    }
  }, []);

  const handleLogout = () => {
    clearStore();
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleShopChange = (e) => {
    const selectedId = e.target.value;
    if (selectedId === 'NEW_SHOP') {
      navigate('/admin/shops/new');
    } else {
      setActiveShop(selectedId);
      navigate(`/admin/shops/${selectedId}`);
    }
  };

  // Safe fallback path wrapper
  const activePath = (pathSuffix) => {
    return activeShopId ? `/admin/shops/${activeShopId}${pathSuffix}` : '/admin/dashboard';
  };

  const menuItems = [
    {
      section: 'Mağaza İdarəsi',
      items: [
        { 
          icon: '🏪', 
          label: 'Məhsul İdarəsi', 
          path: activePath(''),
          active: activeShopId && (location.pathname === `/admin/shops/${activeShopId}` || location.pathname.includes('/products'))
        },
        { 
          icon: '📦', 
          label: 'Sifariş İdarəsi', 
          path: activePath('/orders'),
          active: location.pathname.includes('/orders')
        },
        { 
          icon: '🎟️', 
          label: 'Kuponlar', 
          path: activePath('/coupons'),
          active: location.pathname.includes('/coupons')
        },
        { 
          icon: '📈', 
          label: 'Analitika', 
          path: activePath('/analytics'),
          active: location.pathname.includes('/analytics')
        },
      ]
    },
    {
      section: 'Digər',
      items: [
        { 
          icon: '⚙️', 
          label: 'Parametrlər', 
          path: activePath('/settings'),
          active: location.pathname.includes('/settings')
        },
      ]
    }
  ];

  // The Top Switcher Dropdown UI
  const ShopSwitcher = () => (
    <div className="px-4 py-4 border-b border-gray-50 bg-white">
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 block">
        Cari Mağaza
      </label>
      {isLoading ? (
        <div className="text-xs text-gray-400">Yüklənir...</div>
      ) : (
        <select 
          className="w-full bg-gray-50 text-gray-900 text-xs rounded-lg border-gray-100 focus:ring-1 focus:ring-black focus:border-black block p-2"
          value={activeShopId || ''}
          onChange={handleShopChange}
        >
          {shops.length === 0 && <option value="" disabled>Mağaza yoxdur</option>}
          {shops.map(shop => (
            <option key={shop.id} value={shop.id}>
              {shop.name}
            </option>
          ))}
          <option disabled>──────────</option>
          <option value="NEW_SHOP">✨ Yeni Mağaza Yarat</option>
        </select>
      )}
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-60 bg-white text-gray-900 border-r border-gray-100 overflow-hidden">
        {/* Shop Switcher sits at top now */}

        {/* Shop Switcher */}
        <ShopSwitcher />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-4">
          {menuItems.map((section, idx) => (
            <div key={idx}>
              <div className="px-3 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                {section.section}
              </div>
              <div className="space-y-0.5">
                {section.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    to={item.path}
                    className={`flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                      item.active
                        ? 'bg-black text-white shadow-sm'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <span className="text-base mr-2.5">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-50 p-4 bg-white flex-shrink-0">
          <div className="flex items-center mb-3">
            <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center text-white font-bold text-xs">
              {activeShop?.name?.charAt(0) || 'D'}
            </div>
            <div className="ml-3 overflow-hidden">
              <div className="text-xs font-bold text-gray-900 truncate">Admin</div>
              <div className="text-[10px] text-gray-400">Mağaza Sahibi</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors flex items-center"
          >
            <span className="mr-2">🚪</span>
            Çıxış
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <aside className="fixed inset-y-0 left-0 w-60 bg-white text-gray-900 flex flex-col shadow-xl">
            {/* Close Button Header for Mobile */}
            <div className="flex items-center justify-end h-14 bg-white border-b border-gray-50 px-4 flex-shrink-0">
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5"
              >
                ✕
              </button>
            </div>

            {/* Shop Switcher */}
            <ShopSwitcher />

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-4">
              {menuItems.map((section, idx) => (
                <div key={idx}>
                  <div className="px-3 mb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    {section.section}
                  </div>
                  <div className="space-y-0.5">
                    {section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                          item.active
                            ? 'bg-black text-white shadow-sm'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <span className="text-base mr-2.5">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
            
            {/* Mobile User Section */}
            <div className="border-t border-gray-50 p-4 bg-white flex-shrink-0">
              <button
                onClick={handleLogout}
                className="w-full px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-red-600 rounded-lg transition-colors flex items-center"
              >
                <span className="mr-2">🚪</span>
                Çıxış
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-100 h-14 flex items-center justify-center px-4 sm:px-6 flex-shrink-0 relative">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="absolute left-4 lg:hidden text-gray-600 hover:text-gray-900 p-1.5 rounded-md"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Centered Logo / Name */}
          <Link to={activePath('')} className="flex items-center">
            {activeShop?.logo_url && (
              <img src={activeShop.logo_url} alt={activeShop.name} className="h-6 w-6 rounded-full object-cover mr-2" />
            )}
            <span className="text-base font-black tracking-wider text-gray-900 uppercase">
              {activeShop?.name || 'MAĞAZA'}
            </span>
          </Link>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 sm:p-6 custom-scrollbar relative">
          {children}

          {/* ── EXPIRY BLOCKING POP-UP ── */}
          {activeShop?.subscription_status === 'expired' && (
            <div className="fixed inset-0 z-[100] bg-gray-900/40 backdrop-blur-md flex items-center justify-center p-4">
              <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100 animate-in zoom-in duration-300">
                <div className="p-10 text-center">
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-8">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  
                  <h2 className="text-3xl font-black text-gray-950 mb-4 tracking-tight uppercase">Ödəniş Tələb Olunur</h2>
                  <p className="text-gray-600 mb-8 leading-relaxed font-medium">
                    Abunəlik müddətiniz başa çatıb. Mağaza idarəsini davam etdirmək üçün abunəliyinizi yeniləməyiniz xahiş olunur. 
                  </p>
                  
                  <div className="bg-gray-50 rounded-2xl p-6 text-left mb-8 border border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                      🇦🇿
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Dəstək və Ödəniş</p>
                      <p className="text-lg font-black text-gray-900">+994 51 513 13 41</p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <a 
                      href="https://wa.me/994515131341" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                    >
                      <span>WhatsApp ilə əlaqə</span>
                    </a>
                    <button 
                      onClick={handleLogout}
                      className="text-gray-500 font-bold text-sm hover:text-gray-900 transition-colors py-2"
                    >
                      Çıxış et
                    </button>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">
                  1line.az — Şəffaf və Sürətli E-Ticarət
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};
