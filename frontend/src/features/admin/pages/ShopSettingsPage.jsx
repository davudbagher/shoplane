import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { AdminLayout } from '../../../shared/components';
import { adminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';

// ─── helpers ────────────────────────────────────────────────────────────────

const SectionCard = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm space-y-4">
    <div className="border-b border-gray-50 pb-3">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
    {children}
  </div>
);

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{label}</label>
    {children}
    {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
  </div>
);

const inputCls = "w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-black focus:border-black text-sm";

const ComingSoonBadge = () => (
  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
    Tezliklə
  </span>
);

const ComingSoonCard = ({ title, description, icon }) => (
  <div className="bg-white rounded-xl border border-dashed border-gray-200 p-6 shadow-sm opacity-70">
    <div className="flex items-start gap-3">
      <span className="text-2xl">{icon}</span>
      <div>
        <h2 className="text-base font-bold text-gray-700">
          {title}<ComingSoonBadge />
        </h2>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// ─── component ──────────────────────────────────────────────────────────────

export const ShopSettingsPage = () => {
  const { shopId } = useParams();

  const [shop, setShop] = useState({
    name: '',
    description: '',
    subdomain: '',
    // contact
    phone: '',
    email: '',
    address: '',
    whatsapp_number: '',
    // branding
    logo_url: '',
    banner_url: '',
    primary_color: '#4f46e5',
    // domain
    custom_domain: '',
    // payment
    allow_cod: true,
    allow_online_payment: false,
  });

  const [paymentSettings, setPaymentSettings] = useState({
    millikart_enabled: false,
    millikart_iban: '',
    millikart_account_info: '',
    millikart_payment_link: '',
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => { loadShopData(); }, [shopId]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getShop(shopId);
      setShop({
        name: data.name || '',
        description: data.description || '',
        subdomain: data.subdomain || '',
        phone: data.phone || '',
        email: data.email || '',
        address: data.address || '',
        whatsapp_number: data.whatsapp_number || '',
        logo_url: data.logo_url || '',
        banner_url: data.banner_url || '',
        primary_color: data.primary_color || '#4f46e5',
        custom_domain: data.custom_domain || '',
        allow_cod: data.allow_cod ?? true,
        allow_online_payment: data.allow_online_payment ?? false,
      });
      setPaymentSettings({
        millikart_enabled: data.millikart_enabled ?? false,
        millikart_iban: data.millikart_iban || '',
        millikart_account_info: data.millikart_account_info || '',
        millikart_payment_link: data.millikart_payment_link || '',
      });
    } catch (err) {
      setError('Mağaza məlumatları yüklənə bilmədi');
    } finally {
      setLoading(false);
    }
  };

  // Handles both text inputs and checkboxes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setShop(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePaymentChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPaymentSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleImageUpload = async (field, file) => {
    if (!file) return;
    setUploading(true);
    try {
      const result = await adminApi.uploadImage(file);
      setShop(prev => ({ ...prev, [field]: result.url }));
    } catch {
      alert('Şəkil yüklənərkən xəta baş verdi');
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
      await adminApi.updateShop(shopId, shop);
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
          <div className="h-12 w-12 border-4 border-gray-200 border-t-black rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        <h1 className="text-2xl font-bold text-gray-900">Parametrlər</h1>

        {success && (
          <div className="p-4 bg-green-50 text-green-700 rounded-xl border border-green-100 text-sm">
            Dəyişikliklər uğurla yadda saxlanıldı!
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-xl border border-red-100 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── 1. General Info ─────────────────────────────────────── */}
          <SectionCard title="Ümumi Məlumatlar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Mağaza Adı">
                <input type="text" name="name" value={shop.name}
                  onChange={handleChange} required className={inputCls} />
              </Field>
              <Field label="Subdomain" hint="Dəyişdirilə bilməz">
                <div className="flex">
                  <input type="text" value={shop.subdomain} disabled
                    className="w-full px-4 py-2 border border-gray-200 rounded-l-lg bg-gray-50 text-gray-400 text-sm" />
                  <span className="inline-flex items-center px-3 border border-l-0 border-gray-200 rounded-r-lg bg-gray-50 text-gray-400 text-xs whitespace-nowrap">
                    .1line.az
                  </span>
                </div>
              </Field>
            </div>
            <Field label="Məğazanın Təsviri">
              <textarea name="description" value={shop.description} onChange={handleChange}
                rows={3} className={inputCls} placeholder="Mağazanız haqqında qısa məlumat..." />
            </Field>
          </SectionCard>

          {/* ── 2. Contact Info ─────────────────────────────────────── */}
          <SectionCard title="Əlaqə Məlumatları"
            subtitle="Storefront-da müştərilərə göstərilir">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Telefon">
                <input type="tel" name="phone" value={shop.phone} onChange={handleChange}
                  placeholder="+994 50 000 00 00" className={inputCls} />
              </Field>
              <Field label="WhatsApp">
                <input type="tel" name="whatsapp_number" value={shop.whatsapp_number}
                  onChange={handleChange} placeholder="+994 50 000 00 00" className={inputCls} />
              </Field>
              <Field label="E-poçt">
                <input type="email" name="email" value={shop.email} onChange={handleChange}
                  placeholder="info@magaza.com" className={inputCls} />
              </Field>
              <Field label="Ünvan">
                <input type="text" name="address" value={shop.address} onChange={handleChange}
                  placeholder="Bakı, Nəsimi r., Nizami küç. 10" className={inputCls} />
              </Field>
            </div>
          </SectionCard>

          {/* ── 3. Branding ─────────────────────────────────────────── */}
          <SectionCard title="Brendinq"
            subtitle="Mağazanızın görünüşünü fərdiləşdirin">

            {/* Brand color */}
            <Field label="Brend Rəngi" hint="Düymələr, linklər və vurğu elementlərinin rəngi">
              <div className="flex items-center gap-3">
                <input type="color" name="primary_color" value={shop.primary_color}
                  onChange={handleChange}
                  className="h-10 w-16 rounded-lg border border-gray-200 cursor-pointer p-0.5" />
                <input type="text" name="primary_color" value={shop.primary_color}
                  onChange={handleChange} maxLength={7}
                  placeholder="#4f46e5"
                  className="w-32 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono" />
                <span className="text-xs text-gray-400">Məs: #4f46e5, #e11d48</span>
              </div>
            </Field>

            {/* Logo */}
            <Field label="Loqo" hint="PNG tövsiyə olunur, şəffaf fon ilə">
              <div className="flex items-center gap-4">
                {shop.logo_url ? (
                  <div className="relative h-16 w-16 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex items-center justify-center">
                    <img src={shop.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                    <button type="button" onClick={() => setShop(p => ({ ...p, logo_url: '' }))}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-gray-100 rounded-lg flex items-center justify-center text-2xl border border-dashed border-gray-300">
                    🏪
                  </div>
                )}
                <label className={`cursor-pointer px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp"
                    onChange={e => handleImageUpload('logo_url', e.target.files?.[0])} disabled={uploading} />
                  {uploading ? 'Yüklənir...' : 'Loqo Yüklə'}
                </label>
              </div>
            </Field>

            {/* Banner */}
            <Field label="Banner Şəkli" hint="Mağaza səhifəsinin yuxarısında göstərilir (1200×400 px)">
              <div className="flex items-center gap-4">
                {shop.banner_url ? (
                  <div className="relative h-20 w-48 bg-gray-50 rounded-lg overflow-hidden border border-gray-100">
                    <img src={shop.banner_url} alt="Banner" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => setShop(p => ({ ...p, banner_url: '' }))}
                      className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px]">
                      ✕
                    </button>
                  </div>
                ) : (
                  <div className="h-20 w-48 bg-gray-100 rounded-lg flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-300">
                    Banner yoxdur
                  </div>
                )}
                <label className={`cursor-pointer px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-bold hover:bg-gray-800 transition-colors ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <input type="file" className="sr-only" accept="image/png,image/jpeg,image/webp"
                    onChange={e => handleImageUpload('banner_url', e.target.files?.[0])} disabled={uploading} />
                  {uploading ? 'Yüklənir...' : 'Banner Yüklə'}
                </label>
              </div>
            </Field>
          </SectionCard>

          {/* ── 4. Payment Methods ──────────────────────────────────── */}
          <SectionCard title="Ödəniş Üsulları">

            {/* COD toggle */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-800">Qapıda Ödəniş (COD)</p>
                <p className="text-xs text-gray-500 mt-0.5">Müştəri malı alanda nağd ödəyir</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="allow_cod" checked={shop.allow_cod}
                  onChange={handleChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-black rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-black" />
              </label>
            </div>

            {/* MilliKart */}
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700 mb-2">
              <p className="font-bold text-blue-900 mb-1">MilliKart — Bir Link İnteqrasiyası</p>
              <p>MilliKart-da hesab açın, ödəniş linkini alın. Müştərilər ödəyəndə pul birbaşa SİZİN hesabınıza köçür. 1line.az komissiya tutmur.</p>
              <a href="https://millikart.az/merchant-registration" target="_blank" rel="noopener noreferrer"
                className="font-bold underline mt-1 inline-block">MilliKart Tacir Qeydiyyatı →</a>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-gray-700">MilliKart Ödənişlərini Aktivləşdir</p>
                <p className="text-xs text-gray-500">Müştərilərə onlayn ödəniş imkanı verin</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" name="millikart_enabled" checked={paymentSettings.millikart_enabled}
                  onChange={handlePaymentChange} className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {paymentSettings.millikart_enabled && (
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <Field label="IBAN" hint="Bank hesabınızın IBAN kodu (AZ + 24 rəqəm)">
                  <input type="text" name="millikart_iban" value={paymentSettings.millikart_iban}
                    onChange={handlePaymentChange} placeholder="AZ20010000000000000000000000"
                    className={`${inputCls} font-mono`} />
                </Field>
                <Field label="Ödəniş Linki" hint="MilliKart kabinetinizdən aldığınız ödəniş linki">
                  <input type="url" name="millikart_payment_link" value={paymentSettings.millikart_payment_link}
                    onChange={handlePaymentChange} placeholder="https://pay.millikart.az/merchant/..."
                    className={`${inputCls} font-mono`} />
                </Field>
                <Field label="Hesab Məlumatları (İstəyə bağlı)">
                  <textarea name="millikart_account_info" value={paymentSettings.millikart_account_info}
                    onChange={handlePaymentChange} rows={2}
                    placeholder="MilliKart hesab ID və ya digər məlumatlar..."
                    className={inputCls} />
                </Field>
              </div>
            )}
          </SectionCard>

          {/* ── 5. Custom Domain ─────────────────────────────────────── */}
          <SectionCard title="Xüsusi Domen (Custom Domain)"
            subtitle="Öz domeninizdən istifadə edin. DNS-də A record-u serverimizə yönləndirilməlidir.">
            <Field label="Domen Adı">
              <input type="text" name="custom_domain" value={shop.custom_domain}
                onChange={handleChange} placeholder="məs: myshop.com"
                className={inputCls} />
            </Field>
            {shop.custom_domain && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-100 text-xs space-y-1">
                <p className="font-bold text-gray-700">DNS Tənzimləmələri:</p>
                <p className="text-gray-500">Domeninizin A record-unu aşağıdakı IP-yə yönləndirin:</p>
                <code className="block bg-gray-200 px-3 py-2 rounded font-mono text-center text-sm my-1">
                  12.34.56.78
                </code>
                <p className="text-gray-400">DNS dəyişikliklərinin aktivləşməsi 24 saata qədər çəkə bilər.</p>
              </div>
            )}
          </SectionCard>

          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Yadda saxlanılır...' : 'Dəyişiklikləri Yadda Saxla'}
            </Button>
          </div>
        </form>

        {/* ── Growth Opportunities (Coming Soon) ─────────────────── */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Gələcək Funksiyalar</p>

          <ComingSoonCard
            icon="🔍"
            title="SEO Parametrləri"
            description="Mağazanızın Google-da daha yaxşı görünməsi üçün meta başlıq, meta təsvir və sosial paylaşım şəkli əlavə edin. Hər məhsul üçün ayrıca SEO ayarları."
          />
          <ComingSoonCard
            icon="🚚"
            title="Göndəriş Parametrləri"
            description="Sabit göndəriş haqqı, müəyyən məbləğdən sonra pulsuz çatdırılma, şəhər üzrə fərqli tariflər. Bakı, Gəncə, Sumqayıt üçün ayrı qiymətlər."
          />
          <ComingSoonCard
            icon="📊"
            title="Analitika (Google Analytics)"
            description="Google Analytics ID əlavə edərək mağaza ziyarətçilərini, konversiya meylini və ən çox baxılan məhsulları izləyin."
          />
          <ComingSoonCard
            icon="📱"
            title="Sosial Media Linklər"
            description="Instagram, TikTok, Facebook hesablarınızı bağlayın. Storefront-da sosial media düymələri göstərilir, müştərilər birbaşa keçid edir."
          />
          <ComingSoonCard
            icon="🏦"
            title="BirBank / Pasha Pay İnteqrasiyası"
            description="MilliKart kimi BirBank və Pasha Pay ödəniş linklərini əlavə edin. Müştərilərə daha çox ödəniş seçimi verin."
          />
          <ComingSoonCard
            icon="🕐"
            title="İş Saatları"
            description="Mağazanızın iş saatlarını təyin edin. Müştərilər storefront-da sizi nə vaxt tapa biləcəklərini biləcəklər."
          />
        </div>
      </div>
    </AdminLayout>
  );
};
