import { useState, useEffect } from 'react';
import { useAuth } from '../../../shared/contexts/AuthContext';
import { superAdminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';
import { Input } from '../../../shared/components/Input';

export const PlatformDashboard = () => {
  const { user } = useAuth();
  const [shops, setShops] = useState([]);
  const [leads, setLeads] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  
  // Onboarding Form State
  const [onboardData, setOnboardData] = useState({
    email: '',
    full_name: '',
    shop_name: '',
    subdomain: '',
    plan_type: 'standard'
  });
  const [onboardLoading, setOnboardLoading] = useState(false);
  const [error, setError] = useState(null);

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
                            <div className="font-medium text-gray-900">{shop.name}</div>
                            <div className="text-xs text-primary-600 font-mono">{shop.subdomain}.1line.az</div>
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
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-800">Son Müraciətlər</h2>
              </div>
              {loading ? (
                <div className="p-12 text-center text-gray-400">Yüklənir...</div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {leads.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-sm">Hələ ki müraciət yoxdur.</div>
                  ) : (
                    leads.map((lead) => (
                      <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex justify-between items-start mb-1">
                          <div className="font-bold text-gray-900">{lead.full_name}</div>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded leading-none ${
                            lead.status === 'pending' ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'
                          }`}>
                            {lead.status === 'pending' ? 'Yeni' : lead.status}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-2">{lead.shop_name || 'Mağaza adı qeyd olunmayıb'}</div>
                        <div className="flex items-center justify-between mt-3">
                           <a 
                             href={`https://wa.me/${lead.whatsapp.replace(/\D/g,'')}`}
                             target="_blank"
                             className="text-[10px] font-bold text-green-600 hover:text-green-700 flex items-center gap-1"
                           >
                             WhatsApp ↗
                           </a>
                           <span className="text-[10px] text-gray-400">{new Date(lead.created_at).toLocaleDateString()}</span>
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

      {/* Onboarding Modal Overlay */}
      {showOnboardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all">
            <div className="p-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Yeni Mağaza Onboarding</h3>
              
              <form onSubmit={handleOnboardSubmit} className="space-y-4">
                <Input
                  label="Sahibinin adı"
                  placeholder="Məs. Davud Bağırov"
                  value={onboardData.full_name}
                  onChange={(e) => setOnboardData({...onboardData, full_name: e.target.value})}
                  required
                />
                <Input
                  label="Sahibinin Email-i"
                  type="email"
                  placeholder="email@example.com"
                  value={onboardData.email}
                  onChange={(e) => setOnboardData({...onboardData, email: e.target.value})}
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="Mağaza Adı"
                    placeholder="Boutique Name"
                    value={onboardData.shop_name}
                    onChange={(e) => setOnboardData({...onboardData, shop_name: e.target.value})}
                    required
                  />
                  <Input
                    label="Subdomen"
                    placeholder="shopname"
                    value={onboardData.subdomain}
                    onChange={(e) => setOnboardData({...onboardData, subdomain: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Plan növü</label>
                  <select 
                    className="w-full h-12 rounded-xl border-gray-200 focus:border-primary-500 focus:ring-primary-500 transition-shadow bg-gray-50 border px-4"
                    value={onboardData.plan_type}
                    onChange={(e) => setOnboardData({...onboardData, plan_type: e.target.value})}
                  >
                    <option value="standard">Standard (29 AZN)</option>
                    <option value="pro">Pro (39 AZN - Custom Domain)</option>
                  </select>
                </div>

                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

                <div className="flex gap-4 pt-6">
                  <Button variant="outline" className="flex-1" onClick={() => setShowOnboardModal(false)} type="button">
                    Ləğv et
                  </Button>
                  <Button variant="primary" className="flex-1" type="submit" loading={onboardLoading}>
                    Mağaza Yarat
                  </Button>
                </div>
              </form>
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
