import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { superAdminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';
import { OnboardingModal } from '../components/OnboardingModal';

export const PlatformDashboard = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [createdShopCredentials, setCreatedShopCredentials] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [shopsData, statsData, leadsData] = await Promise.all([
        superAdminApi.listAllShops(),
        superAdminApi.getStats(),
        superAdminApi.listLeads()
      ]);
      setShops(shopsData);
      setStats(statsData);
      setLeads(leadsData);
    } catch (err) {
      console.error('Failed to fetch platform data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardSubmit = async (e) => {
    e.preventDefault();
    setOnboardLoading(true);
    setError(null);
    try {
      await superAdminApi.onboardMerchant(onboardData);
      setShowOnboardModal(false);
      setOnboardData({ email: '', full_name: '', shop_name: '', subdomain: '', plan_type: 'standard' });
      fetchData(); // Refresh list
    } catch (err) {
      setError(err.response?.data?.detail || 'Onboarding failed');
    } finally {
      setOnboardLoading(false);
    }
  };

  const handleRenew = async (shopId) => {
    if (!window.confirm('Bu mağazanın abunəliyini 30 gün artırmaq istədiyinizə əminsiniz? (Ödənişin alındığını təsdiq edirsiniz)')) return;
    try {
      await superAdminApi.renewSubscription(shopId, 30);
      fetchData();
    } catch (err) {
      alert('Yeniləmə uğursuz oldu');
    }
  };

  const handleToggleStatus = async (shopId) => {
    try {
      await superAdminApi.toggleStatus(shopId);
      fetchData();
    } catch (err) {
      alert('Status dəyişdirilməsi uğursuz oldu');
    }
  };

  const handleLeadClick = (lead) => {
    setSelectedLead(lead);
  };

  const handleCloseLeadDetail = () => {
    setSelectedLead(null);
  };

  const handleDeleteLead = async (leadId) => {
    if (!window.confirm('⚠️ Bu müraciəti silmək istədiyinizə əminsiniz?\n\nBu əməliyyat geri qaytarıla bilməz!')) return;
    
    try {
      setLoading(true);
      await superAdminApi.deleteLead(leadId);
      setSelectedLead(null);
      fetchData(); // Refresh leads list
      alert('✅ Müraciət silindi!');
    } catch (error) {
      console.error('Failed to delete lead:', error);
      alert(error.response?.data?.detail || 'Müraciət silinərkən xəta baş verdi');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShopFromLead = async (lead) => {
    if (!window.confirm(`Create shop for ${lead.shop_name || lead.full_name}? This will:\n\n• Create user account\n• Setup shop with their preferences\n• Generate login credentials\n\nContinue?`)) return;
    
    try {
      setLoading(true);
      const response = await superAdminApi.createShopFromLead(lead.id, {
        subdomain: lead.subdomain_preference
      });
      
      // Show credentials modal
      setCreatedShopCredentials(response);
      setShowCredentialsModal(true);
      fetchData(); // Refresh leads list
    } catch (error) {
      console.error('Failed to create shop:', error);
      alert(error.response?.data?.detail || 'Failed to create shop');
    } finally {
      setLoading(false);
    }
  };

  if (!user?.is_superuser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
          <p className="text-gray-600">Giriş qadağandır. Bu səhifə yalnız platforma rəhbərliyi üçündür.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Mətbəx (The Kitchen)</h1>
            <p className="text-gray-500 mt-1">Platforma idarəetmə paneli</p>
          </div>
          <Button variant="primary" onClick={() => setShowOnboardModal(true)}>
            + Yeni Mağaza Əlavə Et
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <StatCard title="Ümumi Mağaza" value={stats?.total_shops || 0} color="blue" />
          <StatCard title="Aktiv Mağaza" value={stats?.active_shops || 0} color="green" />
          <StatCard title="Yeni Müraciətlər" value={stats?.new_leads || 0} color="orange" />
          <StatCard title="Müddəti Bitmiş" value={stats?.expired_shops || 0} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Shops Table (Left 2/3) */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Mağazalar</h2>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">Yüklənir...</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider font-semibold">
                        <th className="px-6 py-4">Mağaza / Sahibi</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Əməliyyatlar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {shops.map((shop) => (
                        <tr key={shop.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              {shop.logo_url && (
                                <img 
                                  src={shop.logo_url} 
                                  alt={shop.name}
                                  className="h-10 w-10 rounded-lg object-cover border border-gray-100"
                                />
                              )}
                              <div>
                                <a
                                  href={`https://${shop.subdomain}.1line.az`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="font-medium text-gray-900 hover:text-primary-600 hover:underline transition-colors flex items-center gap-1"
                                >
                                  {shop.name}
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                  </svg>
                                </a>
                                <div className="text-xs text-primary-600 font-mono mt-0.5">
                                  {shop.subdomain}.1line.az ↗
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={shop.subscription_status} />
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              onClick={() => handleRenew(shop.id)}
                              className="text-xs font-semibold text-green-600 hover:text-green-700 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100"
                            >
                              +30 Gün
                            </button>
                            <button
                              onClick={() => handleToggleStatus(shop.id)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                                shop.is_active
                                ? 'text-red-600 hover:text-red-700 bg-red-50 border-red-100'
                                : 'text-blue-600 hover:text-blue-700 bg-blue-50 border-blue-100'
                              }`}
                            >
                              {shop.is_active ? 'Dayandır' : 'Aktivləşdir'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Leads Table (Right 1/3) */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-800">Son Müraciətlər</h2>
                {stats?.new_leads > 0 && (
                  <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2 py-1 rounded-full">
                    {stats.new_leads} yeni
                  </span>
                )}
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">Yüklənir...</div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                  {leads.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Hələ ki müraciət yoxdur.</div>
                  ) : (
                    leads.map((lead) => (
                      <div 
                        key={lead.id} 
                        className="p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        onClick={() => handleLeadClick(lead)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="font-bold text-gray-900">{lead.full_name}</div>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded leading-none ${
                            lead.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {lead.status === 'pending' ? 'Yeni' : lead.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-1">{lead.shop_name || 'Mağaza adı qeyd olunmayıb'}</div>
                        {lead.instagram_url && (
                          <a 
                            href={lead.instagram_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-pink-600 hover:text-pink-700 flex items-center gap-1 mb-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📷 Instagram ↗
                          </a>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <a
                            href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`}
                            target="_blank"
                            className="text-[10px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            WhatsApp ↗
                          </a>
                          <span className="text-[10px] text-gray-400">{new Date(lead.created_at).toLocaleDateString('az-AZ')}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden">
            <div className="bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Müraciət Detalları</h3>
                  <p className="text-primary-100 text-sm">{new Date(selectedLead.created_at).toLocaleString('az-AZ')}</p>
                </div>
                <button
                  onClick={handleCloseLeadDetail}
                  className="text-white/80 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-6 max-h-[70vh] overflow-y-auto">
              {/* Contact Info */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span>👤</span> Əlaqə Məlumatları
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Ad Soyad</span>
                    <span className="text-sm font-medium text-gray-900">{selectedLead.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">WhatsApp</span>
                    <a href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g,'')}`} target="_blank" className="text-sm text-green-600 hover:underline">
                      {selectedLead.whatsapp} ↗
                    </a>
                  </div>
                  {selectedLead.email && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Email</span>
                      <span className="text-sm text-gray-900">{selectedLead.email}</span>
                    </div>
                  )}
                  {selectedLead.phone && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Telefon</span>
                      <span className="text-sm text-gray-900">{selectedLead.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Business Info */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span>🏪</span> Mağaza Məlumatları
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Mağaza Adı</span>
                    <span className="text-sm font-medium text-gray-900">{selectedLead.shop_name || '-'}</span>
                  </div>
                  {selectedLead.shop_name_az && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Mağaza Adı (AZ)</span>
                      <span className="text-sm text-gray-900">{selectedLead.shop_name_az}</span>
                    </div>
                  )}
                  {selectedLead.instagram_url && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Instagram</span>
                      <a href={selectedLead.instagram_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                        Instagram ↗
                      </a>
                    </div>
                  )}
                  {selectedLead.category && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Kateqoriya</span>
                      <span className="text-sm text-gray-900 capitalize">{selectedLead.category}</span>
                    </div>
                  )}
                  {selectedLead.subdomain_preference && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Subdomen</span>
                      <span className="text-sm font-mono text-gray-900">{selectedLead.subdomain_preference}.1line.az</span>
                    </div>
                  )}
                  {selectedLead.google_maps_link && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Google Maps</span>
                      <a href={selectedLead.google_maps_link} target="_blank" className="text-sm text-blue-600 hover:underline">
                        Xəritədə Bax ↗
                      </a>
                    </div>
                  )}
                  {selectedLead.location_address && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Ünvan</span>
                      <span className="text-sm text-gray-900">{selectedLead.location_address}</span>
                    </div>
                  )}
                  {selectedLead.business_description && (
                    <div className="pt-2 border-t">
                      <span className="text-xs text-gray-500 block mb-1">Biznes Haqqında</span>
                      <p className="text-sm text-gray-700">{selectedLead.business_description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Brand Identity */}
              {(selectedLead.logo_url || selectedLead.primary_color) && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>🎨</span> Marka Kimliyi
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    {selectedLead.logo_url && (
                      <div className="mb-3">
                        <span className="text-xs text-gray-500 block mb-2">Loqo</span>
                        <img src={selectedLead.logo_url} alt="Logo" className="h-20 w-auto object-contain bg-white rounded-lg p-2 border" />
                      </div>
                    )}
                    {(selectedLead.primary_color || selectedLead.secondary_color) && (
                      <div className="flex gap-4">
                        {selectedLead.primary_color && (
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Əsas Rəng</span>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded border" style={{ backgroundColor: selectedLead.primary_color }} />
                              <span className="text-sm font-mono">{selectedLead.primary_color}</span>
                            </div>
                          </div>
                        )}
                        {selectedLead.secondary_color && (
                          <div>
                            <span className="text-xs text-gray-500 block mb-1">Köməkçi Rəng</span>
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded border" style={{ backgroundColor: selectedLead.secondary_color }} />
                              <span className="text-sm font-mono">{selectedLead.secondary_color}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Additional Info */}
              <div className="mb-6">
                <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <span>📊</span> Əlavə Məlumatlar
                </h4>
                <div className="bg-gray-50 rounded-xl p-4 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-500 block">Aylıq Gəlir</span>
                    <span className="text-sm font-medium">{selectedLead.current_revenue || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500 block">İşçi Sayı</span>
                    <span className="text-sm font-medium">{selectedLead.employee_count || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-xs text-gray-500 block">Onlayn Satış</span>
                    <span className="text-sm font-medium">{selectedLead.currently_selling_online ? '✅ Bəli' : '❌ Xeyr'}</span>
                  </div>
                  {selectedLead.other_platforms && (
                    <div className="col-span-2">
                      <span className="text-xs text-gray-500 block">Digər Platformalar</span>
                      <span className="text-sm text-gray-700">{selectedLead.other_platforms}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Payment & Delivery */}
              {(selectedLead.want_cod || selectedLead.want_millikart || selectedLead.delivery_cities) && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>💳</span> Ödəniş & Çatdırılma
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                    {/* Payment Methods */}
                    <div>
                      <span className="text-xs text-gray-500 block mb-2">Ödəniş Metodları</span>
                      <div className="flex flex-wrap gap-2">
                        {selectedLead.want_cod && (
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">💵 COD</span>
                        )}
                        {selectedLead.want_millikart && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">💳 MilliKart</span>
                        )}
                        {selectedLead.want_birbank && (
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">📱 BirBank</span>
                        )}
                        {selectedLead.want_pasha_pay && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-medium">💰 Pasha Pay</span>
                        )}
                      </div>
                    </div>
                    
                    {/* Delivery */}
                    {(selectedLead.delivery_courier || selectedLead.delivery_pickup) && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-2">Çatdırılma</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedLead.delivery_courier && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">🛵 Kuryer</span>
                          )}
                          {selectedLead.delivery_pickup && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">🏪 Mağazadan</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {selectedLead.delivery_cities && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Şəhərlər</span>
                        <p className="text-sm text-gray-700">{selectedLead.delivery_cities}</p>
                      </div>
                    )}
                    
                    {selectedLead.delivery_notes && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">Qeydlər</span>
                        <p className="text-sm text-gray-700">{selectedLead.delivery_notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Business Registration */}
              {(selectedLead.tax_id || selectedLead.iban) && (
                <div className="mb-6">
                  <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                    <span>📄</span> Biznes Məlumatları
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    {selectedLead.tax_id && (
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">VÖEN</span>
                        <span className="text-sm font-mono text-gray-900">{selectedLead.tax_id}</span>
                      </div>
                    )}
                    {selectedLead.legal_name && (
                      <div className="flex justify-between">
                        <span className="text-xs text-gray-500">Hüquqi Ad</span>
                        <span className="text-sm text-gray-900">{selectedLead.legal_name}</span>
                      </div>
                    )}
                    {selectedLead.iban && (
                      <div>
                        <span className="text-xs text-gray-500 block mb-1">IBAN</span>
                        <p className="text-sm font-mono text-gray-900">{selectedLead.iban}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="border-t px-6 py-4 bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedLead.screening_status === 'approved' ? 'bg-green-100 text-green-700' :
                  selectedLead.screening_status === 'rejected' ? 'bg-red-100 text-red-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  Status: {selectedLead.screening_status || 'pending'}
                </span>
                {selectedLead.status === 'onboarded' && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">
                    ✅ Shop Created
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                {selectedLead.status !== 'onboarded' ? (
                  <>
                    <button
                      onClick={() => handleDeleteLead(selectedLead.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-colors flex items-center gap-1"
                    >
                      🗑️ Sil
                    </button>
                    <button
                      onClick={() => handleCreateShopFromLead(selectedLead)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                    >
                      🏪 Create Shop
                    </button>
                  </>
                ) : (
                  <a
                    href={`http://localhost:5173/admin/shops/${selectedLead.shop_id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                  >
                    Go to Shop →
                  </a>
                )}
                <a
                  href={`https://wa.me/${selectedLead.whatsapp.replace(/\D/g,'')}`}
                  target="_blank"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors"
                >
                  WhatsApp
                </a>
                <button
                  onClick={() => {
                    // TODO: Mark as contacted
                    handleCloseLeadDetail();
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-colors"
                >
                  Əlaqə Saxlanıldı
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={showOnboardModal}
        onClose={() => setShowOnboardModal(false)}
        onSubmitSuccess={() => {
          setShowOnboardModal(false);
          fetchData();
        }}
      />

      {/* Credentials Modal */}
      {showCredentialsModal && createdShopCredentials && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 overflow-hidden">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-8 py-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">🎉 Shop Created Successfully!</h3>
                  <p className="text-green-100 text-sm mt-1">Share these credentials with the merchant</p>
                </div>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="text-white/80 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-8 space-y-6">
              {/* Shop Info */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-blue-900 mb-3">🏪 Shop Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-blue-700">Shop Name</span>
                    <span className="text-sm font-bold text-blue-900">{createdShopCredentials.shop.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-blue-700">Subdomain</span>
                    <span className="text-sm font-mono text-blue-900">{createdShopCredentials.shop.subdomain}.1line.az</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-blue-700">Shop URL</span>
                    <a href={createdShopCredentials.shop.url} target="_blank" className="text-sm text-blue-600 hover:underline">
                      {createdShopCredentials.shop.url} ↗
                    </a>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-blue-700">Admin Panel</span>
                    <a href={createdShopCredentials.shop.admin_url} target="_blank" className="text-sm text-blue-600 hover:underline">
                      {createdShopCredentials.shop.admin_url} ↗
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Owner Info */}
              <div className="bg-gray-50 border border-gray-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-gray-700 mb-3">👤 Owner Information</h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Name</span>
                    <span className="text-sm font-medium text-gray-900">{createdShopCredentials.owner.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500">Email</span>
                    <span className="text-sm text-gray-900">{createdShopCredentials.owner.email}</span>
                  </div>
                  {createdShopCredentials.owner.phone && (
                    <div className="flex justify-between">
                      <span className="text-xs text-gray-500">Phone</span>
                      <span className="text-sm text-gray-900">{createdShopCredentials.owner.phone}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Login Credentials */}
              <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-4">
                <h4 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <span>🔐</span> Login Credentials (Share with Merchant)
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-amber-700">Email</span>
                    <span className="text-sm font-mono bg-white px-3 py-1 rounded border border-amber-200">
                      {createdShopCredentials.credentials.email}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-amber-200">
                    <p className="text-xs text-amber-800 mb-2">
                      💡 Merchant sets their own password with this single-use link:
                    </p>
                    <a 
                      href={createdShopCredentials.credentials.setup_url}
                      target="_blank"
                      className="text-xs text-amber-600 hover:underline font-mono block truncate"
                    >
                      🔗 {createdShopCredentials.credentials.setup_url}
                    </a>
                  </div>
                </div>
              </div>
              
              {/* Instructions */}
              <div className="bg-green-50 border border-green-100 rounded-xl p-4">
                <h4 className="text-sm font-bold text-green-900 mb-2">📋 Next Steps:</h4>
                <ol className="space-y-1 text-xs text-green-800 list-decimal list-inside">
                  <li>Copy the setup link above</li>
                  <li>Send to merchant via WhatsApp or email</li>
                  <li>They open the link and set their password</li>
                  <li>They login at admin panel URL</li>
                  <li>Start managing their online shop! 🚀</li>
                </ol>
              </div>
            </div>
            
            <div className="border-t px-8 py-4 bg-gray-50 flex items-center justify-between">
              <button
                onClick={() => {
                  // Copy credentials to clipboard
                  const text = `
Shop: ${createdShopCredentials.shop.name}
URL: ${createdShopCredentials.shop.url}
Email: ${createdShopCredentials.credentials.email}
Set your password: ${createdShopCredentials.credentials.setup_url}
                  `.trim();
                  navigator.clipboard.writeText(text);
                  alert('Credentials copied to clipboard!');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-300 transition-colors"
              >
                📋 Copy Credentials
              </button>
              <div className="flex gap-2">
                <a
                  href={`https://wa.me/${createdShopCredentials.owner.phone?.replace(/\D/g,'') || ''}?text=${encodeURIComponent(createdShopCredentials.whatsapp_message)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-2 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-colors flex items-center gap-2"
                >
                  📱 Send via WhatsApp
                </a>
                <button
                  onClick={() => setShowCredentialsModal(false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    green: 'bg-green-50 text-green-700 border-green-100',
    orange: 'bg-orange-50 text-orange-700 border-orange-100',
    red: 'bg-red-50 text-red-700 border-red-100'
  };
  return (
    <div className={`p-6 rounded-2xl border ${colors[color]} shadow-sm`}>
      <h3 className="text-sm font-medium opacity-80">{title}</h3>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const meta = {
    trial: { label: 'Sınaq', class: 'bg-orange-100 text-orange-700' },
    active: { label: 'Aktiv', class: 'bg-green-100 text-green-700' },
    past_due: { label: 'Gecikmə', class: 'bg-red-100 text-red-700' },
    expired: { label: 'Bitib', class: 'bg-gray-100 text-gray-500' }
  };
  const current = meta[status] || { label: status, class: 'bg-gray-100 text-gray-700' };
  return (
    <span className={`px-2 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider ${current.class}`}>
      {current.label}
    </span>
  );
};
