import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { StorefrontLayout } from '../components/StorefrontLayout';
import { ProductCard } from '../components/ProductCard';
import { storefrontApi } from '../../../shared/api';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Ən Yeni' },
  { value: 'price_asc', label: 'Qiymət ↑' },
  { value: 'price_desc', label: 'Qiymət ↓' },
  { value: 'popular', label: 'Populyar' },
];

export const ShopHomePage = () => {
  const [searchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [favorites, setFavorites] = useState(() => {
    try { return JSON.parse(localStorage.getItem('favorites') || '[]'); } catch { return []; }
  });

  // Load categories once
  useEffect(() => {
    storefrontApi.getCategories().then(data => setCategories(data || [])).catch(() => { });
  }, []);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedCategory === 'new_arrival') {
        params.is_new_arrival = true;
      } else if (selectedCategory) {
        params.category = selectedCategory;
      }
      if (searchQuery) params.search = searchQuery;
      if (sortBy) params.sort_by = sortBy;

      const data = await storefrontApi.getProducts(params);
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, searchQuery, sortBy]);

  // Load products whenever filters change
  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleSearch = useCallback((val) => {
    setSearchQuery(val);
  }, []);


  const toggleFavorite = useCallback((e, productId) => {
    e.stopPropagation();
    setFavorites(prev => {
      const isFav = prev.includes(productId);
      const updated = isFav ? prev.filter(id => id !== productId) : [...prev, productId];
      localStorage.setItem('favorites', JSON.stringify(updated));
      window.dispatchEvent(new Event('favoritesUpdated'));
      return updated;
    });
  }, []);

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
                  className={`w-full text-left text-sm py-1.5 px-0 transition-colors ${!selectedCategory
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
                  className={`w-full text-left text-sm py-1.5 px-0 transition-colors ${selectedCategory === 'new_arrival'
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
                    className={`w-full text-left text-sm py-1.5 px-0 transition-colors ${selectedCategory === cat
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
                  className={`flex-shrink-0 px-3 py-1.5 text-xs border rounded-full transition-colors ${!selectedCategory
                    ? 'bg-gray-900 text-white border-gray-900'
                    : 'border-gray-300 text-gray-600 hover:border-gray-600'
                    }`}
                >Hamısı</button>
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex-shrink-0 px-3 py-1.5 text-xs border rounded-full transition-colors ${selectedCategory === cat
                      ? 'bg-gray-900 text-white border-gray-900'
                      : 'border-gray-300 text-gray-600 hover:border-gray-600'
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
                {SORT_OPTIONS.map(opt => (
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
              {products.map((product) => (
                <ProductCard 
                  key={product.id} 
                  product={product} 
                  isFavorite={favorites.includes(product.id)} 
                  onFavoriteToggle={toggleFavorite} 
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </StorefrontLayout>
  );
};
