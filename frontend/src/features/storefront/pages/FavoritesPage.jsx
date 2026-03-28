import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { storefrontApi } from '../../../shared/api';

export const FavoritesPage = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const favIds = JSON.parse(localStorage.getItem('favorites') || '[]');
      setFavorites(favIds);

      if (favIds.length === 0) {
        setProducts([]);
        return;
      }

      // Fetch product details for each favorite
      const results = await Promise.allSettled(
        favIds.map(id => storefrontApi.getProduct(id))
      );

      const loaded = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      setProducts(loaded);

      // Clean up any IDs that no longer exist
      const validIds = loaded.map(p => p.id);
      const cleaned = favIds.filter(id => validIds.includes(id));
      if (cleaned.length !== favIds.length) {
        localStorage.setItem('favorites', JSON.stringify(cleaned));
        setFavorites(cleaned);
        window.dispatchEvent(new Event('favoritesUpdated'));
      }
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = useCallback((productId) => {
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    const updated = favs.filter(id => id !== productId);
    localStorage.setItem('favorites', JSON.stringify(updated));
    setFavorites(updated);
    setProducts(prev => prev.filter(p => p.id !== productId));
    window.dispatchEvent(new Event('favoritesUpdated'));
  }, []);

  const handleAddToCart = useCallback((product) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingIndex = cart.findIndex(item => item.product_id === product.id);

    if (existingIndex >= 0) {
      cart[existingIndex].quantity += 1;
    } else {
      let img = null;
      try {
        const images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
        if (Array.isArray(images) && images.length > 0) img = images[0];
      } catch { }

      cart.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        image: img,
        quantity: 1,
        shop_id: product.shop_id,
      });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('cartUpdated'));

    // Remove from favorites
    const favs = JSON.parse(localStorage.getItem('favorites') || '[]');
    const updatedFavs = favs.filter(id => id !== product.id);
    localStorage.setItem('favorites', JSON.stringify(updatedFavs));
    setFavorites(updatedFavs);
    setProducts(prev => prev.filter(p => p.id !== product.id));
    window.dispatchEvent(new Event('favoritesUpdated'));

    // Show toast
    setToast(`"${product.name}" səbətə əlavə edildi`);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

  const getFirstImage = (product) => {
    try {
      if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
      if (typeof product.images === 'string') {
        const parsed = JSON.parse(product.images);
        if (parsed.length > 0) return parsed[0];
      }
    } catch { }
    return null;
  };

  return (
    <StorefrontLayout>
      <div className="max-w-screen-xl mx-auto px-6 py-8">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-500 hover:text-gray-900 text-sm mb-4 uppercase tracking-wider font-semibold">
            ← Geri
          </button>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-gray-900">Sevimlilər</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? '...' : `${products.length} məhsul`}
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 aspect-[3/4] w-full mb-3" />
                <div className="bg-gray-100 h-4 w-3/4 mb-2 rounded" />
                <div className="bg-gray-100 h-4 w-1/3 rounded" />
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-24">
            <p className="text-5xl mb-4">♡</p>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Hələ sevimli məhsul yoxdur</h3>
            <p className="text-gray-500 text-sm mb-6">Bəyəndiyiniz məhsulları ♡ ilə qeyd edin</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2.5 bg-gray-950 text-white text-sm font-bold uppercase tracking-wider hover:bg-gray-800 transition-colors"
            >
              Mağazaya Bax
            </button>
          </div>
        )}

        {/* Products Grid */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
            {products.map((product) => {
              const img = getFirstImage(product);
              return (
                <div key={product.id} className="group">
                  {/* Image */}
                  <div
                    className="relative overflow-hidden bg-gray-100 aspect-[3/4] mb-3 cursor-pointer"
                    onClick={() => navigate(`/products/${product.id}`)}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}

                    {/* Remove from favorites button */}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRemove(product.id); }}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-red-50 transition-colors"
                      title="Sevimlilərdən çıxar"
                    >
                      <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>

                    {/* Discount badge */}
                    {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                      <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shadow-sm">
                        -{Math.round(((parseFloat(product.compare_at_price) - parseFloat(product.price)) / parseFloat(product.compare_at_price)) * 100)}%
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h3
                      className="text-sm font-medium text-gray-900 leading-tight mb-1 line-clamp-2 cursor-pointer hover:underline"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      {product.name}
                    </h3>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-bold text-gray-900">
                        {formatPrice(product.price)} ₼
                      </span>
                      {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(product.compare_at_price)} ₼
                        </span>
                      )}
                    </div>

                    {/* Add to Cart */}
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-2 text-xs font-bold uppercase tracking-wider bg-gray-950 text-white hover:bg-gray-800 transition-colors"
                    >
                      Səbətə Əlavə Et
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-[slideUp_0.3s_ease-out]">
          <div className="bg-gray-950 text-white px-6 py-3 rounded-lg shadow-xl flex items-center gap-3 text-sm font-medium">
            <span className="text-green-400">✓</span>
            {toast}
            <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-white">✕</button>
          </div>
        </div>
      )}
    </StorefrontLayout>
  );
};
