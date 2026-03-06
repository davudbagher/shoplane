import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { productsApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

export const CreateProductPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock_quantity: '',
    category: '',
    image_url: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name) newErrors.name = 'Məhsul adı tələb olunur';
    if (!formData.price) newErrors.price = 'Qiymət tələb olunur';
    if (formData.price && parseFloat(formData.price) <= 0) {
      newErrors.price = 'Qiymət 0-dan böyük olmalıdır';
    }
    if (!formData.stock_quantity) newErrors.stock_quantity = 'Stok miqdarı tələb olunur';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const productData = {
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity),
      };

      await productsApi.createProduct(shopId, productData);
      navigate(`/admin/shops/${shopId}`);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || 'Məhsul əlavə edilərkən xəta baş verdi';
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
            Yeni Məhsul Əlavə Et
          </h1>
          <p className="text-gray-600">Məhsul məlumatlarını daxil edin</p>
        </div>

        {/* Form Card */}
        <div className="card">
          <div className="card-body p-8">
            {errors.submit && (
              <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
                <p className="text-danger-700 text-sm">{errors.submit}</p>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Product Name */}
              <Input
                label="Məhsul Adı"
                type="text"
                name="name"
                placeholder="Məsələn: Qırmızı Qızılgül Dəstəsi"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                required
              />

              {/* Description */}
              <div className="mb-4">
                <label htmlFor="description" className="label">
                  Təsvir
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Məhsul haqqında ətraflı məlumat..."
                  rows="4"
                  className="input-field"
                />
              </div>

              {/* Price */}
              <div className="mb-4">
                <label htmlFor="price" className="label">
                  Qiymət (AZN) *
                </label>
                <div className="relative">
                  <input
                    id="price"
                    type="number"
                    name="price"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="29.99"
                    className={`input-field pr-12 ${errors.price ? 'input-error' : ''}`}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₼
                  </span>
                </div>
                {errors.price && <p className="error-message">{errors.price}</p>}
              </div>

              {/* Stock Quantity */}
              <Input
                label="Stok Miqdarı"
                type="number"
                name="stock_quantity"
                placeholder="100"
                value={formData.stock_quantity}
                onChange={handleChange}
                error={errors.stock_quantity}
                required
              />

              {/* Category */}
              <Input
                label="Kateqoriya (İstəyə bağlı)"
                type="text"
                name="category"
                placeholder="Məsələn: Güllər, Xırdavat, Geyim"
                value={formData.category}
                onChange={handleChange}
              />

              {/* Image URL */}
              <Input
                label="Şəkil URL (İstəyə bağlı)"
                type="url"
                name="image_url"
                placeholder="https://example.com/image.jpg"
                value={formData.image_url}
                onChange={handleChange}
              />

              {/* Buttons */}
              <div className="flex space-x-4">
                <Button type="submit" variant="primary" loading={loading} className="flex-1">
                  {loading ? 'Əlavə edilir...' : 'Məhsul Əlavə Et'}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => navigate(`/admin/shops/${shopId}`)}
                  disabled={loading}
                >
                  Ləğv Et
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Info */}
        <div className="mt-6 p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h4 className="font-semibold text-primary-900 mb-2">💡 Məsləhət</h4>
          <ul className="text-sm text-primary-800 space-y-1">
            <li>• Qiyməti AZN (Azərbaycan Manatı) ilə daxil edin</li>
            <li>• Yaxşı keyfiyyətli məhsul şəkli istifadə edin</li>
            <li>• Təsvirdə məhsulun xüsusiyyətlərini qeyd edin</li>
          </ul>
        </div>
      </div>
    </AdminLayout>
  );
};
