import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.full_name) {
      newErrors.full_name = 'Ad və soyad tələb olunur';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email tələb olunur';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Düzgün email daxil edin';
    }
    
    if (!formData.phone) {
      newErrors.phone = 'Telefon nömrəsi tələb olunur';
    }
    
    if (!formData.password) {
      newErrors.password = 'Şifrə tələb olunur';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Şifrə minimum 6 simvol olmalıdır';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Şifrələr uyğun gəlmir';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    const { confirmPassword, ...userData } = formData;
    const result = await registerUser(userData);
    
    setLoading(false);
    
    if (result.success) {
      setSuccessMessage('Qeydiyyat uğurla tamamlandı! 3 saniyə ərzində giriş səhifəsinə yönləndiriləcəksiniz...');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setErrors({ submit: result.error });
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
            1link.az
          </h1>
          <p className="text-gray-600">
            Yeni Mağaza Yarat
          </p>
        </div>

        {/* Register Card */}
        <div className="card">
          <div className="card-body p-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Qeydiyyat
            </h2>

            {/* Success Alert */}
            {successMessage && (
              <div className="mb-6 p-4 bg-success-50 border border-success-200 rounded-lg">
                <p className="text-success-700 text-sm">{successMessage}</p>
              </div>
            )}

            {/* Error Alert */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-danger-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Register Form */}
            <form onSubmit={handleSubmit}>
              <Input
                label="Ad və Soyad"
                type="text"
                name="full_name"
                placeholder="Adınız Soyadınız"
                value={formData.full_name}
                onChange={handleChange}
                error={errors.full_name}
                required
              />

              <Input
                label="Email"
                type="email"
                name="email"
                placeholder="email@example.com"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
              />

              <Input
                label="Telefon"
                type="tel"
                name="phone"
                placeholder="+994501234567"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
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

              <Input
                label="Şifrəni Təsdiq Et"
                type="password"
                name="confirmPassword"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
              />

              <Button
                type="submit"
                variant="primary"
                loading={loading}
                className="w-full"
                disabled={successMessage}
              >
                {loading ? 'Qeydiyyat edilir...' : 'Qeydiyyatdan Keç'}
              </Button>
            </form>

            {/* Login Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Artıq hesabınız var?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Daxil ol
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
