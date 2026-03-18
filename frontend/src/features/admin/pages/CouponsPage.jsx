import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AdminLayout } from '../../../shared/components';
import { adminApi } from '../../../shared/api';

export const CouponsPage = () => {
    const { shopId } = useParams();
    const [coupons, setCoupons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Form states for Create
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        discount_type: 'percentage',
        discount_value: '',
        scope: 'all_products',
        applicable_product_ids: [],
        starts_at: '',
        ends_at: '',
        usage_limit: ''
    });

    useEffect(() => {
        fetchCoupons();
    }, [shopId]);

    const fetchCoupons = async () => {
        try {
            setIsLoading(true);
            const data = await adminApi.getCoupons(shopId);
            setCoupons(data);
        } catch (err) {
            setError('Kuponlar yüklənərkən xəta baş verdi');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateCoupon = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newCoupon };
            
            // Format dates or exclude if empty
            if (!payload.starts_at) delete payload.starts_at;
            else payload.starts_at = new Date(payload.starts_at).toISOString();
            
            if (!payload.ends_at) delete payload.ends_at;
            else payload.ends_at = new Date(payload.ends_at).toISOString();
            
            if (!payload.usage_limit) delete payload.usage_limit;
            else payload.usage_limit = parseInt(payload.usage_limit);

            payload.discount_value = parseFloat(payload.discount_value);

            await adminApi.createCoupon(shopId, payload);
            
            setIsCreateModalOpen(false);
            setNewCoupon({
                code: '',
                discount_type: 'percentage',
                discount_value: '',
                scope: 'all_products',
                applicable_product_ids: [],
                starts_at: '',
                ends_at: '',
                usage_limit: ''
            });
            fetchCoupons();
        } catch (err) {
            alert('Kupon yaradılarkən xəta: ' + (err.response?.data?.detail || err.message));
        }
    };

    const handleDeleteCoupon = async (id) => {
        if (!window.confirm('Bu kuponu silmək istədiyinizə əminsiniz?')) return;
        try {
            await adminApi.deleteCoupon(shopId, id);
            fetchCoupons();
        } catch (err) {
            alert('Silinmə xətası');
        }
    };

    return (
        <AdminLayout>
            <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Kuponlar (Endirimlər)</h1>
                        <p className="text-sm text-gray-500 mt-1">Mağazanız üçün endirim kodlarını idarə edin</p>
                    </div>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center gap-2"
                    >
                        <span>➕</span> Yeni Kupon
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Yüklənir...</div>
                ) : error ? (
                    <div className="text-center py-12 text-red-500">{error}</div>
                ) : coupons.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl border border-gray-100 shadow-sm">
                        <div className="text-4xl mb-3">🎟️</div>
                        <h3 className="text-lg font-medium text-gray-900">Kupon yoxdur</h3>
                        <p className="text-sm text-gray-500 mt-1">İlk endirim kuponunu yaratmaq üçün yuxarıdakı düyməni sıxın.</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kod</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Tip</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Dəyər</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Göstərici (Scope)</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">İstifadə</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Əməliyyatlar</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {coupons.map(coupon => (
                                    <tr key={coupon.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-sm text-gray-900">{coupon.code}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {coupon.discount_type === 'percentage' ? 'Faiz (%)' : 'Sabit Məbləğ'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                            {coupon.discount_type === 'percentage' ? `${coupon.discount_value}%` : `${coupon.discount_value} AZN`}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {coupon.scope === 'all_products' ? 'Bütün Məhsullar' : 'Xüsusi Məhsullar'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {coupon.usage_count} {coupon.usage_limit ? `/ ${coupon.usage_limit}` : ''}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${coupon.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {coupon.is_active ? 'Aktiv' : 'Passiv'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button 
                                                onClick={() => handleDeleteCoupon(coupon.id)}
                                                className="text-red-600 hover:text-red-900"
                                            >
                                                Sil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Create Coupon Modal */}
                {isCreateModalOpen && (
                    <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 m-4">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Yeni Kupon Yarat</h2>
                            <form onSubmit={handleCreateCoupon} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Kupon Kodu</label>
                                    <input 
                                        type="text" required
                                        value={newCoupon.code}
                                        onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                                        className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        placeholder="Məs: GYM20"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Növü</label>
                                        <select 
                                            value={newCoupon.discount_type}
                                            onChange={e => setNewCoupon({...newCoupon, discount_type: e.target.value})}
                                            className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        >
                                            <option value="percentage">Faiz (%)</option>
                                            <option value="fixed_amount">Sabit AZN</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Dəyər</label>
                                        <input 
                                            type="number" required min="0.01" step="0.01"
                                            value={newCoupon.discount_value}
                                            onChange={e => setNewCoupon({...newCoupon, discount_value: e.target.value})}
                                            className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm"
                                            placeholder="20"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Göstərici (Scope)</label>
                                    <select 
                                        value={newCoupon.scope}
                                        onChange={e => setNewCoupon({...newCoupon, scope: e.target.value})}
                                        className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm"
                                    >
                                        <option value="all_products">Bütün Məhsullar</option>
                                        <option value="specific_products">Xüsusi Məhsullar (Tezliklə)</option>
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Başlama</label>
                                        <input 
                                            type="date"
                                            value={newCoupon.starts_at}
                                            onChange={e => setNewCoupon({...newCoupon, starts_at: e.target.value})}
                                            className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Bitiş</label>
                                        <input 
                                            type="date"
                                            value={newCoupon.ends_at}
                                            onChange={e => setNewCoupon({...newCoupon, ends_at: e.target.value})}
                                            className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Limit (Say)</label>
                                    <input 
                                        type="number" min="1"
                                        value={newCoupon.usage_limit}
                                        onChange={e => setNewCoupon({...newCoupon, usage_limit: e.target.value})}
                                        className="mt-1 block w-full border border-gray-300 rounded-lg p-2 text-sm"
                                        placeholder="Limitsiz"
                                    />
                                </div>

                                <div className="flex justify-end gap-3 mt-6">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                                    >
                                        Ləğv et
                                    </button>
                                    <button 
                                        type="submit"
                                        className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm"
                                    >
                                        Yarat
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
};
