import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../shared/components';
import { adminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';

export const ShopManagePage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [stats, setStats] = useState({ total_orders: 0, total_revenue: '0.00', pending_orders: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShopData();
  }, [shopId]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [shopData, productsData, statsData] = await Promise.all([
        adminApi.getShop(shopId),
        adminApi.getProducts(shopId),
        adminApi.getStats(shopId).catch(() => ({ total_orders: 0, total_revenue: 0 }))
      ]);
      
      setShop(shopData);
      if (statsData) setStats(statsData);
      
      let productsArray = [];
      if (Array.isArray(productsData)) productsArray = productsData;
      else if (productsData && Array.isArray(productsData.products)) productsArray = productsData.products;
      else if (productsData && Array.isArray(productsData.data)) productsArray = productsData.data;
      
      setProducts(productsArray);
    } catch (err) {
      console.error('❌ Failed to load shop data:', err);
      setError(err.response?.data?.detail || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) return;
    try {
      await adminApi.deleteProduct(shopId, productId);
      loadShopData();
    } catch (err) {
      alert('Məhsul silinərkən xəta baş verdi');
    }
  };

  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center"><div className="loading-spinner h-12 w-12 mx-auto mb-4" /><p className="text-gray-600">Yüklənir...</p></div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !shop) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Xəta və ya Mağaza Tapılmadı</h2>
          <Button onClick={() => navigate('/admin/dashboard')}>Panel-ə Qayıt</Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">Məhsul İdarəsi</h1>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="text-2xl font-black text-gray-900 font-mono">{products.length}</div>
            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">Məhsullar</div>
          </div>
          <div onClick={() => navigate(`/admin/shops/${shopId}/orders`)} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm cursor-pointer hover:border-gray-300 transition-colors flex justify-between items-center group">
            <div>
              <div className="text-2xl font-black text-gray-900 font-mono">{stats.total_orders || 0}</div>
              <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">Sifarişlər</div>
            </div>
            {stats.pending_orders > 0 && <span className="bg-orange-100 text-orange-800 text-xs font-bold px-2 py-1 rounded-lg">+{stats.pending_orders} Yeni</span>}
          </div>
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <div className="text-2xl font-black text-gray-900 font-mono">{formatPrice(stats.total_revenue)} ₼</div>
            <div className="text-gray-400 text-[10px] font-bold uppercase tracking-wider mt-1">Ümumi Gəlir</div>
          </div>
          <button onClick={() => { localStorage.setItem('dev_shop_subdomain', shop.subdomain); window.open(`http://localhost:5173`, '_blank'); }} className="bg-gray-950 hover:bg-gray-800 text-white rounded-xl p-5 shadow-sm flex flex-col justify-center transition-colors text-left group">
            <div className="font-bold text-sm">Mağazaya Bax</div>
            <div className="text-gray-400 text-[10px] mt-1 flex items-center gap-1 group-hover:underline"><span>{shop.subdomain}.1line.az</span> ↗</div>
          </button>
        </div>

        {/* ── Products Table Section ── */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-50 flex justify-between items-center">
            <h2 className="text-base font-bold text-gray-900">Məhsul Siyahısı</h2>
            <button
              onClick={() => navigate(`/admin/shops/${shopId}/products/new`)}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm transition"
            >
              + Əlavə Et
            </button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">📦</p>
              <h3 className="text-sm font-bold text-gray-900 mb-1">Məhsul tapılmadı</h3>
              <p className="text-xs text-gray-400 mb-4">İlk məhsulunuzu əlavə edərək satışa başlayın.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 text-[11px] uppercase tracking-wider font-bold">
                    <th className="px-6 py-3">ID</th>
                    <th className="px-6 py-3">Məhsul</th>
                    <th className="px-6 py-3">Kateqoriya</th>
                    <th className="px-6 py-3">Qiymət</th>
                    <th className="px-6 py-3">Stok (Satılan / Qalan)</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Əməliyyat</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 text-sm">
                  {products.map((item, index) => {
                    let images = [];
                    try { images = typeof item.images === 'string' ? JSON.parse(item.images) : item.images || []; } catch {}
                    const img = images[0];

                    // Standardize variant structure support
                    const variantsCount = Array.isArray(item.variants) ? item.variants.length : 0;
                    const totalSold = Array.isArray(item.variants) 
                      ? item.variants.reduce((acc, v) => acc + (v.sold_count || 0), 0) 
                      : 0;

                    return (
                      <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-gray-400">#{item.id || index + 1}</td>
                        <td className="px-6 py-4 flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-lg overflow-hidden border border-gray-100 flex-shrink-0 flex items-center justify-center">
                            {img ? <img src={img} alt={item.name} className="w-full h-full object-cover" /> : <span className="text-lg">📦</span>}
                          </div>
                          <div className="truncate max-w-[180px]">
                            <p className="font-bold text-gray-900 truncate text-xs">{item.name}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4"><span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.category || 'N/A'}</span></td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-900">
                          <span className="font-bold">{formatPrice(item.price)} ₼</span>
                          {item.compare_at_price && parseFloat(item.compare_at_price) > parseFloat(item.price) && (
                            <div className="text-[10px] text-gray-400 line-through mt-0.5">
                              {formatPrice(item.compare_at_price)} ₼
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs">
                            <span className="text-green-600 font-bold">{totalSold}</span> <span className="text-gray-300">/</span> <span className={`${item.inventory_count <= 5 ? 'text-red-500 font-bold' : 'text-gray-900'}`}>{item.inventory_count}</span>
                          </div>
                          {variantsCount > 0 && <p className="text-[10px] text-gray-400 mt-0.5">{variantsCount} variant</p>}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                            {item.is_active ? 'Aktiv' : 'Passiv'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/shops/${shopId}/products/${item.id}/variants`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 rounded border hover:border-blue-100 transition"
                              title="Variantlar"
                            >
                              🎨
                            </button>
                            <button
                              onClick={() => navigate(`/admin/shops/${shopId}/products/${item.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-gray-900 rounded border hover:border-gray-200 transition"
                              title="Redaktə"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(item.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded border hover:border-red-100 transition"
                              title="Sil"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </AdminLayout>
  );
};