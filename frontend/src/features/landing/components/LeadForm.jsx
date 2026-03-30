import { useState } from 'react';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { superAdminApi } from '../../../shared/api';

export const LeadForm = () => {
  const [formData, setFormData] = useState({
    full_name: '',
    whatsapp: '',
    shop_name: '',
    category: ''
  });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await superAdminApi.submitLead(formData);
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.detail || 'Müraciət zamanı xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100 text-center animate-fade-in">
        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Təşəkkür edirik!</h3>
        <p className="text-gray-600">
          Müraciətiniz qəbul edildi. Tezliklə WhatsApp vasitəsilə sizinlə əlaqə saxlayacağıq.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white p-8 rounded-3xl shadow-xl border border-gray-100">
      <h3 className="text-2xl font-bold text-gray-900 mb-6">Mağaza üçün müraciət et</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Ad və Soyad"
          placeholder="Məs. Əli Məmmədov"
          value={formData.full_name}
          onChange={(e) => setFormData({...formData, full_name: e.target.value})}
          required
        />
        <Input
          label="WhatsApp nömrəsi"
          placeholder="+994 -- --- -- --"
          value={formData.whatsapp}
          onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
          required
        />
        <Input
          label="Gözlənilən Mağaza Adı"
          placeholder="Məs. My Trendy Shop"
          value={formData.shop_name}
          onChange={(e) => setFormData({...formData, shop_name: e.target.value})}
          required
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Kateqoriya</label>
          <select 
            className="w-full h-12 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-shadow bg-gray-50 border px-4"
            value={formData.category}
            onChange={(e) => setFormData({...formData, category: e.target.value})}
            required
          >
            <option value="">Seçin...</option>
            <option value="clothing">Geyim</option>
            <option value="electronics">Elektronika</option>
            <option value="home">Ev və Bağ</option>
            <option value="other">Digər</option>
          </select>
        </div>
        <Button variant="primary" className="w-full h-14 text-lg mt-6" type="submit" loading={loading}>
          Müraciət et
        </Button>
        <p className="text-center text-xs text-gray-400 mt-4">
          Müraciət edərək şərtlərimizlə razılaşırsınız.
        </p>
      </form>
    </div>
  );
};
