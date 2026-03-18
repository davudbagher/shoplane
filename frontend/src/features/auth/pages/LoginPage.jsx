import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, error: authError } = useAuth();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email tələb olunur';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Düzgün email daxil edin';
    }
    
    if (!formData.password) {
      newErrors.password = 'Şifrə tələb olunur';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifrə minimum 6 simvol olmalıdır';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    const result = await login(formData.email, formData.password);
    
    setLoading(false);
    
    if (result.success) {
      // Redirect to admin dashboard
      navigate('/admin/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-5xl">🇦🇿</span>
          </div>
          <h1 className="text-4xl font-bold text-primary-700 mb-2">
            1line.az
          </h1>
          <p className="text-gray-600">
            Admin Panel - Mağaza İdarəetməsi
          </p>
        </div>

        {/* Login Card */}
        <div className="card">
          <div className="card-body p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Daxil Ol
            </h2>

            {/* Error Alert */}
            {authError && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-danger-700 text-sm">{authError}</p>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="mağaza@email.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />

              <Input
                label="Şifrə"
                type="password"
                name="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
              >
                {loading ? 'Daxil olunur...' : 'Daxil Ol'}
              </Button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Hesabınız yoxdur?{' '}
                <button
                  onClick={() => navigate('/register')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Qeydiyyatdan keç
                </button>
              </p>
            </div>
          </div>
        </div>

        {/* Demo Credentials (Remove in production!) */}
        <div className="mt-6 p-4 bg-warning-50 border border-warning-200 rounded-lg">
          <p className="text-sm text-warning-800 font-medium mb-2">
            🧪 Test üçün:
          </p>
          <p className="text-xs text-warning-700">
            Backend serveri işə salın: <code className="bg-warning-100 px-1 py-0.5 rounded">cd ~/shoplane/backend && uvicorn app.main:app --reload</code>
          </p>
        </div>
      </div>
    </div>
  );
};
