import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { Button } from '../../../shared/components/Button';

export const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    setCartItems(cart);
  };

  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    const updatedCart = cartItems.map(item =>
      item.product_id === productId
        ? { ...item, quantity: newQuantity }
        : item
    );

    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const removeItem = (productId) => {
    const updatedCart = cartItems.filter(item => item.product_id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const clearCart = () => {
    if (window.confirm('Səbəti təmizləmək istədiyinizə əminsiniz?')) {
      setCartItems([]);
      localStorage.setItem('cart', '[]');
      window.dispatchEvent(new Event('cartUpdated'));
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toFixed(2);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + (parseFloat(item.price) * item.quantity);
    }, 0);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateSubtotal();

  // Empty cart state
  if (cartItems.length === 0) {
    return (
      <StorefrontLayout>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="text-center">
            <div className="text-6xl mb-4">🛒</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Səbətiniz boşdur
            </h2>
            <p className="text-gray-600 mb-6">
              Məhsul əlavə edin və alış-verişə başlayın!
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/')}
            >
              Alış-verişə davam et
            </Button>
          </div>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Geri
          </button>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Səbət ({totalItems})
          </h1>

          <button
            onClick={clearCart}
            className="text-sm text-danger-600 hover:text-danger-700"
          >
            Təmizlə
          </button>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {cartItems.map((item) => (
            <div
              key={item.product_id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
            >
              <div className="flex">
                {/* Product Image */}
                <div
                  onClick={() => navigate(`/products/${item.product_id}`)}
                  className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                >
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <span className="text-2xl">📦</span>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 ml-4">
                  <h3
                    onClick={() => navigate(`/products/${item.product_id}`)}
                    className="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-primary-600"
                  >
                    {item.name}
                  </h3>
                  
                  <p className="text-lg font-bold text-primary-600 mb-2">
                    {formatPrice(item.price)} ₼
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {/* Decrease Button */}
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </button>

                      {/* Quantity Display */}
                      <span className="text-lg font-semibold text-gray-900 w-8 text-center">
                        {item.quantity}
                      </span>

                      {/* Increase Button */}
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeItem(item.product_id)}
                      className="text-danger-600 hover:text-danger-700 flex items-center text-sm"
                    >
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Sil
                    </button>
                  </div>

                  {/* Item Subtotal */}
                  <div className="mt-2 text-sm text-gray-600">
                    Cəmi: {formatPrice(parseFloat(item.price) * item.quantity)} ₼
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Sifariş xülasəsi</h3>
          
          <div className="space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Məhsullar ({totalItems} ədəd)</span>
              <span>{formatPrice(subtotal)} ₼</span>
            </div>
            
            <div className="flex justify-between text-gray-600">
              <span>Çatdırılma</span>
              <span>Hesablanacaq</span>
            </div>
            
            <div className="border-t border-gray-200 pt-2 mt-2">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Toplam</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatPrice(subtotal)} ₼
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="primary"
            onClick={() => navigate('/checkout')}
            className="w-full text-lg py-3"
          >
            Sifarişi rəsmiləşdir
          </Button>

          <Button
            variant="secondary"
            onClick={() => navigate('/')}
            className="w-full"
          >
            Alış-verişə davam et
          </Button>
        </div>

        {/* Payment Methods Info */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 text-center mb-2">
            Ödəniş üsulları
          </p>
          <div className="flex justify-center space-x-2">
            <span className="px-3 py-1 bg-white text-xs text-gray-700 rounded-full border border-gray-200">
              💵 Qapıda ödəniş
            </span>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
};
