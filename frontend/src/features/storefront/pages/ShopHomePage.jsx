import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { storefrontApi } from '../../../shared/api';

export const ShopHomePage = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Load categories once
  useEffect(() => {
    storefrontApi.getCategories().then(data => setCategories(data || [])).catch(() => {});
  }, []);

  // Load products whenever filters change
  useEffect(() => {
    loadProducts();
  }, [selectedCategory, searchQuery, sortBy]);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory === 'new_arrival') {
        params.is_new_arrival = true;
      } else if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (searchQuery)       params.search   = searchQuery;
      if (sortBy)            params.sort_by  = sortBy;

      const data = await storefrontApi.getProducts(params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((val) => {
    setSearchQuery(val);
  }, []);

  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

  const getFirstImage = (product) => {
    try {
      if (Array.isArray(product.images) && product.images.length > 0) return product.images[0];
      if (typeof product.images === 'string') {
        const parsed = JSON.parse(product.images);
        if (parsed.length > 0) return parsed[0];
      }
    } catch {}
    return null;
  };

  const sortOptions = [
    { value: 'newest',     label: 'Ən Yeni' },
    { value: 'price_asc',  label: 'Qiymət ↑' },
    { value: 'price_desc', label: 'Qiymət ↓' },
    { value: 'popular',    label: 'Populyar' },
  ];

  return (
    <StorefrontLayout onSearch={handleSearch} searchValue={searchQuery}>
      <div className="max-w-screen-xl mx-auto px-6 py-8 flex gap-8">

        {/* ── Left Sidebar ── */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          {/* Categories */}
          <div className="mb-8">
            <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Kateqoriyalar</h3>
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`w-full text-left text-sm py-1.5 px-0 transition-colors ${
                    !selectedCategory
                      ? 'text-gray-900 font-semibold border-l-2 border-gray-900 pl-3'
                      : 'text-gray-500 hover:text-gray-900 pl-3'
                  }`}
                >
                  Hamısı
                </button>
              </li>
              <li>
                <button
                  onClick={() => setSelectedCategory('new_arrival')}
                  className={`w-full text-left text-sm py-1.5 px-0 transition-colors ${
                    selectedCategory === 'new_arrival'
                      ? 'text-gray-900 font-semibold border-l-2 border-gray-900 pl-3'
                      : 'text-gray-500 hover:text-gray-900 pl-3'
                  }`}
                >
                  Yeni Gələnlər ✨
                </button>
              </li>
              {categories.map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => setSelectedCategory(cat)}
                    className={`w-full text-left text-sm py-1.5 px-0 transition-colors ${
                      selectedCategory === cat
                        ? 'text-gray-900 font-semibold border-l-2 border-gray-900 pl-3'
                        : 'text-gray-500 hover:text-gray-900 pl-3'
                    }`}
                  >
                    {cat}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">

          {/* Top bar: breadcrumb + sort */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">
                {selectedCategory ? `Kateqoriya / ${selectedCategory}` : 'Bütün Məhsullar'}
              </p>
              <p className="text-sm text-gray-500">
                {loading ? '...' : `${total} məhsul`}
              </p>
            </div>

            {/* Sort + mobile category */}
            <div className="flex items-center gap-3">
              {/* Mobile Category Scroll */}
              <div className="flex lg:hidden gap-2 overflow-x-auto pb-1">
                <button
                  onClick={() => setSelectedCategory(null)}
                  className={`flex-shrink-0 px-3 py-1.5 text-xs border rounded-full transition-colors ${
                    !selectedCategory ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-600'
                  }`}
                >Hamısı</button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs border rounded-full transition-colors ${
                      selectedCategory === cat ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-300 text-gray-600 hover:border-gray-600'
                    }`}
                  >{cat}</button>
                ))}
              </div>

              {/* Sort Dropdown */}
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-sm border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-gray-600 bg-white cursor-pointer"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 mb-6" />

          {/* Loading */}
          {loading && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-100 aspect-[3/4] w-full mb-3" />
                  <div className="bg-gray-100 h-4 w-3/4 mb-2 rounded" />
                  <div className="bg-gray-100 h-4 w-1/3 rounded" />
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && products.length === 0 && (
            <div className="text-center py-24">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Məhsul tapılmadı</h3>
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? `"${searchQuery}" üçün nəticə yoxdur`
                  : selectedCategory
                    ? `"${selectedCategory}" kateqoriyasında məhsul yoxdur`
                    : 'Hələ məhsul əlavə edilməyib'}
              </p>
              {(searchQuery || selectedCategory) && (
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory(null); }}
                  className="mt-4 text-sm underline text-gray-600 hover:text-gray-900"
                >
                  Filteri sıfırla
                </button>
              )}
            </div>
          )}

          {/* Product Grid */}
          {!loading && products.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8">
              {products.map((product) => {
                const img = getFirstImage(product);
                return (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/products/${product.id}`)}
                    className="group cursor-pointer"
                  >
                    {/* Image */}
                    <div className="relative overflow-hidden bg-gray-100 aspect-[3/4] mb-3">
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

                      {/* Hover overlay with cart icon */}
                      <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pb-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/products/${product.id}`);
                          }}
                          className="bg-white text-gray-900 text-xs font-semibold py-2.5 px-6 tracking-wide uppercase hover:bg-gray-900 hover:text-white transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                          Ətraflı Bax
                        </button>
                      </div>

                      {/* Low stock badge */}
                      {product.track_inventory && product.inventory_count <= 5 && product.inventory_count > 0 && (
                        <span className="absolute top-2 left-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                          Son {product.inventory_count}
                        </span>
                      )}
                      {product.track_inventory && product.inventory_count === 0 && (
                        <span className="absolute top-2 left-2 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
                          Stokda Yoxdur
                        </span>
                      )}
                      
                      {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shadow-sm">
                          -{Math.round(((parseFloat(product.compare_at_price) - parseFloat(product.price)) / parseFloat(product.compare_at_price)) * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-900 leading-tight mb-1 line-clamp-2">
                        {product.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900">
                          {formatPrice(product.price)} ₼
                        </span>
                        {product.compare_at_price && parseFloat(product.compare_at_price) > parseFloat(product.price) && (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(product.compare_at_price)} ₼
                            </span>
                            <span className="text-[10px] text-red-600 font-bold bg-red-50 px-1 rounded">
                              -{Math.round(((parseFloat(product.compare_at_price) - parseFloat(product.price)) / parseFloat(product.compare_at_price)) * 100)}%
                            </span>
                          </div>
                        )}
                      </div>
                      {product.category && (
                        <p className="text-xs text-gray-400 mt-0.5">{product.category}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
};
