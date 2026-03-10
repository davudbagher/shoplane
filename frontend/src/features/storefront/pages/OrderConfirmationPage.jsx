import { useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { storefrontApi } from '../../../shared/api';

export const OrderConfirmationPage = () => {
  const { orderNumber } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);

  useEffect(() => {
    if (!order && orderNumber) {
      loadOrder();
    }
  }, [orderNumber]);

  const loadOrder = async () => {
    try {
      setLoading(true);
      const orderData = await storefrontApi.getOrder(orderNumber);
      setOrder(orderData);
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toFixed(2);
  };

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Yüklənir...</p>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!order) {
    return (
      <StorefrontLayout>
        <div className="max-w-2xl mx-auto px-4 py-12 text-center">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sifariş tapılmadı
          </h1>
          <p className="text-gray-600 mb-6">
            Bu sifariş nömrəsi mövcud deyil
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
          >
            Ana səhifəyə qayıt
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-success-100 rounded-full mb-4">
            <svg
              className="w-10 h-10 text-success-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ✅ Sifarişiniz qəbul edildi!
          </h1>
          
          <p className="text-gray-600 mb-1">
            Sifariş nömrəsi: <span className="font-semibold text-gray-900">#{order.order_number}</span>
          </p>
          
          <p className="text-sm text-gray-500">
            Tezliklə sizinlə əlaqə saxlayacağıq
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            📋 Sifariş detalları
          </h2>

          {/* Order Items */}
          <div className="space-y-3 mb-4">
            {order.items?.map((item, index) => (
              <div key={index} className="flex justify-between text-sm">
                <span className="text-gray-600">
                  {item.product_name} × {item.quantity}
                </span>
                <span className="font-medium text-gray-900">
                  {formatPrice(item.price * item.quantity)} ₼
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-gray-900">Toplam</span>
              <span className="text-2xl font-bold text-primary-600">
                {formatPrice(order.total_amount)} ₼
              </span>
            </div>
          </div>
        </div>

        {/* Delivery Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            🚚 Çatdırılma məlumatları
          </h2>

          <div className="space-y-2 text-sm">
            <div className="flex">
              <span className="text-gray-600 w-24">Ad, Soyad:</span>
              <span className="font-medium text-gray-900">{order.customer_full_name}</span>
            </div>
            
            <div className="flex">
              <span className="text-gray-600 w-24">Telefon:</span>
              <span className="font-medium text-gray-900">{order.customer_phone}</span>
            </div>
            
            {order.customer_email && (
              <div className="flex">
                <span className="text-gray-600 w-24">Email:</span>
                <span className="font-medium text-gray-900">{order.customer_email}</span>
              </div>
            )}
            
            <div className="flex">
              <span className="text-gray-600 w-24">Ünvan:</span>
              <span className="font-medium text-gray-900">
                {order.shipping_city}
                {order.shipping_district && `, ${order.shipping_district}`}
                <br />
                {order.shipping_address}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-2xl mr-3">💵</span>
            <div>
              <p className="font-medium text-gray-900">Ödəniş metodu</p>
              <p className="text-sm text-gray-600">Qapıda nağd ödəniş</p>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">📞 Növbəti addımlar:</h3>
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">1.</span>
              Mağaza sizinlə tezliklə əlaqə saxlayacaq
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">2.</span>
              Sifariş təsdiqlənəcək və hazırlanacaq
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">3.</span>
              Məhsul ünvanınıza çatdırılacaq
            </li>
            <li className="flex items-start">
              <span className="text-primary-600 mr-2">4.</span>
              Qəbul edərkən ödəniş edəcəksiniz
            </li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
          <button
            onClick={() => navigate('/')}
            className="flex-1 px-6 py-3 bg-white border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            🏠 Ana səhifə
          </button>
          
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            🖨️ Çap et
          </button>
        </div>
      </div>
    </StorefrontLayout>
  );
};

