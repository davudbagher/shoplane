import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AdminLayout } from '../../../shared/components';
import { adminApi } from '../../../shared/api';
import { Button } from '../../../shared/components/Button';

export const StoreManagementPage = () => {
  const { shopId } = useParams();
  const navigate = useNavigate();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [stockFilter, setStockFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState([]);

  useEffect(() => {
    loadData();
  }, [shopId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load shop info
      const shopData = await adminApi.getShop(shopId);
      setShop(shopData);
      
      // Load products
      const productsData = await adminApi.getProducts(shopId);
      setProducts(productsData);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const getFilteredProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === categoryFilter);
    }

    // Stock filter
    if (stockFilter === 'in_stock') {
      filtered = filtered.filter(p => p.inventory_count > 0);
    } else if (stockFilter === 'out_of_stock') {
      filtered = filtered.filter(p => p.inventory_count === 0);
    } else if (stockFilter === 'low_stock') {
      filtered = filtered.filter(p => p.inventory_count > 0 && p.inventory_count <= 5);
    }

    // Sort
    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'price_low') {
      filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    } else if (sortBy === 'price_high') {
      filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
    } else if (sortBy === 'stock') {
      filtered.sort((a, b) => b.inventory_count - a.inventory_count);
    }

    return filtered;
  };

  const filteredProducts = getFilteredProducts();

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  // Get unique categories
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  // Stock badge
  const getStockBadge = (product) => {
    if (product.inventory_count === 0) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-danger-100 text-danger-700">Stokda yoxdur</span>;
    } else if (product.inventory_count <= 5) {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-700">Az qalıb ({product.inventory_count})</span>;
    } else {
      return <span className="px-2 py-1 text-xs font-medium rounded-full bg-success-100 text-success-700">Stokda var ({product.inventory_count})</span>;
    }
  };

  // Bulk actions
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProducts(paginatedProducts.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId) => {
    if (selectedProducts.includes(productId)) {
      setSelectedProducts(selectedProducts.filter(id => id !== productId));
    } else {
      setSelectedProducts([...selectedProducts, productId]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    
    if (!confirm(`${selectedProducts.length} məhsulu silmək istədiyinizə əminsiniz?`)) {
      return;
    }

    try {
      // Delete each selected product
      await Promise.all(
        selectedProducts.map(id => adminApi.deleteProduct(shopId, id))
      );
      
      setSelectedProducts([]);
      loadData();
    } catch (err) {
      console.error('Bulk delete failed:', err);
      alert('Məhsulları silmək mümkün olmadı');
    }
  };

  const handleDeleteProduct = async (productId) => {
    if (!confirm('Bu məhsulu silmək istədiyinizə əminsiniz?')) {
      return;
    }

    try {
      await adminApi.deleteProduct(shopId, productId);
      loadData();
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Məhsulu silmək mümkün olmadı');
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

  return (
    <AdminLayout>
      <div>
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Məhsul İdarəsi</h1>
            <p className="text-sm text-gray-600 mt-1">{shop?.name} mağazası</p>
          </div>
          <Button
            variant="primary"
            onClick={() => navigate(`/admin/shops/${shopId}/products/new`)}
            className="w-full sm:w-auto"
          >
            + Yeni Məhsul
          </Button>
        </div>

        {/* Filters & Search */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-4">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Məhsul axtar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">Bütün kateqoriyalar</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Stock Filter */}
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="all">Bütün məhsullar</option>
                <option value="in_stock">Stokda var</option>
                <option value="low_stock">Az qalıb</option>
                <option value="out_of_stock">Stokda yoxdur</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
              >
                <option value="name">Ad (A-Z)</option>
                <option value="price_low">Qiymət (Aşağı-Yüksək)</option>
                <option value="price_high">Qiymət (Yüksək-Aşağı)</option>
                <option value="stock">Stok sayı</option>
              </select>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedProducts.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <span className="text-sm text-gray-600">
                {selectedProducts.length} məhsul seçildi
              </span>
              <Button
                variant="danger"
                onClick={handleBulkDelete}
                className="text-sm"
              >
                🗑️ Seçilənləri sil
              </Button>
            </div>
          )}
        </div>

        {/* Products Table - Desktop */}
        <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedProducts.length === paginatedProducts.length && paginatedProducts.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Məhsul
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Kateqoriya
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Stok
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Qiymət
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                  Əməliyyatlar
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <input
                      type="checkbox"
                      checked={selectedProducts.includes(product.id)}
                      onChange={() => handleSelectProduct(product.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center text-2xl overflow-hidden flex-shrink-0">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          '📦'
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{product.name}</div>
                        {product.description && (
                          <div className="text-xs text-gray-500 truncate max-w-xs">{product.description}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700">{product.category || '-'}</span>
                  </td>
                  <td className="px-4 py-4">
                    {getStockBadge(product)}
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-semibold text-gray-900">
                      {parseFloat(product.price).toFixed(2)} ₼
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right space-x-2">
                    <button
                      onClick={() => navigate(`/admin/shops/${shopId}/products/${product.id}/edit`)}
                      className="text-primary-600 hover:text-primary-800 text-sm font-medium"
                    >
                      ✏️ Redaktə
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="text-danger-600 hover:text-danger-800 text-sm font-medium"
                    >
                      🗑️ Sil
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paginatedProducts.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-600">Məhsul tapılmadı</p>
            </div>
          )}
        </div>

        {/* Products Cards - Mobile */}
        <div className="md:hidden space-y-4">
          {paginatedProducts.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedProducts.includes(product.id)}
                  onChange={() => handleSelectProduct(product.id)}
                  className="w-4 h-4 mt-1 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    '📦'
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{product.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{product.category || 'Kateqoriya yoxdur'}</p>
                  {getStockBadge(product)}
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">
                      {parseFloat(product.price).toFixed(2)} ₼
                    </span>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => navigate(`/admin/shops/${shopId}/products/${product.id}/edit`)}
                        className="text-primary-600 text-sm"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id)}
                        className="text-danger-600 text-sm"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {paginatedProducts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg">
              <div className="text-5xl mb-4">📦</div>
              <p className="text-gray-600">Məhsul tapılmadı</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filteredProducts.length > itemsPerPage && (
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between space-y-4 sm:space-y-0">
            <div className="text-sm text-gray-600">
              {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} arası göstərilir, toplam {filteredProducts.length} məhsul
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Əvvəlki
              </button>
              
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-2 border rounded-lg text-sm font-medium ${
                    currentPage === i + 1
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Növbəti →
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
