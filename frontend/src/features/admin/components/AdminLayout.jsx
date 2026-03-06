import { useAuth } from '../../../shared/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-2xl mr-2">🇦🇿</span>
              <h1 className="text-2xl font-bold text-primary-700">1link.az</h1>
              <span className="ml-3 px-2 py-1 bg-primary-100 text-primary-700 text-xs font-medium rounded">
                Admin
              </span>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.full_name}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-danger-600 hover:text-danger-700 font-medium"
              >
                Çıxış
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-gray-500">
            © 2026 1link.az - Azərbaycan üçün E-ticarət Platforması
          </p>
        </div>
      </footer>
    </div>
  );
};
