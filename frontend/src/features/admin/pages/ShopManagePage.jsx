import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../components/AdminLayout';
import { shopsApi, productsApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';

export const ShopManagePage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadShopData();
  }, [shopId]);

  const loadShopData = async () => {
    try {
      // Load shop first (critical)
      const shopData = await shopsApi.getShop(shopId);
      setShop(shopData);
      
      // Try to load products (non-critical)
      try {
        const productsData = await productsApi.getProducts(shopId);
        setProducts(Array.isArray(productsData.products) ? productsData.products : []);
      } catch (productsErr) {
        console.warn('Products failed to load:', productsErr);
        setProducts([]);
      }
      
    } catch (err) {
      console.error('Failed to load shop:', err);
      setShop(null);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
          <p className="text-gray-600">Yüklənir...</p>
        </div>
      </AdminLayout>
    );
  }

  if (!shop) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <p className="text-danger-600">Mağaza tapılmadı</p>
          <Button onClick={() => navigate('/admin/dashboard')} className="mt-4">
            Əsas Səhifəyə Qayıt
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      {/* Shop Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {shop.name}
            </h1>
            <p className="text-primary-600 font-medium mb-2">
              🌐 {shop.subdomain}.1link.az
            </p>
            {shop.description && (
              <p className="text-gray-600">{shop.description}</p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="bg-primary-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-primary-700">
              {products.length}
            </div>
            <div className="text-sm text-primary-600">Məhsullar</div>
          </div>
          <div className="bg-success-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-success-700">0</div>
            <div className="text-sm text-success-600">Sifarişlər</div>
          </div>
          <div className="bg-warning-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-warning-700">0 ₼</div>
            <div className="text-sm text-warning-600">Gəlir</div>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Məhsullar</h2>
          <Button
            variant="primary"
            onClick={() => navigate(`/admin/shops/${shopId}/products/new`)}
          >
            + Məhsul Əlavə Et
          </Button>
        </div>

        {/* Products List */}
        {products.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Hələ məhsul yoxdur
            </h3>
            <p className="text-gray-600 mb-6">
              İlk məhsulunuzu əlavə edin və satışa başlayın!
            </p>
            <Button
              variant="primary"
              onClick={() => navigate(`/admin/shops/${shopId}/products/new`)}
            >
              İlk Məhsulu Əlavə Et
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product) => {
              // Parse images safely
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
              
              const firstImage = productImages.length > 0 ? productImages[0] : null;
              
              return (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    {firstImage ? (
                      <img
                        src={firstImage}
                        alt={product.name}
                        className="w-full h-full object-cover rounded-lg"
                      />
                    ) : (
                      <span className="text-4xl">📦</span>
                    )}
                  </div>

                  {/* Product Info */}
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-xl font-bold text-primary-600 mb-2">
                    {parseFloat(product.price || 0).toFixed(2)} ₼
                  </p>
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {product.description}
                    </p>
                  )}

                  {/* Category Badge */}
                  {product.category && (
                    <div className="mb-3">
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                        {product.category}
                      </span>
                    </div>
                  )}

                  {/* Stock Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600">
                      Stok: {product.inventory_count || 0}
                    </span>
                    <span
                      className={`text-xs px-2 py-1 rounded ${
                        product.is_active
                          ? 'bg-success-100 text-success-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {product.is_active ? 'Aktiv' : 'Deaktiv'}
                    </span>
                  </div>

                  {/* Actions */}
                  <Button
                    variant="secondary"
                    onClick={() =>
                      navigate(`/admin/shops/${shopId}/products/${product.id}/edit`)
                    }
                    className="w-full text-sm"
                  >
                    Redaktə Et
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};