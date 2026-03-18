import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { storefrontApi } from '../../../shared/api';

export const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);
  const [openAccordion, setOpenAccordion] = useState('description');
  const [selectedSize, setSelectedSize] = useState("");

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      const [productData, shopData] = await Promise.all([
        storefrontApi.getProduct(productId),
        storefrontApi.getShop()
      ]);

      setProduct(productData);
      setShop(shopData);

      // Load recommended items (same category or others from shop)
      if (productData.category) {
        const recoData = await storefrontApi.getProducts({ category: productData.category });
        setRecommended((recoData.products || []).filter(p => p.id !== productData.id).slice(0, 4));
      } else {
        const recoData = await storefrontApi.getProducts({});
        setRecommended((recoData.products || []).filter(p => p.id !== productData.id).slice(0, 4));
      }

    } catch (err) {
      console.error('Failed to load product:', err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

  // Parse product images
  let productImages = [];
  try {
    if (typeof product?.images === 'string') {
      productImages = JSON.parse(product.images);
    } else if (Array.isArray(product?.images)) {
      productImages = product.images;
    }
  } catch (e) {
    productImages = [];
  }

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItemIndex = cart.findIndex(item => item.product_id === product.id);

    if (existingItemIndex >= 0) {
      cart[existingItemIndex].quantity += 1;
    } else {
      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: productImages[0] || null,
        quantity: 1,
        shop_id: product.shop_id,
        size: selectedSize || null
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleWhatsAppOrder = () => {
    if (!shop?.phone) return alert('Mağaza telefon nömrəsi tapılmadı');
    const message = `Salam! ${product.name} məhsulunu sifariş etmək istəyirəm.\n\nQiymət: ${formatPrice(product.price)} ₼\n\nLink: ${window.location.href}`;
    window.open(`https://wa.me/${shop.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="max-w-7xl mx-auto px-6 py-12 animate-pulse grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-1 space-y-2"><div className="bg-gray-100 aspect-square rounded" /><div className="bg-gray-100 aspect-square rounded" /></div>
          <div className="md:col-span-6 bg-gray-100 aspect-[3/4] rounded" />
          <div className="md:col-span-5 space-y-4"><div className="bg-gray-100 h-8 w-3/4 rounded" /><div className="bg-gray-100 h-6 w-1/4 rounded" /><div className="bg-gray-100 h-12 w-full rounded" /></div>
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="text-center py-24">
          <p className="text-5xl mb-4">😕</p>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Məhsul tapılmadı</h2>
          <Button onClick={() => navigate('/')} className="mt-4">Mağazaya Qayıt</Button>
        </div>
      </StorefrontLayout>
    );
  }

  const isInStock = !product.track_inventory || product.inventory_count > 0;

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Breadcrumb / Back */}
        <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 text-sm mb-6 uppercase tracking-wider font-semibold">
          ← Geri
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">

          {/* ── 1. Thumbs Sidebar (Desktop Only) ── */}
          <div className="hidden md:block md:col-span-1 space-y-3 sticky top-28">
            {productImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedImageIndex(index)}
                className={`aspect-[3/4] w-full bg-gray-50 overflow-hidden border transition-all ${selectedImageIndex === index ? 'border-gray-900 shadow-sm' : 'border-gray-200 hover:border-gray-400'
                  }`}
              >
                <img src={image} alt={`Pic ${index}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>

          {/* ── 2. Main Image display ── */}
          <div className="col-span-1 md:col-span-6">
            <div className="aspect-[3/4] bg-gray-50 relative overflow-hidden">
              {productImages.length > 0 ? (
                <img
                  src={productImages[selectedImageIndex]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">📦 Şəkil yoxdur</div>
              )}

              {/* Promo tags */}
              {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                <div className="absolute top-4 left-4 bg-red-600 text-white text-sm font-bold px-3 py-1 uppercase tracking-wide shadow-sm">
                  -{Math.round(((parseFloat(product.compare_at_price) - parseFloat(product.price)) / parseFloat(product.compare_at_price)) * 100)}%
                </div>
              )}
            </div>

            {/* Mobile Thumbnails Scroll */}
            <div className="flex md:hidden gap-2 overflow-x-auto mt-3">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`aspect-[3/4] w-16 h-20 flex-shrink-0 bg-gray-50 border ${selectedImageIndex === index ? 'border-gray-900' : 'border-gray-200'
                    }`}
                >
                  <img src={image} alt={`Pic ${index}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* ── 3. Detail Info (Sticky Right) ── */}
          <div className="col-span-1 md:col-span-5 md:sticky md:top-28 space-y-6">
            <div>
              {product.category && (
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{product.category}</p>
              )}
              <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
              <span className="text-3xl font-black text-gray-950 font-mono">
                {formatPrice(product.price)} ₼
              </span>
              {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                <div className="flex flex-col">
                  <span className="text-gray-400 line-through text-sm font-mono leading-none">
                    {formatPrice(product.compare_at_price)} ₼
                  </span>
                  <span className="text-xs text-red-600 font-bold leading-tight mt-0.5">
                    Qənaət: {formatPrice(product.compare_at_price - product.price)} ₼
                  </span>
                </div>
              )}
            </div>

            {/* Stock Notification */}
            <div className="text-xs">
              {isInStock ? (
                <span className="text-green-600 font-semibold">● Stokda mövcuddur</span>
              ) : (
                <span className="text-red-600 font-semibold">● Stokda yoxdur</span>
              )}
              {product.track_inventory && product.inventory_count <= 5 && product.inventory_count > 0 && (
                <p className="text-orange-500 mt-0.5">Son {product.inventory_count} ədəd qalıb!</p>
              )}
            </div>

            {/* 📏 Size Selector with Variants */}
            {Array.isArray(product.variants) && product.variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-900">Ölçü Seçimi:</p>
                <div className="flex gap-2 flex-wrap">
                  {product.variants.map((v, idx) => {
                    // Pull size property correctly
                    const sizeLabel = v.size || Object.values(v).find(val => typeof val === 'string' && val.length < 5); 
                    if (!sizeLabel) return null;
                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSize(sizeLabel)}
                        disabled={v.inventory_count <= 0}
                        className={`px-3 py-1.5 border rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                          v.inventory_count <= 0 
                            ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : selectedSize === sizeLabel
                              ? 'bg-gray-950 text-white border-gray-950'
                              : 'bg-white text-gray-900 border-gray-200 hover:border-gray-900'
                        }`}
                      >
                        {sizeLabel}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className={`w-full py-4 text-sm font-bold uppercase tracking-widest text-white transition-colors flex items-center justify-center gap-3 ${!isInStock ? 'bg-gray-300 cursor-not-allowed' : addedToCart ? 'bg-green-600' : 'bg-gray-950 hover:bg-gray-800'
                  }`}
              >
                {addedToCart ? 'Səbətə Əlavə Edildi ✓' : 'SƏBƏTƏ ƏLAVƏ ET'}
              </button>

              {shop?.phone && (
                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3.5 text-sm font-bold border-2 border-gray-950 text-gray-950 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  WHATSAPP SİFARİŞ
                </button>
              )}
            </div>

            {/* Accordions (Details, Returns) */}
            <div className="border-t border-gray-200 divide-y divide-gray-100 pt-2">
              <div>
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'description' ? '' : 'description')}
                  className="w-full flex justify-between items-center py-4 text-sm font-bold text-gray-900 uppercase tracking-wide text-left"
                >
                  Məlumat
                  <span>{openAccordion === 'description' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'description' && (
                  <div className="pb-4 text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {product.description || 'Bu məhsul üçün ətraflı məlumat daxil edilməyib.'}
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => setOpenAccordion(openAccordion === 'returns' ? '' : 'returns')}
                  className="w-full flex justify-between items-center py-4 text-sm font-bold text-gray-900 uppercase tracking-wide text-left"
                >
                  Çatdırılma və Geri Qaytarma
                  <span>{openAccordion === 'returns' ? '−' : '+'}</span>
                </button>
                {openAccordion === 'returns' && (
                  <div className="pb-4 text-sm text-gray-500 leading-relaxed">
                    Ölkədaxili sürətli çatdırılma mövcuddur. 14 gün ərzində zavod qüsuru aşkarlanan məhsullar geri qaytarılır və ya dəyişdirilir.
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* ── 4. Recommended (Grid) ── */}
        {recommended.length > 0 && (
          <div className="mt-20 border-t border-gray-100 pt-12">
            <h2 className="text-base font-bold uppercase tracking-wider text-gray-900 mb-6 font-sans">
              Bunlar da maraqlı ola bilər
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {recommended.map((item) => {
                let img = null;
                try {
                  const arr = typeof item.images === 'string' ? JSON.parse(item.images) : item.images;
                  if (arr && arr.length > 0) img = arr[0];
                } catch { }

                return (
                  <div key={item.id} onClick={() => navigate(`/products/${item.id}`)} className="group cursor-pointer">
                    <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden mb-2">
                      {item.compare_at_price && parseFloat(item.compare_at_price) > parseFloat(item.price) && (
                        <span className="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shadow-sm">
                          -{Math.round(((parseFloat(item.compare_at_price) - parseFloat(item.price)) / parseFloat(item.compare_at_price)) * 100)}%
                        </span>
                      )}
                      {img ? (
                        <img src={img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">📦</div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-0.5">{item.category}</p>
                    <h3 className="text-sm font-bold text-gray-900 leading-tight mb-1 truncate">{item.name}</h3>
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-bold text-gray-950 font-mono">{formatPrice(item.price)} ₼</p>
                      {item.compare_at_price && parseFloat(item.compare_at_price) > parseFloat(item.price) && (
                        <span className="text-[10px] text-gray-400 line-through">{formatPrice(item.compare_at_price)} ₼</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </StorefrontLayout>
  );
};
