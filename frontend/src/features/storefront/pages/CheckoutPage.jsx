import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { StorefrontLayout } from "../components/StorefrontLayout";
import { storefrontApi } from "../../../shared/api";
import { Button } from "../../../shared/components/Button";

export const CheckoutPage = () => {
  const navigate = useNavigate();

  // Cart state
  const [cartItems, setCartItems] = useState([]);
  const [shop, setShop] = useState(null);

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
    payment_method: "cash_on_delivery",
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // Azerbaijan cities
  const cities = [
    "Bakı",
    "Gəncə",
    "Sumqayıt",
    "Mingəçevir",
    "Şəki",
    "Lənkəran",
    "Naxçıvan",
    "Şirvan",
    "Ağdam",
    "Ağdaş",
    "Quba",
    "Qəbələ",
    "Şamaxı",
    "Digər",
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load cart
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");

    if (cart.length === 0) {
      navigate("/cart");
      return;
    }

    setCartItems(cart);

    // Load shop info
    try {
      const shopData = await storefrontApi.getShop();
      setShop(shopData);
    } catch (err) {
      console.error("Failed to load shop:", err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.customer_full_name.trim()) {
      newErrors.customer_full_name = "Ad və soyad tələb olunur";
    }

    if (!formData.customer_phone.trim()) {
      newErrors.customer_phone = "Telefon nömrəsi tələb olunur";
    } else if (!/^[\d\s\+\-\(\)]+$/.test(formData.customer_phone)) {
      newErrors.customer_phone = "Düzgün telefon nömrəsi daxil edin";
    }

    if (!formData.shipping_city) {
      newErrors.shipping_city = "Şəhər seçin";
    }

    if (!formData.shipping_address.trim()) {
      newErrors.shipping_address = "Ünvan tələb olunur";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        customer_full_name: formData.customer_full_name.trim(),
        customer_phone: formData.customer_phone.trim(),
        customer_email: formData.customer_email.trim() || null,
        shipping_city: formData.shipping_city,
        shipping_district: formData.shipping_district.trim() || null,
        shipping_address: formData.shipping_address.trim(),
        shipping_postal_code: formData.shipping_postal_code.trim() || null,
        delivery_notes: formData.delivery_notes.trim() || null,
        payment_method: "cash_on_delivery", // ← EXACT match to enum value!
        items: cartItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
        })),
      };

      // Submit order
      const order = await storefrontApi.createOrder(orderData);

      // Clear cart
      localStorage.setItem("cart", "[]");
      window.dispatchEvent(new Event("cartUpdated"));

      // Redirect to confirmation
      navigate(`/orders/${order.order_number}`, {
        state: { order },
      });
    } catch (err) {
      console.error("Failed to create order:", err);
      alert(
        err.response?.data?.detail ||
          "Sifariş yaradılarkən xəta baş verdi. Yenidən cəhd edin.",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toFixed(2);
  };

  const calculateTotal = () => {
    return cartItems.reduce((sum, item) => {
      return sum + parseFloat(item.price) * item.quantity;
    }, 0);
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const total = calculateTotal();

  return (
    <StorefrontLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button
            onClick={() => navigate("/cart")}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Geri
          </button>

          <h1 className="text-2xl font-bold text-gray-900 ml-4">Ödəniş</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Delivery Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📋</span>
              Çatdırılma məlumatları
            </h2>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ad, Soyad <span className="text-danger-600">*</span>
                </label>
                <input
                  type="text"
                  name="customer_full_name"
                  value={formData.customer_full_name}
                  onChange={handleInputChange}
                  placeholder="Məsələn: Aysel Məmmədova"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.customer_full_name
                      ? "border-danger-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.customer_full_name && (
                  <p className="text-danger-600 text-sm mt-1">
                    {errors.customer_full_name}
                  </p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefon <span className="text-danger-600">*</span>
                </label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleInputChange}
                  placeholder="+994 XX XXX XX XX"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.customer_phone
                      ? "border-danger-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.customer_phone && (
                  <p className="text-danger-600 text-sm mt-1">
                    {errors.customer_phone}
                  </p>
                )}
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email (istəyə görə)
                </label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleInputChange}
                  placeholder="example@mail.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Şəhər <span className="text-danger-600">*</span>
                </label>
                <select
                  name="shipping_city"
                  value={formData.shipping_city}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.shipping_city
                      ? "border-danger-500"
                      : "border-gray-300"
                  }`}
                >
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                {errors.shipping_city && (
                  <p className="text-danger-600 text-sm mt-1">
                    {errors.shipping_city}
                  </p>
                )}
              </div>

              {/* District */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rayon / Qəsəbə
                </label>
                <input
                  type="text"
                  name="shipping_district"
                  value={formData.shipping_district}
                  onChange={handleInputChange}
                  placeholder="Məsələn: Nəsimi rayonu"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ünvan <span className="text-danger-600">*</span>
                </label>
                <textarea
                  name="shipping_address"
                  value={formData.shipping_address}
                  onChange={handleInputChange}
                  placeholder="Küçə, bina, mənzil nömrəsi"
                  rows={3}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                    errors.shipping_address
                      ? "border-danger-500"
                      : "border-gray-300"
                  }`}
                />
                {errors.shipping_address && (
                  <p className="text-danger-600 text-sm mt-1">
                    {errors.shipping_address}
                  </p>
                )}
              </div>

              {/* Delivery Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Qeyd (istəyə görə)
                </label>
                <textarea
                  name="delivery_notes"
                  value={formData.delivery_notes}
                  onChange={handleInputChange}
                  placeholder="Əlavə qeydlər (məsələn: 5-ci mərtəbə, mənzil 12)"
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <span className="text-2xl mr-2">📦</span>
              Sifariş xülasəsi
            </h2>

            {/* Cart Items */}
            <div className="space-y-3 mb-4">
              {cartItems.map((item) => (
                <div
                  key={item.product_id}
                  className="flex justify-between text-sm"
                >
                  <span className="text-gray-600">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    {formatPrice(parseFloat(item.price) * item.quantity)} ₼
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-4 space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Məhsullar ({totalItems} ədəd)</span>
                <span>{formatPrice(total)} ₼</span>
              </div>

              <div className="flex justify-between text-gray-600">
                <span>Çatdırılma</span>
                <span className="text-success-600 font-medium">Pulsuz</span>
              </div>

              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-gray-900">
                    Toplam
                  </span>
                  <span className="text-2xl font-bold text-primary-600">
                    {formatPrice(total)} ₼
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center">
                <span className="text-2xl mr-3">💵</span>
                <div>
                  <p className="font-medium text-gray-900">Qapıda ödəniş</p>
                  <p className="text-sm text-gray-600">
                    Məhsulu alarkən nağd ödəyəcəksiniz
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            className="w-full text-lg py-4"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-5 w-5 mr-2 inline"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Göndərilir...
              </>
            ) : (
              <>✓ Sifarişi təsdiq et ({formatPrice(total)} ₼)</>
            )}
          </Button>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-success-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Təhlükəsiz ödəniş
            </div>
            <div className="flex items-center">
              <svg
                className="w-4 h-4 mr-1 text-primary-600"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
              </svg>
              Sürətli çatdırılma
            </div>
          </div>
        </form>
      </div>
    </StorefrontLayout>
  );
};
