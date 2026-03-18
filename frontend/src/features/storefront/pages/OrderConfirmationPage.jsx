import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { storefrontApi } from '../../../shared/api';

const STATUS_ORDER = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

const PAYMENT_METHOD_LABELS = {
  cash_on_delivery: 'Qapıda Nağd Ödəniş',
  millikart: 'MilliKart',
  birbank: 'BirBank',
  pasha_pay: 'Pasha Pay',
};

export const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [lookupPhone, setLookupPhone] = useState('');
  const [lookupError, setLookupError] = useState('');

  useEffect(() => {
    if (!order && orderNumber) {
      const savedPhone = localStorage.getItem('last_order_phone');
      if (savedPhone) fetchOrder(orderNumber, savedPhone);
    }
  }, [orderNumber]);

  const fetchOrder = async (num, ph) => {
    try {
      setLoading(true);
      setLookupError('');
      const orderData = await storefrontApi.trackOrder(num, ph);
      setOrder(orderData);
    } catch {
      setLookupError('Sifariş tapılmadı. Nömrə və ya telefonu yoxlayın.');
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = (e) => {
    e.preventDefault();
    if (!lookupPhone.trim()) return;
    fetchOrder(orderNumber, lookupPhone.trim());
  };

  const formatPrice = (p) => parseFloat(p || 0).toFixed(2);

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
        </div>
      </StorefrontLayout>
    );
  }

  // Lookup screen
  if (!order) {
    return (
      <StorefrontLayout>
        <div className="max-w-sm mx-auto px-4 py-20 text-center">
          <p className="text-4xl mb-4">📦</p>
          <h1 className="text-lg font-black text-gray-900 uppercase tracking-wider mb-1">Sifarişi Yoxla</h1>
          <p className="text-sm text-gray-400 mb-6">#{orderNumber}</p>
          <form onSubmit={handleLookup} className="space-y-3 text-left">
            <input
              type="tel"
              value={lookupPhone}
              onChange={e => setLookupPhone(e.target.value)}
              placeholder="+994 XX XXX XX XX"
              className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-gray-900"
            />
            {lookupError && <p className="text-red-500 text-xs">{lookupError}</p>}
            <button type="submit" className="w-full py-3 bg-gray-900 text-white font-bold text-sm uppercase tracking-widest rounded-lg">
              Tap
            </button>
          </form>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* ── Top Header ── */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-gray-900">Sifarişiniz üçün təşəkkür edirik!</h1>
          <p className="text-sm text-gray-400 mt-1">Sifariş #{order.order_number}</p>
        </div>

        {/* ── 2-Column Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

          {/* ── LEFT COLUMN ── */}
          <div className="space-y-5">

            {/* Order Status Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 text-green-600 rounded-full flex items-center justify-center flex-shrink-0 text-xl">
                  ✓
                </div>
                <div>
                  <h2 className="text-lg font-black text-gray-900 mb-0.5">Sifarişiniz qəbul edildi!</h2>
                  <p className="text-sm text-gray-500">
                    Sifariş məlumatları qeydə alındı. Mağaza yaxın zamanda sifarişinizi təsdiqləyib sizinlə əlaqə saxlayacaq. E-poçt (əgər qeyd etmisinizsə) və ya SMS vasitəsilə status dəyişiklikləri barədə məlumatlandırılacaqsınız.
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Info Card */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Çatdırılma Məlumatları</p>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Ad, Soyad</span>
                  <span className="font-semibold text-gray-900">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Telefon</span>
                  <span className="font-semibold text-gray-900">{order.customer_phone}</span>
                </div>
                {order.customer_email && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Email</span>
                    <span className="font-semibold text-gray-900">{order.customer_email}</span>
                  </div>
                )}
                <div className="border-t border-gray-50 pt-3 flex justify-between gap-4">
                  <span className="text-gray-400 flex-shrink-0">Ünvan</span>
                  <span className="font-semibold text-gray-900 text-right">
                    {order.shipping_city}{order.shipping_district ? `, ${order.shipping_district}` : ''}, {order.shipping_address}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-50 pt-3">
                  <span className="text-gray-400">Ödəniş</span>
                  <span className="font-semibold text-gray-900">{PAYMENT_METHOD_LABELS[order.payment_method] || order.payment_method}</span>
                </div>
              </div>
            </div>

            {/* Pickup receipt note */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm text-gray-600 flex items-start gap-3">
              <span className="text-xl flex-shrink-0">💡</span>
              <div>
                <p className="font-semibold text-gray-800 mb-1">Sifarişinizi aldıqda</p>
                <p className="text-xs text-gray-500">
                  Sifariş nömrənizi saxlayın: <span className="font-bold text-gray-900">#{order.order_number}</span>. Mağaza sizinlə əlaqə saxlayacaq, qəbuliyyat zamanı qapıda ödəyəcəksiniz.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 text-sm font-bold border-2 border-gray-200 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors rounded-xl"
              >
                Ana Səhifə
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-3 text-sm font-bold bg-gray-900 text-white hover:bg-gray-700 transition-colors rounded-xl"
              >
                🖨️ Çap Et
              </button>
            </div>
          </div>

          {/* ── RIGHT COLUMN: Order Details ── */}
          <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-50">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">Sifariş Detalları</p>
            </div>

            {/* Items */}
            <div className="divide-y divide-gray-50">
              {order.items?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 px-6 py-4">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="w-12 h-14 object-cover rounded-lg bg-gray-50 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-14 bg-gray-50 rounded-lg flex items-center justify-center text-gray-300 flex-shrink-0 text-lg">📦</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">{item.product_name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">× {item.quantity}</p>
                  </div>
                  <p className="text-sm font-bold text-gray-900 flex-shrink-0">{formatPrice(item.unit_price * item.quantity)} ₼</p>
                </div>
              ))}
            </div>

            {/* Totals */}
            <div className="px-6 py-5 bg-gray-50 border-t border-gray-100 space-y-2.5 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Ara cəm</span>
                <span>{formatPrice(order.subtotal)} ₼</span>
              </div>
              {parseFloat(order.shipping_fee) > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Çatdırılma</span>
                  <span>{formatPrice(order.shipping_fee)} ₼</span>
                </div>
              )}
              {parseFloat(order.discount) > 0 && (
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Endirim</span>
                  <span>-{formatPrice(order.discount)} ₼</span>
                </div>
              )}
              <div className="flex justify-between font-black text-gray-900 text-base pt-2.5 border-t border-gray-200">
                <span>Ümumi Toplam</span>
                <span>{formatPrice(order.total)} ₼</span>
              </div>
            </div>

            {/* Support link */}
            <div className="px-6 py-4 text-center">
              <p className="text-xs text-gray-400">
                Problemlə qarşılaşdınız?{' '}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`Sifariş nömrəm ${order.order_number} ilə bağlı sualım var.`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-gray-700 underline hover:text-gray-900"
                >
                  Bizimlə əlaqə saxlayın
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>
    </StorefrontLayout>
  );
};
