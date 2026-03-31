import { useState } from 'react';
import { superAdminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

export const OnboardingModal = ({ isOpen, onClose, onSubmitSuccess }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploadedLogo, setUploadedLogo] = useState(null);
  const [uploadedBanner, setUploadedBanner] = useState(null);
  
  const [formData, setFormData] = useState({
    // Step 1
    full_name: '',
    email: '',
    whatsapp: '',
    phone: '',
    
    // Step 2
    shop_name: '',
    shop_name_az: '',
    category: '',
    subdomain_preference: '',
    instagram_url: '',
    location_address: '',
    google_maps_link: '',
    business_description: '',
    current_revenue: '',
    employee_count: '',
    currently_selling_online: false,
    other_platforms: '',
    
    // Step 3
    logo_url: '',
    banner_url: '',
    primary_color: '#0ea5e9',
    secondary_color: '#10b981',
    
    // Step 4
    want_cod: true,
    want_millikart: true,
    want_birbank: false,
    want_pasha_pay: false,
    tax_id: '',
    legal_name: '',
    iban: '',
    delivery_courier: true,
    delivery_pickup: false,
    delivery_cities: '',
    delivery_notes: '',
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFileUpload = async (file, type) => {
    if (!file) return;
    
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);
    
    try {
      const response = await superAdminApi.uploadImage(formDataUpload);
      if (type === 'logo') {
        setUploadedLogo(response.url);
      } else {
        setUploadedBanner(response.url);
      }
    } catch (error) {
      alert('Şəkil yüklənərkən xəta baş verdi');
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const finalData = {
        ...formData,
        logo_url: uploadedLogo,
        banner_url: uploadedBanner,
      };
      
      await superAdminApi.submitLead(finalData);
      onSubmitSuccess();
    } catch (error) {
      console.error('Onboarding submission error:', error);
      alert('Müraciət göndərilərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const validateStep = (step) => {
    switch(step) {
      case 1:
        return formData.full_name && formData.whatsapp;
      case 2:
        return formData.shop_name;
      case 3:
        return true;
      default:
        return true;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl my-8 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Mağaza Onboarding</h2>
              <p className="text-primary-100 text-sm mt-1">Yeni mağaza qeydiyyatı</p>
            </div>
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white transition-colors text-2xl"
            >
              ✕
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-6">
            <div className="flex items-center justify-between text-xs text-primary-100 mb-2">
              <span className={currentStep >= 1 ? 'text-white font-bold' : ''}>Məlumatlar</span>
              <span className={currentStep >= 2 ? 'text-white font-bold' : ''}>Mağaza</span>
              <span className={currentStep >= 3 ? 'text-white font-bold' : ''}>Marka</span>
              <span className={currentStep >= 4 ? 'text-white font-bold' : ''}>Ödəniş & Çatdırılma</span>
            </div>
            <div className="relative h-2 bg-primary-500/30 rounded-full overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-white transition-all duration-500 ease-out"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-8 max-h-[70vh] overflow-y-auto">
          
          {/* STEP 1: Admin/Owner Information */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">👤 Sahibkar Məlumatları</h3>
                <p className="text-sm text-gray-500 mb-6">Zəhmət olmasa mağaza sahibinin məlumatlarını daxil edin.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Ad və Soyad *"
                    placeholder="Məs. Əli Məmmədov"
                    name="full_name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />
                  
                  <Input
                    label="Email"
                    type="email"
                    placeholder="email@example.com"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                  />
                  
                  <Input
                    label="WhatsApp Nömrəsi *"
                    placeholder="+994 50 123 45 67"
                    name="whatsapp"
                    value={formData.whatsapp}
                    onChange={handleChange}
                    required
                  />
                  
                  <Input
                    label="Əlavə Telefon"
                    placeholder="+994 12 345 67 89"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Company Information */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">🏪 Mağaza Məlumatları</h3>
                <p className="text-sm text-gray-500 mb-6">Mağaza haqqında əsas məlumatlar.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Mağaza Adı *"
                    placeholder="Məs. Cheechak Boutique"
                    name="shop_name"
                    value={formData.shop_name}
                    onChange={handleChange}
                    required
                  />
                  
                  <Input
                    label="Mağaza Adı (Azərbaycanca)"
                    placeholder="Məs. Çiçək Butik"
                    name="shop_name_az"
                    value={formData.shop_name_az}
                    onChange={handleChange}
                  />
                  
                  <Input
                    label="Instagram URL"
                    placeholder="https://instagram.com/shopname"
                    name="instagram_url"
                    value={formData.instagram_url}
                    onChange={handleChange}
                    helperText="Tam Instagram profil linki"
                  />
                  
                  <Input
                    label="Tərcih Edilən Subdomen"
                    placeholder="shopname"
                    name="subdomain_preference"
                    value={formData.subdomain_preference}
                    onChange={handleChange}
                    helperText="cheechak.1line.az kimi olacaq"
                  />
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Kateqoriya</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-shadow bg-gray-50 border px-4"
                    >
                      <option value="">Seçin...</option>
                      <option value="clothing">Geyim və Aksessuarlar</option>
                      <option value="electronics">Elektronika</option>
                      <option value="home">Ev və Bağ</option>
                      <option value="beauty">Gözəllik və Sağlamlıq</option>
                      <option value="food">Qida və Restoran</option>
                      <option value="sports">İdman və Aktivlik</option>
                      <option value="toys">Uşaq və Oyuncaqlar</option>
                      <option value="pet">Heyvan Məhsulları</option>
                      <option value="other">Digər</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <Input
                      label="Google Maps Link"
                      placeholder="https://maps.google.com/..."
                      name="google_maps_link"
                      value={formData.google_maps_link}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Input
                      label="Ünvan"
                      placeholder="Bakı, Nizami küç. 123"
                      name="location_address"
                      value={formData.location_address}
                      onChange={handleChange}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Biznes Haqqında</label>
                    <textarea
                      name="business_description"
                      value={formData.business_description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Mağazanız, məhsullarınız və ya xidmətləriniz haqqında qısa məlumat..."
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-shadow text-sm"
                    />
                    <p className="text-xs text-gray-400 mt-1">Bu məlumat SEO təsvirləri üçün istifadə ediləcək.</p>
                  </div>
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h4 className="text-sm font-bold text-gray-700 mb-4">📊 Əlavə Məlumatlar (İstəyə Görə)</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aylıq Gəlir</label>
                    <select
                      name="current_revenue"
                      value={formData.current_revenue}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 bg-gray-50 border px-4 text-sm"
                    >
                      <option value="">Seçin...</option>
                      <option value="<1000">1,000 AZN-dən az</option>
                      <option value="1000-3000">1,000 - 3,000 AZN</option>
                      <option value="3000-5000">3,000 - 5,000 AZN</option>
                      <option value="5000-10000">5,000 - 10,000 AZN</option>
                      <option value="10000+">10,000 AZN-dən çox</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">İşçi Sayı</label>
                    <select
                      name="employee_count"
                      value={formData.employee_count}
                      onChange={handleChange}
                      className="w-full h-12 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 bg-gray-50 border px-4 text-sm"
                    >
                      <option value="">Seçin...</option>
                      <option value="1">Tək nəfər (Freelance)</option>
                      <option value="2-5">2-5 nəfər</option>
                      <option value="6-10">6-10 nəfər</option>
                      <option value="11-50">11-50 nəfər</option>
                      <option value="50+">50+ nəfər</option>
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="currently_selling_online"
                        checked={formData.currently_selling_online}
                        onChange={handleChange}
                        className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm text-gray-700">Hazırda onlayn satış edirəm</span>
                    </label>
                  </div>
                  
                  {formData.currently_selling_online && (
                    <div className="md:col-span-2">
                      <Input
                        label="Hansı platformalarda satış edirsiniz?"
                        placeholder="Məs. Instagram, WhatsApp, Shopify..."
                        name="other_platforms"
                        value={formData.other_platforms}
                        onChange={handleChange}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Brand Identity */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">🎨 Marka Kimliyi</h3>
                <p className="text-sm text-gray-500 mb-6">Mağazanızın vizual identifikasiyasını yaradaq.</p>
                
                {/* Logo Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loqo</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors">
                    {uploadedLogo ? (
                      <div className="relative inline-block">
                        <img src={uploadedLogo} alt="Logo" className="h-24 w-auto object-contain" />
                        <button
                          type="button"
                          onClick={() => setUploadedLogo(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">📤</div>
                        <p className="text-sm text-gray-600 mb-2">Loqonu bura sürüşdürün və ya klikləyin</p>
                        <p className="text-xs text-gray-400">PNG, JPG (max 2MB)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files?.[0], 'logo')}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="inline-block mt-3 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-100"
                        >
                          Fayl Seç
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Banner Upload */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banner (İstəyə Görə)</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-primary-300 transition-colors">
                    {uploadedBanner ? (
                      <div className="relative inline-block">
                        <img src={uploadedBanner} alt="Banner" className="h-32 w-full object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => setUploadedBanner(null)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-4xl mb-2">🖼️</div>
                        <p className="text-sm text-gray-600 mb-2">Banner şəklini bura sürüşdürün</p>
                        <p className="text-xs text-gray-400">PNG, JPG (max 5MB)</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileUpload(e.target.files?.[0], 'banner')}
                          className="hidden"
                          id="banner-upload"
                        />
                        <label
                          htmlFor="banner-upload"
                          className="inline-block mt-3 px-4 py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-medium cursor-pointer hover:bg-primary-100"
                        >
                          Fayl Seç
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Brand Colors */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Əsas Rəng</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="primary_color"
                        value={formData.primary_color}
                        onChange={handleChange}
                        className="h-12 w-16 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.primary_color}
                        onChange={handleChange}
                        name="primary_color"
                        className="flex-1 h-12 px-4 border border-gray-200 rounded-lg font-mono text-sm"
                        placeholder="#0ea5e9"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Köməkçi Rəng</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        name="secondary_color"
                        value={formData.secondary_color}
                        onChange={handleChange}
                        className="h-12 w-16 rounded-lg border border-gray-200 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={formData.secondary_color}
                        onChange={handleChange}
                        name="secondary_color"
                        className="flex-1 h-12 px-4 border border-gray-200 rounded-lg font-mono text-sm"
                        placeholder="#10b981"
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Preview */}
              <div className="border-t pt-6">
                <h4 className="text-sm font-bold text-gray-700 mb-4">👀 Önizləmə</h4>
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <div className="flex items-center gap-4 mb-4">
                    {uploadedLogo ? (
                      <img src={uploadedLogo} alt="Logo Preview" className="h-16 w-16 object-contain bg-white rounded-lg p-2" />
                    ) : (
                      <div className="h-16 w-16 bg-white rounded-lg flex items-center justify-center text-2xl border">
                        🏪
                      </div>
                    )}
                    <div>
                      <h5 className="font-bold text-gray-900">{formData.shop_name || 'Mağaza Adı'}</h5>
                      <p className="text-sm text-gray-500">{formData.instagram_url || 'Instagram'}</p>
                    </div>
                  </div>
                  <div className="h-2 rounded-full" style={{ backgroundColor: formData.primary_color }} />
                  <div className="h-2 rounded-full mt-2" style={{ backgroundColor: formData.secondary_color }} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Payment & Delivery */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">💳 Ödəniş & Çatdırılma</h3>
                <p className="text-sm text-gray-500 mb-6">Mağazanızın ödəniş və çatdırılma parametrlərini tənzimləyin.</p>
                
                {/* Payment Methods */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>💳</span> Ödəniş Metodları
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="want_cod"
                        checked={formData.want_cod}
                        onChange={handleChange}
                        className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">💵 Nağd Ödəniş (COD)</span>
                        <p className="text-xs text-gray-500">Müştəri məhsulu alarkən ödəyir (Ən populyar)</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="want_millikart"
                        checked={formData.want_millikart}
                        onChange={handleChange}
                        className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">💳 MilliKart</span>
                        <p className="text-xs text-gray-500">Kartla onlayn ödəniş</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="want_birbank"
                        checked={formData.want_birbank}
                        onChange={handleChange}
                        className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">📱 BirBank</span>
                        <p className="text-xs text-gray-500">Mobil bankinq ödənişi</p>
                      </div>
                    </label>
                    
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        name="want_pasha_pay"
                        checked={formData.want_pasha_pay}
                        onChange={handleChange}
                        className="mt-1 h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                      />
                      <div>
                        <span className="text-sm font-medium text-gray-900">💰 Pasha Pay</span>
                        <p className="text-xs text-gray-500">Rəqəmsal cüzdan</p>
                      </div>
                    </label>
                  </div>
                </div>
                
                {/* Business Registration (Optional) */}
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📄</span> Biznes Məlumatları (İstəyə Görə)
                  </h4>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-4">
                    <p className="text-xs text-blue-800">
                      💡 Bu məlumatlar yalnız rəsmi fəaliyyət göstərməyiniz üçündür. 
                      Əgər hələ ki rəsmiləşməmisinizsə, boş saxlaya bilərsiniz.
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      label="VÖEN (İstəyə Görə)"
                      placeholder="1234567890"
                      name="tax_id"
                      value={formData.tax_id}
                      onChange={handleChange}
                    />
                    
                    <Input
                      label="Hüquqi Ad (İstəyə Görə)"
                      placeholder="MMM və ya fiziki şəxs"
                      name="legal_name"
                      value={formData.legal_name}
                      onChange={handleChange}
                    />
                    
                    <div className="md:col-span-2">
                      <Input
                        label="Bank Hesabı / IBAN (İstəyə Görə)"
                        placeholder="AZ20010000000000000000000000"
                        name="iban"
                        value={formData.iban}
                        onChange={handleChange}
                        helperText="Onlayn ödənişlər üçün tələb olunur"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Delivery Options */}
                <div>
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>🚚</span> Çatdırılma Seçimləri
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="delivery_courier"
                          checked={formData.delivery_courier}
                          onChange={handleChange}
                          className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700">🛵 Kuryer</span>
                      </label>
                      
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          name="delivery_pickup"
                          checked={formData.delivery_pickup}
                          onChange={handleChange}
                          className="h-5 w-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="text-sm font-medium text-gray-700">🏪 Mağazadan</span>
                      </label>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hansı Şəhərlərə?</label>
                      <input
                        type="text"
                        name="delivery_cities"
                        value={formData.delivery_cities}
                        onChange={handleChange}
                        placeholder="Bakı, Sumqayıt, Gəncə (vergüllə ayırın)"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Çatdırılma Haqqında Əlavə Məlumat</label>
                      <textarea
                        name="delivery_notes"
                        value={formData.delivery_notes}
                        onChange={handleChange}
                        rows={3}
                        placeholder="Çatdırılma qiymətləri, pulsuz çatdırılma limitləri və s."
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-1 focus:ring-primary-500 focus:border-primary-500 text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t px-8 py-4 bg-gray-50 flex items-center justify-between">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onClose : handleBack}
            disabled={loading}
          >
            {currentStep === 1 ? 'Ləğv et' : 'Geri'}
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              variant="primary"
              onClick={handleNext}
              disabled={!validateStep(currentStep)}
            >
              Növbəti
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleSubmit}
              loading={loading}
              disabled={!validateStep(currentStep)}
            >
              Müraciəti Göndər
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
