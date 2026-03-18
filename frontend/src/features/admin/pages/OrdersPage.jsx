import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../shared/components';
import { adminApi } from '../../../shared/api';

const STATUS_META = {
  pending:    { label: 'Gözləyir',    color: 'bg-yellow-100 text-yellow-800',  dot: 'bg-yellow-400', pulse: true },
  confirmed:  { label: 'Təsdiqləndi', color: 'bg-blue-100 text-blue-800',     dot: 'bg-blue-400',   pulse: false },
  processing: { label: 'Hazırlanır',  color: 'bg-purple-100 text-purple-800', dot: 'bg-purple-400', pulse: false },
  shipped:    { label: 'Göndərildi',  color: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-400', pulse: false },
  delivered:  { label: 'Çatdırıldı', color: 'bg-green-100 text-green-800',   dot: 'bg-green-400',  pulse: false },
  cancelled:  { label: 'Ləğv edildi', color: 'bg-red-100 text-red-800',      dot: 'bg-red-400',    pulse: false },
};

export const OrdersPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  useEffect(() => { loadOrders(); }, [shopId, statusFilter, page]);
  useEffect(() => {
    const t = setTimeout(() => loadOrders(), 400);
    return () => clearTimeout(t);
  }, [search]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = { page, page_size: PAGE_SIZE };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await adminApi.getOrders(shopId, params);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const pendingCount = orders.filter(o => o.status === 'pending').length;
  const totalPages = Math.ceil(total / PAGE_SIZE) || 1;

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const formatPrice = (p) => parseFloat(p || 0).toFixed(2);

  return (
    <AdminLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sifarişlər</h1>
            <p className="text-sm text-gray-400 mt-0.5">{total} sifariş tapıldı</p>
          </div>
          {pendingCount > 0 && !statusFilter && (
            <button
              onClick={() => setStatusFilter('pending')}
              className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm font-bold px-4 py-2 rounded-xl hover:bg-yellow-100 transition-colors"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
              </span>
              {pendingCount} Gözləyən Sifariş
            </button>
          )}
        </div>

        {/* ── Filters ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col sm:flex-row gap-3 shadow-sm">
          <div className="relative flex-1">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Sifariş # və ya müştəri adı..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-600"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].map(s => {
              const meta = s ? STATUS_META[s] : null;
              const isActive = statusFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => { setStatusFilter(s); setPage(1); }}
                  className={`px-3 py-2 text-xs font-bold rounded-lg border transition-all
                    ${isActive
                      ? s === '' ? 'bg-gray-900 text-white border-gray-900' : `${meta.color} border-current`
                      : 'border-gray-200 text-gray-500 hover:border-gray-400'
                    }`}
                >
                  {s === '' ? 'Hamısı' : meta.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Order List ── */}
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-12 text-center">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm text-gray-400">Yüklənir...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-16 text-center">
              <p className="text-4xl mb-3">📋</p>
              <h3 className="font-bold text-gray-900 mb-1 text-sm">Sifariş tapılmadı</h3>
              <p className="text-xs text-gray-400">
                {search || statusFilter ? 'Axtarış kriteriyasına uyğun nəticə yoxdur.' : 'Hələ heç bir sifariş daxil olmayıb.'}
              </p>
              {statusFilter && (
                <button onClick={() => setStatusFilter('')} className="mt-3 text-xs text-blue-600 underline">Filtri sıfırla</button>
              )}
            </div>
          ) : (
            <div>
              {/* Table header */}
              <div className="grid grid-cols-12 gap-0 bg-gray-50 border-b border-gray-100 px-5 py-3">
                <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Sifariş</div>
                <div className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Müştəri</div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-gray-400 hidden md:block">Tarix</div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Məbləğ</div>
                <div className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">Status</div>
              </div>

              {/* Order rows */}
              <div className="divide-y divide-gray-50">
                {orders.map((order) => {
                  const meta = STATUS_META[order.status] || { label: order.status, color: 'bg-gray-100 text-gray-700', pulse: false };
                  const isPending = order.status === 'pending';
                  return (
                    <div
                      key={order.id}
                      onClick={() => navigate(`/admin/shops/${shopId}/orders/${order.id}`)}
                      className={`grid grid-cols-12 gap-0 px-5 py-4 cursor-pointer transition-colors hover:bg-gray-50
                        ${isPending ? 'border-l-4 border-yellow-400 bg-yellow-50/30 hover:bg-yellow-50/60' : 'border-l-4 border-transparent'}`}
                    >
                      <div className="col-span-3 flex items-center gap-2">
                        {isPending && (
                          <span className="relative flex h-2 w-2 flex-shrink-0">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500" />
                          </span>
                        )}
                        <span className="font-mono text-xs font-semibold text-gray-900">{order.order_number}</span>
                      </div>
                      <div className="col-span-3">
                        <p className="font-semibold text-gray-900 text-sm truncate">{order.customer_name}</p>
                        <p className="text-gray-400 text-xs">{order.customer_phone}</p>
                      </div>
                      <div className="col-span-2 hidden md:flex items-center">
                        <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className="font-bold text-gray-900 text-sm">{formatPrice(order.total)} ₼</span>
                      </div>
                      <div className="col-span-2 flex items-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${meta.color}`}>
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-400">Səhifə {page} / {totalPages}</p>
                  <div className="flex gap-2">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">← Əvvəlki</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                      className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50">Növbəti →</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};
