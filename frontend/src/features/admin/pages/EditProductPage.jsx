import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from '../../../shared/components';
import { adminApi } from "../../../shared/api";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";

export const EditProductPage = () => {
  const { shopId, productId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    inventory_count: "",
    category: "",
    image_url: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  useEffect(() => {
    loadProduct();
  }, [productId]);

  const loadProduct = async () => {
    try {
      setPageLoading(true);
      const product = await adminApi.getProduct(shopId, productId);
      // images is a List[str] on the backend; grab first one for the image_url field
      const firstImage = Array.isArray(product.images) && product.images.length > 0
        ? product.images[0]
        : "";
      setFormData({
        name: product.name || "",
        description: product.description || "",
        price: product.price || "",
        inventory_count: product.inventory_count ?? "",
        category: product.category || "",
        image_url: firstImage,
      });
    } catch (err) {
      console.error("❌ Failed to load product:", err);
      setErrors({ submit: "Məhsul yüklənərkən xəta baş verdi" });
    } finally {
      setPageLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name) newErrors.name = "Məhsul adı tələb olunur";
    if (!formData.price) newErrors.price = "Qiymət tələb olunur";
    if (formData.price && parseFloat(formData.price) <= 0)
      newErrors.price = "Qiymət 0-dan böyük olmalıdır";
    if (!formData.inventory_count)
      newErrors.inventory_count = "Stok miqdarı tələb olunur";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);

    try {
      // Convert image_url string → images array (backend expects List[str])
      const { image_url, ...rest } = formData;
      const productData = {
        ...rest,
        price: parseFloat(formData.price),
        inventory_count: parseInt(formData.inventory_count),
        images: image_url ? [image_url] : [],
      };

      await adminApi.updateProduct(shopId, productId, productData);
      navigate(`/admin/shops/${shopId}`);
    } catch (err) {
      const errorMessage =
        err.response?.data?.detail || "Məhsul yenilənərkən xəta baş verdi";
      setErrors({ submit: errorMessage });
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Yüklənir...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Məhsulu Redaktə Et
          </h1>
          <p className="text-gray-600">Məhsul məlumatlarını yeniləyin</p>
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
                    className={`input-field pr-12 ${errors.price ? "input-error" : ""}`}
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
                    ₼
                  </span>
                </div>
                {errors.price && (
                  <p className="error-message">{errors.price}</p>
                )}
              </div>

              {/* Stock Quantity */}
              <Input
                label="Stok Miqdarı"
                type="number"
                name="inventory_count"
                placeholder="100"
                value={formData.inventory_count}
                onChange={handleChange}
                error={errors.inventory_count}
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

              {/* Image Upload */}
              <div className="mb-4">
                <label className="label">Məhsul Şəkli</label>
                <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:bg-gray-50 transition-colors">
                  {formData.image_url ? (
                    <div className="relative">
                      <img src={formData.image_url} alt="Preview" className="h-32 object-contain" />
                      <button
                        type="button"
                        onClick={() => setFormData(p => ({ ...p, image_url: '' }))}
                        className="absolute -top-2 -right-2 bg-danger-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="flex text-sm text-gray-600 justify-center">
                        <label className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500">
                          <span>Şəkil seçin</span>
                          <input type="file" className="sr-only" accept="image/*" onChange={async (e) => {
                            const file = e.target.files[0];
                            if (!file) return;
                            try {
                              const res = await adminApi.uploadImage(file);
                              setFormData(p => ({ ...p, image_url: res.url }));
                            } catch (err) {
                              alert("Şəkil yüklənərkən xəta baş verdi");
                            }
                          }} />
                        </label>
                      </div>
                      <p className="text-xs text-gray-500">PNG, JPG 5MB qədər</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Buttons */}
              <div className="flex space-x-4">
                <Button
                  type="submit"
                  variant="primary"
                  loading={loading}
                  className="flex-1"
                >
                  {loading ? "Yenilənir..." : "Dəyişiklikləri Saxla"}
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
      </div>
    </AdminLayout>
  );
};
