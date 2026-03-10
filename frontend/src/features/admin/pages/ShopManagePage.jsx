import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../shared/components';
import { adminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';

export const ShopManagePage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();
  
  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadShopData();
  }, [shopId]);

  const loadShopData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Loading shop data for shop ID:', shopId);
      
      // Load shop details and products in parallel
      const [shopData, productsData] = await Promise.all([
        adminApi.getShop(shopId),
        adminApi.getProducts(shopId)
      ]);
      
      console.log('✅ Shop loaded:', shopData);
      console.log('✅ Products response:', productsData);
      console.log('✅ Products type:', typeof productsData, Array.isArray(productsData));
      
      setShop(shopData);
      
      // ✨ DEFENSIVE FIX: Handle various response formats
      let productsArray = [];
      
      if (Array.isArray(productsData)) {
        // Backend returns array directly: [product1, product2]
        productsArray = productsData;
      } else if (productsData && Array.isArray(productsData.products)) {
        // Backend returns wrapped: { products: [product1, product2] }
        productsArray = productsData.products;
      } else if (productsData && Array.isArray(productsData.data)) {
        // Backend returns wrapped: { data: [product1, product2] }
        productsArray = productsData.data;
      } else {
        console.warn('⚠️ Unexpected products format:', productsData);
        productsArray = [];
      }
      
      console.log('✅ Final products array:', productsArray);
      setProducts(productsArray);
      
    } catch (err) {
      console.error('❌ Failed to load shop data:', err);
      console.error('❌ Error response:', err.response?.data);
      setError(err.response?.data?.detail || 'Failed to load shop');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!window.confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
      return;
    }
    
    try {
      await adminApi.deleteProduct(shopId, productId);
      console.log('✅ Product deleted:', productId);
      
      // Reload products
      loadShopData();
    } catch (err) {
      console.error('❌ Failed to delete product:', err);
      alert('Məhsul silinərkən xəta baş verdi');
    }
  };

  const formatPrice = (price) => {
    return parseFloat(price || 0).toFixed(2);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
            <p className="text-gray-600">Yüklənir...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <div className="text-danger-600 text-xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Xəta</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/admin/dashboard')}>
            Panel-ə Qayıt
          </Button>
        </div>
      </AdminLayout>
    );
  }

  if (!shop) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-bold text-gray-900">Mağaza tapılmadı</h2>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Shop Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              {shop.logo_url ? (
                <img 
                  src={shop.logo_url} 
                  alt={shop.name}
                  className="h-16 w-16 rounded-full object-cover"
                />
              ) : (
                <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
                  <span className="text-primary-600 font-bold text-2xl">
                    {shop.name.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{shop.name}</h1>
                <a 
                  href={`http://${shop.subdomain}.1link.az`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
                >
                  🌐 {shop.subdomain}.1link.az
                </a>
              </div>
            </div>
            
            <Button
              variant="secondary"
              onClick={() => navigate(`/admin/shops/${shopId}/edit`)}
            >
              ✏️ Redaktə et
            </Button>
          </div>

          {shop.description && (
            <p className="text-gray-600">{shop.description}</p>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-3xl font-bold text-blue-600">
              {products.length}
            </div>
            <div className="text-blue-700 font-medium">Məhsullar</div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-6">
            <div className="text-3xl font-bold text-green-600">0</div>
            <div className="text-green-700 font-medium">Sifarişlər</div>
          </div>
          
          <div className="bg-orange-50 rounded-lg p-6">
            <div className="text-3xl font-bold text-orange-600">0 ₼</div>
            <div className="text-orange-700 font-medium">Gəlir</div>
          </div>
        </div>

        {/* Products Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">Məhsullar</h2>
            <Button
              variant="primary"
              onClick={() => navigate(`/admin/shops/${shopId}/products/new`)}
            >
              + Məhsul əlavə et
            </Button>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Hələ məhsul yoxdur
              </h3>
              <p className="text-gray-600 mb-6">
                İlk məhsulunuzu əlavə edin və satışa başlayın!
              </p>
              <Button
                variant="primary"
                onClick={() => navigate(`/admin/shops/${shopId}/products/new`)}
              >
                İlk Məhsulu əlavə Et
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  {/* Product Image */}
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 flex items-center justify-center">
                    {(() => {
                      let images = [];
                      try {
                        if (product.images && typeof product.images === 'string') {
                          images = JSON.parse(product.images);
                        } else if (Array.isArray(product.images)) {
                          images = product.images;
                        }
                      } catch (e) {
                        images = [];
                      }
                      
                      return images.length > 0 ? (
                        <img
                          src={images[0]}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <span className="text-4xl">📦</span>
                      );
                    })()}
                  </div>

                  {/* Product Info */}
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <h3 className="font-semibold text-gray-900 flex-1">
                        {product.name}
                      </h3>
                      <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                        product.is_active
                          ? 'bg-success-100 text-success-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {product.is_active ? 'Aktiv' : 'Deaktiv'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-600">
                        {formatPrice(product.price)} ₼
                      </span>
                      {product.category && (
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {product.category}
                        </span>
                      )}
                    </div>

                    {product.track_inventory && (
                      <div className="text-sm text-gray-600">
                        Stok: {product.inventory_count} ədəd
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex space-x-2 pt-2">
                      <Button
                        variant="secondary"
                        onClick={() => navigate(`/admin/shops/${shopId}/products/${product.id}/edit`)}
                        className="flex-1 text-sm"
                      >
                        ✏️ Redaktə
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="flex-1 text-sm"
                      >
                        🗑️ Sil
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Storefront Link */}
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">
            🌐 Mağazanızı görüntüləyin
          </h3>
          <p className="text-gray-600 mb-4">
            Müştərilərinizin gördüyü kimi
          </p>
          <a
            href={`http://localhost:5173?subdomain=${shop.subdomain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block"
          >
            <Button variant="primary">
              Mağazaya Bax
            </Button>
          </a>
        </div>
      </div>
    </AdminLayout>
  );
};