import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminLayout } from '../../../shared/components';
import { adminApi } from "../../../shared/api";
import { Button } from "../../../shared/components/Button";
import { Input } from "../../../shared/components/Input";

export const CreateProductPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    compare_at_price: "",
    inventory_count: "",
    category: "",
    is_new_arrival: false,
  });

  const [images, setImages] = useState([]); // Array of strings (URLs)
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    adminApi.getProducts(shopId).then(data => {
      // Extract unique categories for better UX dropdown/datalist
      const cats = [...new Set(data.map(p => p.category).filter(Boolean))];
      setCategories(cats);
    }).catch(() => { });
  }, [shopId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = Array.from(files).map(file => adminApi.uploadImage(file));
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.url).filter(Boolean);
      setImages(prev => [...prev, ...newUrls].slice(0, 5)); // cap at 5
    } catch (err) {
      alert("Şəkil yüklənərkən xəta baş verdi");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = "Məhsul adı tələb olunur";
    if (!formData.price) newErrors.price = "Qiymət tələb olunur";
    if (formData.price && parseFloat(formData.price) <= 0) newErrors.price = "Qiymət 0-dan böyük olmalıdır";
    if (!formData.inventory_count) newErrors.inventory_count = "Stok miqdarı tələb olunur";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        price: parseFloat(formData.price),
        compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
        inventory_count: parseInt(formData.inventory_count),
        category: formData.category.trim() || null,
        images: images,
        is_new_arrival: formData.is_new_arrival,
      };

      await adminApi.createProduct(shopId, productData);
      navigate(`/admin/shops/${shopId}`);
    } catch (err) {
      setErrors({ submit: err.response?.data?.detail || "Xəta baş verdi" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 text-sm">
            ← Geri
          </button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => navigate(`/admin/shops/${shopId}`)}>Ləğv Et</Button>
            <Button type="submit" form="product-form" variant="primary" loading={loading || uploading}>
              Yadda Saxla
            </Button>
          </div>
        </div>

        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {errors.submit}
          </div>
        )}

        <form id="product-form" onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left form fields (2/3 width) ── */}
          <div className="lg:col-span-2 space-y-5 bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Məhsul Məlumatları</h2>

            <Input
              label="Məhsul Adı *"
              type="text"
              name="name"
              placeholder="Məsələn: Premium Eqvalipt"
              value={formData.name}
              onChange={handleChange}
              error={errors.name}
              required
            />

            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-1">Təsvir</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Məhsulun tərkibi, ölçüləri, xüsusiyyətləri..."
                rows="5"
                className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Qiymət (AZN) *</label>
                <input
                  type="number"
                  name="price"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="29.99"
                  className={`w-full px-4 py-2.5 text-sm border rounded-lg focus:outline-none focus:border-gray-500 ${errors.price ? 'border-red-500' : 'border-gray-300'}`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Köhnə Qiymət (Endirim üçün)</label>
                <input
                  type="number"
                  name="compare_at_price"
                  step="0.01"
                  min="0"
                  value={formData.compare_at_price}
                  onChange={handleChange}
                  placeholder="39.99"
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Stok Miqdarı *"
                type="number"
                name="inventory_count"
                placeholder="50"
                value={formData.inventory_count}
                onChange={handleChange}
                error={errors.inventory_count}
                required
              />

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Kateqoriya</label>
                <input
                  type="text"
                  name="category"
                  list="category-list"
                  placeholder="Seçin və ya yazın"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:outline-none focus:border-gray-500"
                />
                <datalist id="category-list">
                  {categories.map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
            </div>
          </div>

          {/* ── Right sidebar / Images (1/3 width) ── */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Görüntülər</h3>

              {/* Grid of uploaded images */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {images.map((url, index) => (
                  <div key={index} className="relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100 group">
                    <img src={url} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >✕</button>
                    {index === 0 && (
                      <span className="absolute bottom-1 left-1 bg-gray-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">Kaver</span>
                    )}
                  </div>
                ))}

                {/* Upload Placeholder slot */}
                {images.length < 5 && (
                  <label className={`aspect-square border-2 border-dashed border-gray-300 hover:border-gray-500 rounded-lg flex flex-col items-center justify-center cursor-pointer transition-colors ${uploading ? 'opacity-50' : ''}`}>
                    <input type="file" className="sr-only" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} />
                    <div className="text-center p-2">
                      <span className="text-xl text-gray-400 font-light">+</span>
                      <p className="text-2xl mb-1">🖼️</p>
                      <p className="text-[11px] text-gray-400 font-medium">Əlavə Et ({images.length}/5)</p>
                    </div>
                  </label>
                )}
              </div>

              <p className="text-[11px] text-gray-500">Maksimum 5 şəkil. İlk şəkil əsas (kaver) sayılır.</p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-2 border-b border-gray-100">Ayarlar</h3>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  id="is_new_arrival"
                  name="is_new_arrival"
                  checked={formData.is_new_arrival || false}
                  onChange={e => setFormData({ ...formData, is_new_arrival: e.target.checked })}
                  className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="is_new_arrival" className="text-sm font-semibold text-gray-700">Yeni Gələnlər (New Arrival)</label>
              </div>
            </div>
          </div>

        </form>
      </div>
    </AdminLayout>
  );
};
