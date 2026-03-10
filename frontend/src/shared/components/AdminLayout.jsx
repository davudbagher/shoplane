import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';

export const AdminLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const menuItems = [
    {
      section: 'Main',
      items: [
        { 
          icon: '📊', 
          label: 'İdarə Paneli', 
          path: '/admin/dashboard',
          active: location.pathname === '/admin/dashboard'
        },
      ]
    },
    {
      section: 'Mağaza İdarəsi',
      items: [
        { 
          icon: '🏪', 
          label: 'Məhsul İdarəsi', 
          path: '/admin/store-management',
          active: location.pathname === '/admin/store-management'
        },
        { 
          icon: '📦', 
          label: 'Sifariş İdarəsi', 
          path: '/admin/order-management',
          active: location.pathname === '/admin/order-management'
        },
        { 
          icon: '📈', 
          label: 'Analitika', 
          path: '/admin/analytics',
          active: location.pathname === '/admin/analytics'
        },
        { 
          icon: '📋', 
          label: 'Hesabatlar', 
          path: '/admin/reports',
          active: location.pathname === '/admin/reports'
        },
      ]
    },
    {
      section: 'Digər',
      items: [
        { 
          icon: '💳', 
          label: 'Ödəniş Tarixçəsi', 
          path: '/admin/payment-history',
          active: location.pathname === '/admin/payment-history'
        },
        { 
          icon: '⚙️', 
          label: 'Parametrlər', 
          path: '/admin/settings',
          active: location.pathname === '/admin/settings'
        },
        { 
          icon: '❓', 
          label: 'Kömək Mərkəzi', 
          path: '/admin/help',
          active: location.pathname === '/admin/help'
        },
      ]
    }
  ];

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-gray-900 text-white">
        {/* Logo */}
        <div className="flex items-center justify-center h-16 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📦</span>
            <span className="text-xl font-bold">1link.az</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-3">
          {menuItems.map((section, idx) => (
            <div key={idx} className="mb-6">
              <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {section.section}
              </div>
              <div className="space-y-1">
                {section.items.map((item, itemIdx) => (
                  <Link
                    key={itemIdx}
                    to={item.path}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      item.active
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <span className="text-lg mr-3">{item.icon}</span>
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="border-t border-gray-700 p-4">
          <div className="flex items-center mb-3">
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              D
            </div>
            <div className="ml-3">
              <div className="text-sm font-medium">Davud Baghir</div>
              <div className="text-xs text-gray-400">Mağaza Sahibi</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg transition-colors flex items-center"
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
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setIsSidebarOpen(false)}
          ></div>
          <aside className="fixed inset-y-0 left-0 w-64 bg-gray-900 text-white">
            {/* Same content as desktop sidebar */}
            <div className="flex items-center justify-between h-16 bg-gray-800 border-b border-gray-700 px-4">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">📦</span>
                <span className="text-xl font-bold">1link.az</span>
              </div>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto py-6 px-3">
              {menuItems.map((section, idx) => (
                <div key={idx} className="mb-6">
                  <div className="px-3 mb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                    {section.section}
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item, itemIdx) => (
                      <Link
                        key={itemIdx}
                        to={item.path}
                        onClick={() => setIsSidebarOpen(false)}
                        className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                          item.active
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                      >
                        <span className="text-lg mr-3">{item.icon}</span>
                        {item.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-6">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Search Bar */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Axtar..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="absolute top-0 right-0 w-2 h-2 bg-danger-500 rounded-full"></span>
            </button>

            {/* User Menu */}
            <div className="hidden lg:block">
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                D
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};
