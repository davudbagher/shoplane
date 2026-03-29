import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export const ProductCard = ({ 
  product, 
  variant = 'default', // 'default' | 'favorite'
  isFavorite = false,
  onFavoriteToggle,
  onRemove,
  onAddToCart,
}) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollContainerRef = useRef(null);

  // Normalize images array
  const images = useMemo(() => {
    try {
      if (Array.isArray(product.images)) return product.images;
      if (typeof product.images === 'string') {
        const parsed = JSON.parse(product.images);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch { 
      // return empty if parsing fails
    }
    return [];
  }, [product.images]);

  const hasMultipleImages = images.length > 1;

  // Handle dot indicators via scroll listener
  useEffect(() => {
    if (!hasMultipleImages) return;
    
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Calculate active index based on scroll position
      const scrollPosition = container.scrollLeft;
      const width = container.clientWidth;
      const index = Math.round(scrollPosition / width);
      setCurrentIndex(index);
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMultipleImages]);

  const scrollToIndex = (index, e) => {
    if (e) e.stopPropagation();
    const container = scrollContainerRef.current;
    if (!container) return;
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: 'smooth'
    });
  };

  const formatPrice = (price) => parseFloat(price || 0).toFixed(2);

  const calculateDiscount = () => {
    if (!product.compare_at_price) return 0;
    const current = parseFloat(product.price);
    const original = parseFloat(product.compare_at_price);
    if (original > current) {
      return Math.round(((original - current) / original) * 100);
    }
    return 0;
  };

  const discount = calculateDiscount();

  return (
    <div className="group cursor-pointer">
      {/* ── IMAGE WRAPPER ── */}
      <div 
        className="relative overflow-hidden bg-gray-100 aspect-[3/4] mb-3 group/image"
        onClick={() => navigate(`/products/${product.id}`)}
      >
        {/* Swiper logic */}
        {images.length > 0 ? (
          <div 
            ref={scrollContainerRef}
            className={`w-full h-full flex overflow-y-hidden 
              ${hasMultipleImages ? 'overflow-x-auto snap-x snap-mandatory scrollbar-hide' : ''}`}
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }} // hide standard scrollbars
          >
            {images.map((img, idx) => (
              <div key={idx} className="w-full h-full flex-shrink-0 snap-center relative">
                <img
                  src={img}
                  alt={`${product.name} - ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover/image:scale-105"
                  // Only allow the top image to scale to prevent weird clipping during swipe
                  style={hasMultipleImages ? { transform: 'none' } : {}}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* ── DOT INDICATORS (Mobile + Desktop) ── */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-0 right-0 z-20 flex justify-center gap-1.5">
            {images.map((_, idx) => (
              <div 
                key={idx}
                className={`transition-all duration-300 rounded-full bg-white shadow-sm 
                  ${currentIndex === idx ? 'w-4 h-1.5 opacity-100' : 'w-1.5 h-1.5 opacity-50'}`}
              />
            ))}
          </div>
        )}

        {/* ── DESKTOP ARROWS (Hover only) ── */}
        {hasMultipleImages && (
          <>
            {currentIndex > 0 && (
              <button 
                onClick={(e) => scrollToIndex(currentIndex - 1, e)}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-gray-700"
              >
                <svg className="w-4 h-4 ml-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
            )}
            {currentIndex < images.length - 1 && (
              <button 
                onClick={(e) => scrollToIndex(currentIndex + 1, e)}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white text-gray-700"
              >
                <svg className="w-4 h-4 mr-[-2px]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </button>
            )}
          </>
        )}

        {/* ── ACTION OVERLAYS ── */}
        {variant === 'default' ? (
          <>
            <button
              onClick={(e) => onFavoriteToggle?.(e, product.id)}
              className="absolute top-2 right-2 z-30 bg-white/80 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-white transition-colors opacity-0 group-hover:opacity-100"
              style={isFavorite ? { opacity: 1 } : {}}
              title={isFavorite ? 'Sevimlilərdən çıxar' : 'Sevimlilərə əlavə et'}
            >
              <svg className="w-4 h-4" fill={isFavorite ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  className={isFavorite ? 'text-red-500' : 'text-gray-600'}
                />
              </svg>
            </button>
            
            <div className="absolute inset-x-0 bottom-0 top-auto flex flex-col justify-end opacity-0 group-hover/image:opacity-100 transition-opacity duration-300 pb-8 z-10 bg-gradient-to-t from-black/20 to-transparent">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/products/${product.id}`);
                }}
                className="mx-auto w-[85%] bg-white text-gray-900 text-xs font-bold py-3 px-6 tracking-wide uppercase shadow-lg hover:bg-gray-900 hover:text-white transition-colors flex justify-center items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
                Ətraflı Bax
              </button>
            </div>
          </>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onRemove?.(product.id); }}
            className="absolute top-2 right-2 z-30 bg-white/90 backdrop-blur-sm p-1.5 rounded-full shadow-sm hover:bg-red-50 transition-colors"
            title="Sevimlilərdən çıxar"
          >
            <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        )}

        {/* ── BADGES ── */}
        <div className="absolute top-2 left-2 z-30 flex flex-col gap-1 items-start pointer-events-none">
          {product.track_inventory && product.inventory_count <= 5 && product.inventory_count > 0 && (
            <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
              Son {product.inventory_count}
            </span>
          )}
          {product.track_inventory && product.inventory_count === 0 && (
            <span className="bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide">
              Stokda Yoxdur
            </span>
          )}
          {discount > 0 && (
            <span className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wide shadow-sm">
              -{discount}%
            </span>
          )}
        </div>
      </div>

      {/* ── INFO WRAPPER ── */}
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
          {discount > 0 && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compare_at_price)} ₼
            </span>
          )}
        </div>

        {variant === 'default' && product.category && (
          <p className="text-xs text-gray-400 mt-[-4px] mb-2">{product.category}</p>
        )}

        {variant === 'favorite' && (
          <button
            onClick={(e) => { e.stopPropagation(); onAddToCart?.(product); }}
            className="w-full py-2.5 mt-2 text-xs font-bold uppercase tracking-wider bg-gray-950 text-white hover:bg-gray-800 transition-colors"
          >
            Səbətə Əlavə Et
          </button>
        )}
      </div>
      
      {/* Hide Scrollbars completely natively (Chrome/Safari) */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none; /* IE and Edge */
          scrollbar-width: none; /* Firefox */
        }
      `}</style>
    </div>
  );
};
