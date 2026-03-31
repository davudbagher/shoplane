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
    logo_url: '',
    allow_cod: true,
    allow_online_payment: false
  });
  const [paymentSettings, setPaymentSettings] = useState({
    millikart_enabled: false,
    millikart_iban: '',
    millikart_account_info: '',
    millikart_payment_link: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
        logo_url: data.logo_url || '',
        allow_cod: data.allow_cod ?? true,
        allow_online_payment: data.allow_online_payment ?? false
      });
      setPaymentSettings({
        millikart_enabled: data.millikart_enabled ?? false,
        millikart_iban: data.millikart_iban || '',
        millikart_account_info: data.millikart_account_info || '',
        millikart_payment_link: data.millikart_payment_link || ''
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

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const result = await adminApi.uploadImage(file);
      setShop(prev => ({ ...prev, logo_url: result.url }));
    } catch (err) {
      alert("Loqo yüklənərkən xəta baş verdi");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      // Update general shop settings
      await adminApi.updateShop(shopId, shop);
      
      // Update payment settings
      await adminApi.updatePaymentSettings(shopId, paymentSettings);
      
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

          {/* Logo Settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-3">Mağaza Loqosu (Logo)</h2>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Loqo Şəkli</label>
              <div className="flex items-center gap-4">
                {shop.logo_url && shop.logo_url.trim() !== '' ? (
                  <div className="relative h-16 w-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                    <img src={shop.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    <button
                      type="button"
                      onClick={() => setShop(prev => ({ ...prev, logo_url: '' }))}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] shadow-sm"
                    >✕</button>
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl border border-dashed border-gray-300">
                    🏪
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className={`cursor-pointer px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors inline-block text-center ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <input type="file" className="sr-only" accept="image/png, image/jpeg" onChange={handleLogoUpload} disabled={uploading} />
                    {uploading ? 'Yüklənir...' : 'Loqo Yüklə'}
                  </label>
                  <p className="text-[10px] text-gray-400">Məsləhət görülür: PNG formatı, max hündürlük h-12</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Settings */}
          <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-50 pb-3">💳 Ödəniş Parametrləri (MilliKart)</h2>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="text-sm font-bold text-blue-900 mb-2">🔗 Bir Link İnteqrasiyası</h3>
              <p className="text-xs text-blue-700 mb-3">
                MilliKart-da hesab açın və ödəniş linkinizi əldə edin. Müştərilər ödəniş etdikdə, pul birbaşa SİZİN hesabınıza köçürülür.
                1line.az heç bir komissiya tutmur - yalnız aylıq abunə haqqı.
              </p>
              <a 
                href="https://millikart.az/merchant-registration" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-900 underline"
              >
                MilliKart Tacir Qeydiyyatı →
              </a>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-gray-700">MilliKart Ödənişlərini Aktivləşdir</label>
                  <p className="text-xs text-gray-500">Müştərilərə onlayn ödəniş imkanı verin</p>
                </div>
                <input
                  type="checkbox"
                  name="millikart_enabled"
                  checked={paymentSettings.millikart_enabled}
                  onChange={handlePaymentChange}
                  className="h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </div>

              {paymentSettings.millikart_enabled && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      IBAN (Ödənişləri qəbul etmək üçün)
                    </label>
                    <input
                      type="text"
                      name="millikart_iban"
                      value={paymentSettings.millikart_iban}
                      onChange={handlePaymentChange}
                      placeholder="AZ20010000000000000000000000"
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">Bank hesabınızın IBAN kodu (AZ + 24 rəqəm)</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Ödəniş Linki (Payment Link)
                    </label>
                    <input
                      type="url"
                      name="millikart_payment_link"
                      value={paymentSettings.millikart_payment_link}
                      onChange={handlePaymentChange}
                      placeholder="https://pay.millikart.az/merchant/..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm font-mono"
                    />
                    <p className="text-xs text-gray-500 mt-1">MilliKart kabinetinizdən aldığınız ödəniş linki</p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                      Hesab Məlumatları (İstəyə bağlı)
                    </label>
                    <textarea
                      name="millikart_account_info"
                      value={paymentSettings.millikart_account_info}
                      onChange={handlePaymentChange}
                      rows={2}
                      placeholder="MilliKart hesab ID və ya digər məlumatlar..."
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm"
                    />
                  </div>
                </>
              )}
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
