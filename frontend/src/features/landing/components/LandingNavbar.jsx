import { Link } from 'react-router-dom';

export const LandingNavbar = ({ onOpenModal }) => {
  return (
    <nav className="sticky top-0 w-full z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 text-white rounded-lg flex items-center justify-center text-xl shadow-md">
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                <path d="M12 2L2 7l10 5 10-5-10-5zm0 15.5l-10-5v-1l10 5 10-5v1l-10 5z"/>
                <path d="M12 22l-10-5v-3.5l10 5 10-5V17l-10 5z"/>
              </svg>
            </div>
            <span className="text-2xl font-black tracking-tight text-gray-900 uppercase">1line.az</span>
          </Link>

          {/* Navigation Links - using gap for guaranteed spacing */}
          <div className="hidden lg:flex items-center gap-10">
            <Link to="/platform" className="text-sm font-semibold text-gray-600 hover:text-indigo-600">Platform</Link>
            <Link to="/solutions" className="text-sm font-semibold text-gray-600 hover:text-indigo-600">Solutions</Link>
            <Link to="/resources" className="text-sm font-semibold text-gray-600 hover:text-indigo-600">Resources</Link>
            <Link to="/pricing" className="text-sm font-semibold text-gray-600 hover:text-indigo-600">Pricing</Link>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-6">
            <Link to="/login" className="text-sm font-semibold text-gray-600 hover:text-gray-900">
              Log in
            </Link>
            <button
              onClick={onOpenModal}
              className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold text-sm hover:bg-indigo-700 shadow-md"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};