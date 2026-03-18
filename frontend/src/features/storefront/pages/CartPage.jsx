import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { storefrontApi } from '../../../shared/api/storefront';

export const CartPage = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [couponMessage, setCouponMessage] = useState('');
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);

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
      item.product_id === productId ? { ...item, quantity: newQuantity } : item
    );
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    // Reset coupon if cart changes since it might invalidate
    setDiscountAmount(0);
    setCouponMessage('');
    localStorage.removeItem('cart_coupon');
  };

  const removeItem = (productId) => {
    const updatedCart = cartItems.filter(item => item.product_id !== productId);
    setCartItems(updatedCart);
    localStorage.setItem('cart', JSON.stringify(updatedCart));
    window.dispatchEvent(new Event('cartUpdated'));
    // Reset coupon if cart changes
    setDiscountAmount(0);
    setCouponMessage('');
    localStorage.removeItem('cart_coupon');
  };

  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsApplyingCoupon(true);
    setCouponMessage('');
    try {
      const items = cartItems.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: parseFloat(i.price) }));
      const res = await storefrontApi.validateCoupon({ code: couponCode.trim(), items });
      if (res.is_valid) {
        setDiscountAmount(parseFloat(res.discount_amount));
        setCouponMessage({ type: 'success', text: res.message });
        localStorage.setItem('cart_coupon', couponCode.trim());
      } else {
        setDiscountAmount(0);
        setCouponMessage({ type: 'error', text: res.message });
        localStorage.removeItem('cart_coupon');
      }
    } catch (err) {
      setDiscountAmount(0);
      setCouponMessage({ type: 'error', text: 'Kupon yoxlanarkən xəta baş verdi' });
      localStorage.removeItem('cart_coupon');
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = calculateSubtotal();
  const finalTotal = Math.max(0, subtotal - discountAmount);

  if (cartItems.length === 0) {
    return (
      <StorefrontLayout>
        <div className="max-w-2xl mx-auto px-6 py-24 text-center">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2 uppercase tracking-wide">Səbətiniz boşdur</h2>
          <p className="text-gray-500 mb-6 text-sm">Alış-verişə davam edərək bəyəndiyiniz məhsulları əlavə edin.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-950 text-white font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition"
          >
            Məhsullara Bax
          </button>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-xl font-black uppercase tracking-wider text-gray-900 mb-8 border-b pb-4">Səbət ({totalItems})</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ── 1. Items List (Left Side - 2/3 width) ── */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.product_id}
                className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow relative"
              >
                {/* Product Image */}
                <div
                  onClick={() => navigate(`/products/${item.product_id}`)}
                  className="w-20 h-24 bg-gray-50 overflow-hidden rounded-lg cursor-pointer flex-shrink-0"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No pic</div>
                  )}
                </div>

                {/* Product Info & Controls Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                  <div>
                    <h3
                      onClick={() => navigate(`/products/${item.product_id}`)}
                      className="font-bold text-gray-900 text-sm hover:text-gray-600 cursor-pointer truncate"
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs text-gray-400 mt-1 uppercase tracking-tight">Variant: Standart</p>
                  </div>

                  {/* Quantity Counter */}
                  <div className="flex items-center md:justify-center">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden h-9">
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        className="px-3 text-gray-500 hover:bg-gray-50 disabled:opacity-30"
                        disabled={item.quantity <= 1}
                      >−</button>
                      <span className="w-8 text-center text-xs font-bold text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        className="px-3 text-gray-500 hover:bg-gray-50"
                      >+</button>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <p className="font-bold text-gray-950 text-sm font-mono">{formatPrice(parseFloat(item.price) * item.quantity)} ₼</p>
                    {item.quantity > 1 && (
                      <p className="text-gray-400 text-[11px] font-mono mt-0.5">({formatPrice(item.price)} ₼ / ədəd)</p>
                    )}
                  </div>
                </div>

                {/* Remove Mini-trigger */}
                <button
                  onClick={() => removeItem(item.product_id)}
                  className="absolute top-2 right-2 text-gray-400 hover:text-red-600 transition-colors p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}

            <div className="pt-2">
              <button onClick={() => navigate('/')} className="text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-gray-900 transition-colors">
                ← Alış-verişə Davam Et
              </button>
            </div>
          </div>

          {/* ── 2. Summary & Coupons (Right Side - 1/3 width) ── */}
          <div className="lg:col-span-1 space-y-4">
            
            {/* Coupon Code Selection placeholder */}
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3">Kupon Kodu</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Kodu daxil edin"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 uppercase"
                />
                <button 
                  onClick={handleApplyCoupon}
                  disabled={isApplyingCoupon || !couponCode.trim()}
                  className="px-4 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-800 text-xs font-bold rounded-lg transition"
                >
                  {isApplyingCoupon ? '...' : 'Tətbiq Et'}
                </button>
              </div>
              {couponMessage && (
                <p className={`text-[10px] mt-2 font-medium ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {couponMessage.text}
                </p>
              )}
            </div>

            {/* Price Detail Breakdown Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">Sifariş Xülasəsi</h3>
              
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between items-center">
                  <span className="text-xs">Məhsul Sayı</span>
                  <span className="font-semibold text-gray-900">{totalItems} ədəd</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs">Cəmi</span>
                  <span className="font-semibold text-gray-900 font-mono">{formatPrice(subtotal)} ₼</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-xs font-bold">Endirim</span>
                    <span className="font-bold font-mono">-{formatPrice(discountAmount)} ₼</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-xs">Çatdırılma</span>
                  <span className="text-gray-900 font-bold uppercase text-[11px]">Dəyişə bilər</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-900 uppercase">Toplam</span>
                <span className="text-xl font-black text-gray-950 font-mono">{formatPrice(finalTotal)} ₼</span>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3.5 bg-gray-950 text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-gray-800 transition shadow-sm mt-4 flex items-center justify-center gap-2"
              >
                SİFARİŞİ RƏSMİLƏŞDİR
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </button>
            </div>

            {/* Information notice */}
            <div className="p-4 bg-gray-50 rounded-xl text-center space-y-2 border border-gray-100">
              <p className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider mb-1">Ödəniş Təhlükəsizliyi</p>
              <div className="flex justify-center gap-1.5 flex-wrap">
                <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-400 text-[9px] rounded font-bold uppercase">💵 Qapıda Ödəniş</span>
                <span className="px-2 py-0.5 bg-white border border-gray-200 text-gray-400 text-[9px] rounded font-bold uppercase">💳 Kartla Ödəniş (Tezliklə)</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
};
