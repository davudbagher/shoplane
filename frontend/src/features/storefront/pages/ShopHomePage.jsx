import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { storefrontApi } from '../../../shared/api';

export const ShopHomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [selectedCategory]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load products
      const params = selectedCategory ? { category: selectedCategory } : {};
      const productsData = await storefrontApi.getProducts(params);
      setProducts(productsData.products || []);
      
      // Load categories (only once)
      if (categories.length === 0) {
        const categoriesData = await storefrontApi.getCategories();
        setCategories(categoriesData || []);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
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
        <div className="text-center py-12">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Məhsullar yüklənir...</p>
        </div>
      </StorefrontLayout>
    );
  }

  return (
    <StorefrontLayout>
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="mb-6 overflow-x-auto">
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  !selectedCategory
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Hamısı
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Products Grid */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🌸</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Məhsul tapılmadı
            </h3>
            <p className="text-gray-600">
              {selectedCategory
                ? `"${selectedCategory}" kateqoriyasında məhsul yoxdur`
                : 'Hələ məhsul əlavə edilməyib'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              // SAFE image parsing with error handling
              let productImages = [];
              try {
                if (product.images) {
                  if (typeof product.images === 'string' && product.images.trim()) {
                    productImages = JSON.parse(product.images);
                  } else if (Array.isArray(product.images)) {
                    productImages = product.images;
                  }
                }
              } catch (e) {
                console.warn(`Failed to parse images for product ${product.id}:`, e);
                productImages = [];
              }

              const firstImage = Array.isArray(productImages) && productImages.length > 0
                ? productImages[0]
                : null;

              return (
                <div
                  key={product.id}
                  onClick={() => navigate(`/products/${product.id}`)}
                  className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 flex items-center justify-center">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-3">
                    <h3 className="font-medium text-gray-900 mb-1 line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-lg font-bold text-primary-600">
                      {formatPrice(product.price)} ₼
                    </p>

                    {/* Stock Status */}
                    {product.track_inventory && !product.is_in_stock && (
                      <p className="text-xs text-danger-600 mt-1">
                        Stokda yoxdur
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </StorefrontLayout>
  );
};

