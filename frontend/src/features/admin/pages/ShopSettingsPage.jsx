import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../shared/components';
import { adminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';

export const ShopSettingsPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState({
    name: '',
    description: '',
    subdomain: '',
    custom_domain: '',
    logo_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadShopData();
  }, [shopId]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getShop(shopId);
      setShop({
        name: data.name || '',
        description: data.description || '',
        subdomain: data.subdomain || '',
        custom_domain: data.custom_domain || '',
        logo_url: data.logo_url || ''
      });
    } catch (err) {
      console.error('Failed to load shop settings:', err);
      setError('Mağaza məlumatları yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setShop(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      await adminApi.updateShop(shopId, shop);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Məlumatlar yadda saxlanılarkən xəta baş verdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Parametrlər</h1>
        </div>

        {success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm">
            ✅ Dəyişikliklər uğurla yadda saxlanıldı!
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* General Settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-3">Ümumi Məlumatlar</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Mağaza Adı</label>
                <input
                  type="text"
                  name="name"
                  value={shop.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Subdomain</label>
                <div className="flex">
                  <input
                    type="text"
                    name="subdomain"
                    value={shop.subdomain}
                    onChange={handleChange}
                    required
                    disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-l-lg bg-gray-50 text-gray-500 text-sm"
                  />
                  <span className="inline-flex items-center px-3 border border-l-0 border-gray-200 rounded-r-lg bg-gray-50 text-gray-500 text-xs">.1line.az</span>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Təsvir</label>
              <textarea
                name="description"
                value={shop.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm"
              />
            </div>
          </div>

          {/* Domain Settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-3">Xüsusi Domen (Custom Domain)</h2>
            <p className="text-xs text-gray-400">Öz domeninizdən istifadə etmək üçün DNS parametrlərini tənzimləməlisiniz.</p>
            
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Domen Adı</label>
              <input
                type="text"
                name="custom_domain"
                value={shop.custom_domain}
                onChange={handleChange}
                placeholder="məs: myshop.com"
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm"
              />
            </div>

            {shop.custom_domain && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-100 text-xs">
                <p className="font-bold text-gray-700 mb-2">DNS Tənzimləmələri:</p>
                <p className="text-gray-600 mb-1">Domeninizin A record-unu aşağıdakı IP-yə yönləndirin:</p>
                <code className="block bg-gray-200 p-2 rounded mb-2 font-mono text-center">12.34.56.78</code>
                <p className="text-gray-400">Qeyd: DNS dəyişikliklərinin aktivləşməsi 24 saata qədər çəkə bilər.</p>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Yadda saxlanılır...' : 'Dəyişiklikləri Yadda Saxla'}
            </Button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
};
