import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StorefrontLayout } from "../components/StorefrontLayout";
import { storefrontApi } from "../../../shared/api";

export const CheckoutPage = () => {
  const navigate = useNavigate();

  // Cart & Shop state
  const [cartItems, setCartItems] = useState([]);
  const [shop, setShop] = useState(null);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  // Delivery type: 'courier' or 'pickup'
  const [deliveryType, setDeliveryType] = useState('courier');

  // Form state
  const [formData, setFormData] = useState({
    customer_full_name: "",
    customer_phone: "",
    customer_email: "",
    shipping_city: "Bakı",
    shipping_district: "",
    shipping_address: "",
    shipping_postal_code: "",
    delivery_notes: "",
    pickup_point: "", // New field for hardcoded pick up spots
    payment_method: "cash_on_delivery",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Hardcoded delivery/pickup points
  const pickupPoints = [
    "Birmarket Elmlər Akademiyası (Z.Xəlilov küç.)",
    "Birmarket Gənclik (Atatürk pr.)",
    "Birmarket Sahil (Ü.Hacıbəyov küç.)",
    "Birmarket Nərimanov (Təbriz küç.)",
  ];

  const cities = ["Bakı", "Gəncə", "Sumqayıt", "Mingəçevir", "Şəki", "Lənkəran", "Digər"];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    if (cart.length === 0) return navigate("/cart");
    setCartItems(cart);

    try {
      const shopData = await storefrontApi.getShop();
      setShop(shopData);
    } catch (err) {
      console.error("Failed to load shop:", err);
    }

    // Load any applied coupon from cart
    const savedCoupon = localStorage.getItem('cart_coupon');
    if (savedCoupon && cart.length > 0) {
      try {
        const items = cart.map(i => ({ product_id: i.product_id, quantity: i.quantity, price: parseFloat(i.price) }));
        const res = await storefrontApi.validateCoupon({ code: savedCoupon, items });
        if (res.is_valid) {
          setAppliedCoupon(savedCoupon);
          setDiscountAmount(parseFloat(res.discount_amount));
        } else {
          localStorage.removeItem('cart_coupon');
        }
      } catch (e) {
        console.error("Failed to validate saved coupon:", e);
      }
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_full_name.trim()) newErrors.customer_full_name = "Ad və soyad vacibdir";
    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = "Telefon vacibdir";
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.customer_phone)) {
      newErrors.customer_phone = "Düzgün nömrə daxil edin";
    }

    if (deliveryType === 'courier') {
      if (!formData.shipping_city) newErrors.shipping_city = "Şəhər mütləqdir";
      if (!formData.shipping_address.trim()) newErrors.shipping_address = "Ünvan mütləqdir";
    } else {
      if (!formData.pickup_point) newErrors.pickup_point = "Təhvil məntəqəsi seçin";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Overwrite address field if pickup to avoid DB confusion
      const finalAddress = deliveryType === 'pickup' 
        ? `Təhvil Məntəqəsi: ${formData.pickup_point}`
        : formData.shipping_address.trim();

      const orderData = {
        customer_full_name: formData.customer_full_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        customer_email: formData.customer_email.trim() || null,
        shipping_city: deliveryType === 'pickup' ? "Bakı" : formData.shipping_city,
        shipping_district: deliveryType === 'pickup' ? "Təhvil Məntəqəsi" : formData.shipping_district.trim() || null,
        shipping_address: finalAddress,
        shipping_postal_code: formData.shipping_postal_code.trim() || null,
        delivery_notes: formData.delivery_notes.trim() || null,
        payment_method: "cash_on_delivery",
        items: cartItems.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        discount_code: appliedCoupon || null,
      };

      const order = await storefrontApi.createOrder(orderData);
      localStorage.setItem("cart", "[]");
      localStorage.removeItem('cart_coupon');
      localStorage.setItem("last_order_phone", formData.customer_phone.trim());
      window.dispatchEvent(new Event("cartUpdated"));
      navigate(`/orders/${order.order_number}`, { state: { order } });
    } catch (err) {
      alert(err.response?.data?.detail || "Sifariş zamanı xəta baş verdi.");
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);
  const subtotal = cartItems.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const totalItemsCount = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-6 py-10">
        <h1 className="text-xl font-black uppercase tracking-wider text-gray-900 mb-8 border-b pb-4">Ödəniş Və Çatdırılma</h1>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* ── 1. Form Information (Left Side - 2/3 width) ── */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Contacts Container Card */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">1. Əlaqə Məlumatları</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Ad, Soyad *</label>
                  <input
                    type="text"
                    name="customer_full_name"
                    value={formData.customer_full_name}
                    onChange={handleInputChange}
                    placeholder="Aysel Məmmədova"
                    className={`w-full px-3 py-2.5 text-sm border ${errors.customer_full_name ? "border-red-500" : "border-gray-200"} rounded-lg focus:outline-none focus:border-gray-500`}
                  />
                  {errors.customer_full_name && <p className="text-red-500 text-[10px] mt-0.5">{errors.customer_full_name}</p>}
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Telefon *</label>
                  <input
                    type="tel"
                    name="customer_phone"
                    value={formData.customer_phone}
                    onChange={handleInputChange}
                    placeholder="+994 XX XXX XX XX"
                    className={`w-full px-3 py-2.5 text-sm border ${errors.customer_phone ? "border-red-500" : "border-gray-200"} rounded-lg focus:outline-none focus:border-gray-500`}
                  />
                  {errors.customer_phone && <p className="text-red-500 text-[10px] mt-0.5">{errors.customer_phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Email (İstəyə Görə)</label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  placeholder="mail@example.com"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

            {/* Delivery Method Selection */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">2. Çatdırılma Üsulu</h2>
              
              {/* Double Action Tab Selection */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setDeliveryType('courier')}
                  className={`py-3 border-2 rounded-xl text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
                    deliveryType === 'courier' ? 'border-gray-900 bg-gray-950 text-white' : 'border-gray-100 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">🛵</span>
                  Kuryer
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryType('pickup')}
                  className={`py-3 border-2 rounded-xl text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-1 transition-all ${
                    deliveryType === 'pickup' ? 'border-gray-900 bg-gray-950 text-white' : 'border-gray-100 text-gray-400 hover:border-gray-300'
                  }`}
                >
                  <span className="text-xl">🏪</span>
                  Təhvil Məntəqəsi
                </button>
              </div>

              {/* Conditional Layout renders */}
              {deliveryType === 'courier' ? (
                <div className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Şəhər *</label>
                      <select
                        name="shipping_city"
                        value={formData.shipping_city}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-500 bg-white"
                      >
                        {cities.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Rayon</label>
                      <input
                        type="text"
                        name="shipping_district"
                        value={formData.shipping_district}
                        onChange={handleInputChange}
                        placeholder="Məsələn: Nəsimi ray."
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Tam Ünvan *</label>
                    <textarea
                      name="shipping_address"
                      value={formData.shipping_address}
                      onChange={handleInputChange}
                      placeholder="Küçə, bina, mənzil nömrəsi..."
                      rows={3}
                      className={`w-full px-3 py-2 text-sm border ${errors.shipping_address ? "border-red-500" : "border-gray-200"} rounded-lg focus:outline-none focus:border-gray-500`}
                    />
                    {errors.shipping_address && <p className="text-red-500 text-[10px] mt-0.5">{errors.shipping_address}</p>}
                  </div>
                </div>
              ) : (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Məntəqə Seçimi *</label>
                  <select
                    name="pickup_point"
                    value={formData.pickup_point}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2.5 text-sm border ${errors.pickup_point ? "border-red-500" : "border-gray-200"} rounded-lg focus:outline-none focus:border-gray-500 bg-white`}
                  >
                    <option value="">-- Məntəqə seçin --</option>
                    {pickupPoints.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  {errors.pickup_point && <p className="text-red-500 text-[10px] mt-0.5">{errors.pickup_point}</p>}
                  <p className="text-[10px] text-gray-400 mt-1">Sifarişiniz təhvil məntəqəsinə çatdıqda sizə SMS məlumat göndəriləcək.</p>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-400 mb-1">Qeyd (İstəyə Görə)</label>
                <textarea
                  name="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={handleInputChange}
                  placeholder="Əlavə maraqlandığınız lazımi detallar..."
                  rows={2}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-gray-500"
                />
              </div>
            </div>

          </div>

          {/* ── 2. Order Summary Sidebar (Right Side - 1/3 width) ── */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-900 border-b pb-2">Sifariş Xülasəsi</h2>
              
              {/* Small Items Listing Cards */}
              <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                {cartItems.map((item) => (
                  <div key={item.product_id} className="flex justify-between items-center text-xs">
                    <span className="text-gray-500 truncate mr-2">{item.name} <b className="text-gray-900">× {item.quantity}</b></span>
                    <span className="font-bold text-gray-900 font-mono">{formatPrice(parseFloat(item.price) * item.quantity)} ₼</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
                <div className="flex justify-between items-center text-gray-600">
                  <span className="text-xs">Məhsullar ({totalItemsCount})</span>
                  <span className="font-semibold text-gray-900 font-mono">{formatPrice(subtotal)} ₼</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span className="text-xs font-bold">Endirim ({appliedCoupon})</span>
                    <span className="font-bold font-mono">-{formatPrice(discountAmount)} ₼</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-gray-600">
                  <span className="text-xs">Çatdırılma</span>
                  <span className="text-green-500 font-bold uppercase text-[11px]">{deliveryType === 'pickup' ? 'Pulsuz' : 'Pulsuz'}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                <span className="font-bold text-sm text-gray-900 uppercase">Toplam</span>
                <span className="text-xl font-black text-gray-950 font-mono">{formatPrice(finalTotal)} ₼</span>
              </div>

              {/* Sticky Static support */}
              <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-2 border border-gray-100">
                <span className="text-xl">💵</span>
                <div>
                  <p className="text-xs font-bold text-gray-900">Nağd Ödəniş (Qapıda)</p>
                  <p className="text-[10px] text-gray-500">Məhsulu alarkən kuryerə ödəniş ediləcək.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 text-xs font-bold uppercase tracking-widest text-white transition-all shadow-sm rounded-xl flex items-center justify-center gap-2 ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-950 hover:bg-gray-800'
                }`}
              >
                {loading ? 'Yüklənir...' : `SİFARİŞİ TƏSDİQ ET (${formatPrice(finalTotal)} ₼)`}
              </button>
            </div>
          </div>

        </form>
      </div>
    </StorefrontLayout>
  );
};
