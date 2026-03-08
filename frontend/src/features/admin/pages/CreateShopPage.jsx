import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { adminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

export const CreateShopPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    description: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [subdomainAvailable, setSubdomainAvailable] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Auto-generate subdomain from shop name
    if (name === 'name') {
      const autoSubdomain = value
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 20);
      
      setFormData(prev => ({
        ...prev,
        name: value,
        subdomain: autoSubdomain,
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    // Clear error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name) {
      newErrors.name = 'Mağaza adı tələb olunur';
    }
    
    if (!formData.subdomain) {
      newErrors.subdomain = 'Subdomain tələb olunur';
    } else if (!/^[a-z0-9]+$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Yalnız kiçik hərflər və rəqəmlər istifadə edin';
    } else if (formData.subdomain.length < 3) {
      newErrors.subdomain = 'Minimum 3 simvol olmalıdır';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      const shop = await adminApi.createShop(formData);
      
      // Success! Redirect to dashboard or shop management
      navigate('/admin/dashboard');
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Mağaza yaradılarkən xəta baş verdi';
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Yeni Mağaza Yarat
          </h1>
          <p className="text-gray-600">
            Onlayn mağazanızı yaradın və məhsullarınızı satmağa başlayın
          </p>
        </div>

        {/* Form Card */}
        <div className="card">
          <div className="card-body p-8">
            {/* Error Alert */}
            {errors.submit && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-danger-700 text-sm">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Shop Name */}
              <Input
                label="Mağaza Adı"
                type="text"
                name="name"
                placeholder="Məsələn: Cheechak Gül Mağazası"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />

              {/* Subdomain */}
              <div className="mb-4">
                <label className="label">
                  Mağaza Linki (Subdomain) *
                </label>
                <div className="flex items-center">
                  <input
                    type="text"
                    name="subdomain"
                    value={formData.subdomain}
                    onChange={handleChange}
                    placeholder="cheechak"
                    className={`input-field rounded-r-none ${errors.subdomain ? 'input-error' : ''}`}
                    required
                  />
                  <span className="px-4 py-2 bg-gray-100 border border-l-0 border-gray-300 rounded-r-lg text-gray-600">
                    .1link.az
                  </span>
                </div>
                {errors.subdomain && (
                  <p className="error-message">{errors.subdomain}</p>
                )}
                {formData.subdomain && !errors.subdomain && (
                  <p className="mt-2 text-sm text-success-600">
                    ✓ Mağazanız bu linkdə olacaq: <strong>{formData.subdomain}.1link.az</strong>
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="mb-6">
                <label htmlFor="description" className="label">
                  Təsvir (İstəyə bağlı)
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Mağazanız haqqında qısa məlumat..."
                  rows="4"
                  className="input-field"
                />
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                >
                  {loading ? 'Yaradılır...' : 'Mağaza Yarat'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate('/admin/dashboard')}
                  disabled={loading}
                >
                  Ləğv Et
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h4 className="font-semibold text-primary-900 mb-2">
            💡 Məsləhət
          </h4>
          <ul className="text-sm text-primary-800 space-y-1">
            <li>• Subdomain yalnız kiçik hərflər və rəqəmlərdən ibarət olmalıdır</li>
            <li>• Qısa və yadda qalan ad seçin (məsələn: cheechak, fitbaku)</li>
            <li>• Subdomain yaradıldıqdan sonra dəyişdirilə bilməz</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};
