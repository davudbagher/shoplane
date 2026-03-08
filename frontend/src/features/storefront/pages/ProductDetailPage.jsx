import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { storefrontApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';

export const ProductDetailPage = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState(null);
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const loadProductData = async () => {
    try {
      setLoading(true);
      
      // Load product and shop in parallel
      const [productData, shopData] = await Promise.all([
        storefrontApi.getProduct(productId),
        storefrontApi.getShop()
      ]);
      
      setProduct(productData);
      setShop(shopData);
    } catch (err) {
      console.error('Failed to load product:', err);
      setProduct(null);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toFixed(2);
  };

  const handleAddToCart = () => {
    // Get existing cart from localStorage
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItemIndex = cart.findIndex(item => item.product_id === product.id);
    
    if (existingItemIndex >= 0) {
      // Increment quantity
      cart[existingItemIndex].quantity += 1;
    } else {
      // Add new item
      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: productImages[0] || null,
        quantity: 1,
        shop_id: product.shop_id
      });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Show feedback
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
    
    // Trigger cart update in header (via custom event)
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const handleWhatsAppOrder = () => {
    if (!shop?.phone) {
      alert('Mağaza telefon nömrəsi tapılmadı');
      return;
    }
    
    // Format WhatsApp message in Azerbaijani
    const message = `Salam! ${product.name} məhsulunu sifariş etmək istəyirəm.\n\nQiymət: ${formatPrice(product.price)} ₼\n\nLink: ${window.location.href}`;
    
    // Clean phone number (remove spaces, dashes, etc.)
    const cleanPhone = shop.phone.replace(/\D/g, '');
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <StorefrontLayout>
        <div className="text-center py-12">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Məhsul yüklənir...</p>
        </div>
      </StorefrontLayout>
    );
  }

  if (!product) {
    return (
      <StorefrontLayout>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😕</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Məhsul tapılmadı
          </h2>
          <p className="text-gray-600 mb-6">
            Bu məhsul mövcud deyil və ya silinib
          </p>
          <Button onClick={() => navigate('/')}>
            Mağazaya Qayıt
          </Button>
        </div>
      </StorefrontLayout>
    );
  }

  // Parse product images
  let productImages = [];
  try {
    if (typeof product.images === 'string') {
      productImages = JSON.parse(product.images);
    } else if (Array.isArray(product.images)) {
      productImages = product.images;
    }
  } catch (e) {
    productImages = [];
  }

  const hasImages = productImages.length > 0;
  const isInStock = !product.track_inventory || product.inventory_count > 0;
  const stockText = product.track_inventory
    ? `Stokda ${product.inventory_count} ədəd var`
    : 'Stokda var';

  return (
    <StorefrontLayout>
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Geri
        </button>

        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Product Image Section */}
          <div className="aspect-square bg-gray-100 flex items-center justify-center">
            {hasImages ? (
              <img
                src={productImages[selectedImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <span className="text-6xl">📦</span>
                <p className="text-gray-500 mt-2">Şəkil yoxdur</p>
              </div>
            )}
          </div>

          {/* Image Thumbnails (if multiple images) */}
          {productImages.length > 1 && (
            <div className="flex space-x-2 p-4 overflow-x-auto">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImageIndex(index)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index
                      ? 'border-primary-500'
                      : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product Info */}
          <div className="p-6">
            {/* Category Badge */}
            {product.category && (
              <div className="mb-2">
                <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                  {product.category}
                </span>
              </div>
            )}

            {/* Product Name */}
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {product.name}
            </h1>

            {/* Price */}
            <div className="mb-4">
              <span className="text-3xl font-bold text-primary-600">
                {formatPrice(product.price)} ₼
              </span>
              {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                <span className="ml-3 text-lg text-gray-500 line-through">
                  {formatPrice(product.compare_at_price)} ₼
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="mb-6">
              {isInStock ? (
                <div className="flex items-center text-success-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">{stockText}</span>
                </div>
              ) : (
                <div className="flex items-center text-danger-600">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Stokda yoxdur</span>
                </div>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Təsvir</h3>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {product.description}
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              {/* Add to Cart Button */}
              <Button
                variant="primary"
                onClick={handleAddToCart}
                disabled={!isInStock}
                className="w-full text-lg py-3"
              >
                {addedToCart ? (
                  <>
                    <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Səbətə əlavə olundu!
                  </>
                ) : (
                  <>
                    🛒 Səbətə əlavə et
                  </>
                )}
              </Button>

              {/* WhatsApp Order Button (Azerbaijan-specific!) */}
              {shop?.phone && (
                <Button
                  variant="secondary"
                  onClick={handleWhatsAppOrder}
                  className="w-full text-lg py-3"
                >
                  <svg className="w-5 h-5 mr-2 inline" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                  </svg>
                  WhatsApp ilə sifariş et
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </StorefrontLayout>
  );
};
