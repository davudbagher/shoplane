import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../shared/components';
import { adminApi } from '../../../shared/api';

const STATUS_FLOW = [
  { key: 'pending',    label: 'Gözləyir',    color: 'bg-yellow-100 text-yellow-800',  next: 'confirmed',  nextLabel: '✅ Təsdiqlə',   nextColor: 'bg-blue-600' },
  { key: 'confirmed',  label: 'Təsdiqləndi', color: 'bg-blue-100 text-blue-800',     next: 'processing', nextLabel: '📦 Hazırlamağa Başla', nextColor: 'bg-purple-600' },
  { key: 'processing', label: 'Hazırlanır',  color: 'bg-purple-100 text-purple-800',  next: 'shipped',    nextLabel: '🚚 Göndər',    nextColor: 'bg-indigo-600' },
  { key: 'shipped',    label: 'Göndərildi',  color: 'bg-indigo-100 text-indigo-800',  next: 'delivered',  nextLabel: '🎉 Çatdırıldı!', nextColor: 'bg-green-600' },
  { key: 'delivered',  label: 'Çatdırıldı', color: 'bg-green-100 text-green-800',    next: null,         nextLabel: null,             nextColor: null },
  { key: 'cancelled',  label: 'Ləğv edildi', color: 'bg-red-100 text-red-800',       next: null,         nextLabel: null,             nextColor: null },
];

const WHATSAPP_MESSAGES = {
  pending:    (order) => `Salam ${order.customer_name}! 👋\n\nSifarişinizi (*#${order.order_number}*) qəbul etdik.\n\nSifariş detallarını dəqiqləşdirmək üçün sizinlə əlaqə saxlayırıq. Toplam məbləğ: ${order.total} ₼.\n\nTəsdiqləyirsiz?`,
  confirmed:  (order) => `Salam ${order.customer_name}! 👋\n\n✅ Sifarişiniz *#${order.order_number}* təsdiqləndi.\n\nYaxın zamanda hazırlamağa başlayacağıq. Hər hansı sual üçün əlaqə saxlayın.`,
  processing: (order) => `Salam ${order.customer_name}! 📦\n\nSifarişiniz *#${order.order_number}* hazırlanır.\n\nTezliklə sizə çatdıracağıq!`,
  shipped:    (order) => `Salam ${order.customer_name}! 🚚\n\nSifarişiniz *#${order.order_number}* yola düşdü!\n\nÜnvan: ${order.shipping_city}, ${order.shipping_address}\n\nƏlaqə üçün həmişə buradayıq.`,
  delivered:  (order) => `Salam ${order.customer_name}! 🎉\n\nSifarişiniz *#${order.order_number}* uğurla çatdırıldı.\n\nAlış-verişiniz üçün təşəkkür edirik! Yenidən görüşənədək 🛍️`,
  cancelled:  (order) => `Salam ${order.customer_name}.\n\nTəəssüf ki, sifarişiniz *#${order.order_number}* ləğv edildi.\n\nSəbəbi haqqında ətraflı məlumat üçün bizimlə əlaqə saxlayın.`,
};

export const OrderDetailPage = () => {
  const { shopId, orderId } = useParams();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [error, setError] = useState('');
  const [justUpdated, setJustUpdated] = useState(false);

  useEffect(() => { loadOrder(); }, [orderId]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const data = await adminApi.getOrder(shopId, orderId);
      setOrder(data);
      setAdminNotes(data.admin_notes || '');
    } catch {
      setError('Sifariş yüklənərkən xəta baş verdi.');
    } finally {
      setLoading(false);
    }
  };

  const statusInfo = order ? STATUS_FLOW.find(s => s.key === order.status) : null;

  const handleAdvanceStatus = async () => {
    if (!statusInfo?.next) return;
    setUpdating(true);
    try {
      const updated = await adminApi.updateOrderStatus(shopId, orderId, {
        status: statusInfo.next,
        admin_notes: adminNotes || undefined,
      });
      setOrder(updated);
      setJustUpdated(true);
      setTimeout(() => setJustUpdated(false), 2500);
    } catch (err) {
      alert(err?.response?.data?.detail || 'Status yenilənərkən xəta baş verdi.');
    } finally {
      setUpdating(false);
    }
  };

  const handleSetStatus = async (newStatus) => {
    if (newStatus === order.status) return;
    setUpdating(true);
    try {
      const updated = await adminApi.updateOrderStatus(shopId, orderId, {
        status: newStatus,
        admin_notes: adminNotes || undefined,
      });
      setOrder(updated);
    } catch (err) {
      alert(err?.response?.data?.detail || 'Status yenilənərkən xəta baş verdi.');
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!window.confirm('Bu sifarişi ləğv etmək istədiyinizə əminsiniz?')) return;
    await handleSetStatus('cancelled');
  };

  const openWhatsApp = (status) => {
    if (!order) return;
    const phone = order.customer_phone.replace(/\D/g, '');
    const msg = WHATSAPP_MESSAGES[status]?.(order) || `Sifarişiniz #${order.order_number} haqqında məlumat.`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleString('az-AZ', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };
  const formatPrice = (p) => parseFloat(p || 0).toFixed(2);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (error || !order) {
    return (
      <AdminLayout>
        <div className="text-center py-16">
          <p className="text-4xl mb-3">❌</p>
          <p className="text-gray-600 mb-4">{error || 'Sifariş tapılmadı.'}</p>
          <button onClick={() => navigate(-1)} className="text-sm underline text-gray-600">Geri qayıt</button>
        </div>
      </AdminLayout>
    );
  }

  const currentStatusInfo = STATUS_FLOW.find(s => s.key === order.status);
  const whatsappAvailable = WHATSAPP_MESSAGES[order.status];

  return (
    <AdminLayout>
      <div className="max-w-5xl space-y-6">

        {/* ── Header ── */}
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(`/admin/shops/${shopId}/orders`)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900 font-mono">{order.order_number}</h1>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${currentStatusInfo?.color || 'bg-gray-100 text-gray-700'}`}>
                {currentStatusInfo?.label || order.status}
              </span>
              {justUpdated && (
                <span className="text-xs text-green-600 font-semibold animate-fade-in">✓ Yeniləndi!</span>
              )}
            </div>
            <p className="text-sm text-gray-400 mt-0.5">{formatDate(order.created_at)}</p>
          </div>
          {/* ── Primary Action Button ── */}
          {currentStatusInfo?.next && (
            <button
              onClick={handleAdvanceStatus}
              disabled={updating}
              className={`px-6 py-2.5 text-white text-sm font-bold rounded-xl shadow-sm transition-all ${currentStatusInfo.nextColor} hover:opacity-90 disabled:opacity-50`}
            >
              {updating ? 'Yenilənir...' : currentStatusInfo.nextLabel}
            </button>
          )}
        </div>

        {/* ── WhatsApp Quick Notification Banner ── */}
        {whatsappAvailable && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💬</span>
              <div>
                <p className="text-sm font-bold text-green-900">WhatsApp Bildirişi Göndər</p>
                <p className="text-xs text-green-700">Müştəriyə sifariş statusunu bildirin: {order.customer_phone}</p>
              </div>
            </div>
            <button
              onClick={() => openWhatsApp(order.status)}
              className="flex-shrink-0 bg-green-600 text-white text-xs font-bold px-4 py-2.5 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              WhatsApp Aç
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left 2/3: Order Items + Status Controls ── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Order Items */}
            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
              <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                <h2 className="font-bold text-gray-900 text-sm">Sifariş Olunan Məhsullar</h2>
                <span className="text-xs text-gray-400">{order.items?.length} məhsul</span>
              </div>
              <div className="divide-y divide-gray-50">
                {(order.items || []).map((item, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-4">
                    <div className="w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0">
                      {item.product_image ? (
                        <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300 text-xl">📦</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate text-sm">{item.product_name}</p>
                      <p className="text-xs text-gray-400">{item.quantity} ədəd × {formatPrice(item.unit_price)} ₼</p>
                    </div>
                    <p className="font-bold text-gray-900 flex-shrink-0">{formatPrice(item.total_price)} ₼</p>
                  </div>
                ))}
              </div>
              <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 space-y-2 text-sm">
                <div className="flex justify-between text-gray-500"><span>Ara cəm</span><span>{formatPrice(order.subtotal)} ₼</span></div>
                {parseFloat(order.shipping_fee) > 0 && (
                  <div className="flex justify-between text-gray-500"><span>Çatdırılma</span><span>{formatPrice(order.shipping_fee)} ₼</span></div>
                )}
                {parseFloat(order.discount) > 0 && (
                  <div className="flex justify-between text-green-600 font-semibold"><span>Endirim</span><span>-{formatPrice(order.discount)} ₼</span></div>
                )}
                <div className="flex justify-between font-black text-gray-900 text-base pt-2 border-t border-gray-200">
                  <span>Toplam</span>
                  <span>{formatPrice(order.total)} ₼</span>
                </div>
              </div>
            </div>

            {/* Status Control */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 text-sm mb-4">Statusu Dəyişdir</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                {STATUS_FLOW.filter(s => s.key !== 'cancelled').map(s => (
                  <button
                    key={s.key}
                    onClick={() => handleSetStatus(s.key)}
                    disabled={updating || s.key === order.status}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border-2 disabled:cursor-not-allowed
                      ${s.key === order.status
                        ? `${s.color} border-current`
                        : 'border-gray-200 text-gray-500 hover:border-gray-400'}`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <textarea
                placeholder="Admin qeydi (istəyə bağlı)..."
                value={adminNotes}
                onChange={e => setAdminNotes(e.target.value)}
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-gray-600 resize-none mb-3"
              />
              {order.status !== 'cancelled' && order.status !== 'delivered' && (
                <button onClick={handleCancel} className="text-xs text-red-500 hover:text-red-700 font-semibold">
                  🚫 Sifarişi ləğv et
                </button>
              )}
            </div>
          </div>

          {/* ── Right 1/3: Customer + Delivery + Payment ── */}
          <div className="space-y-5">

            {/* Customer Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 text-sm mb-3">Müştəri</h2>
              <div className="space-y-2.5 text-sm">
                <p className="font-semibold text-gray-900">{order.customer_name}</p>
                <a href={`tel:${order.customer_phone}`} className="flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium">
                  📞 {order.customer_phone}
                </a>
                {order.customer_email && (
                  <a href={`mailto:${order.customer_email}`} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-xs truncate">
                    ✉️ {order.customer_email}
                  </a>
                )}
                {/* WhatsApp quick link */}
                <button
                  onClick={() => openWhatsApp('confirmed')}
                  className="w-full mt-1 flex items-center justify-center gap-2 py-2 bg-green-50 text-green-700 text-xs font-bold rounded-lg hover:bg-green-100 transition-colors border border-green-200"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.940 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.570-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.570-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp ilə Əlaqə
                </button>
              </div>
            </div>

            {/* Delivery */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 text-sm mb-3">Çatdırılma Ünvanı</h2>
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-semibold text-gray-900">{order.shipping_city}{order.shipping_district ? `, ${order.shipping_district}` : ''}</p>
                <p>{order.shipping_address}</p>
                {order.shipping_postal_code && <p className="text-xs text-gray-400">AZ-{order.shipping_postal_code}</p>}
                {order.delivery_notes && (
                  <p className="mt-2 p-2 bg-yellow-50 text-yellow-800 rounded-lg text-xs">💬 {order.delivery_notes}</p>
                )}
              </div>
            </div>

            {/* Payment */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h2 className="font-bold text-gray-900 text-sm mb-3">Ödəniş</h2>
              <div className="text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-400">Üsul</span>
                  <span className="font-semibold text-gray-900">
                    {order.payment_method === 'cash_on_delivery' ? '💵 Qapıda' : order.payment_method}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Status</span>
                  <span className={`font-semibold text-xs px-2 py-0.5 rounded-full ${order.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.payment_status === 'completed' ? '✓ Ödənilib' : '⏳ Gözləyir'}
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </AdminLayout>
  );
};
