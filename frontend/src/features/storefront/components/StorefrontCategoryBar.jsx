/**
 * StorefrontCategoryBar — Top horizontal category navigation bar
 *
 * Displays top-level categories with their subcategories underneath.
 * When a top category is clicked, it highlights using shop.primary_color
 * and filters products to show only items matching subcategory names.
 */
import { useState } from 'react';

export const StorefrontCategoryBar = ({ categories, allNames, primaryColor, onSelect }) => {
  const [activeId, setActiveId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);

  if (!categories || categories.length === 0 && allNames?.length > 0) {
    // No hierarchical categories yet — fall back to flat list display
    return null;
  }

  const handleClick = (catId) => {
    setActiveId(prev => prev === catId ? null : catId);
    const filtered = [];
    for (const cat of categories) {
      if (cat.id === catId && cat.children.length > 0) {
        filtered.push(...cat.children.map(c => c.name));
      }
    }
    onSelect(filtered, catId);
  };

  const handleReset = () => {
    setActiveId(null);
    onSelect(allNames, null);
  };

  return (
    <div className="bg-white border-b border-gray-100 sticky top-[69px] z-40">
      {/* Main categories strip */}
      <div className="max-w-screen-xl mx-auto px-6 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 py-2 min-w-max">
          <button
            onClick={handleReset}
            className={`flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
              activeId === null
                ? 'text-white shadow-sm'
                : 'text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
            }`}
            style={{ backgroundColor: activeId === null ? primaryColor : undefined }}
          >
            Hamısı
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleClick(cat.id)}
              onMouseEnter={() => setHoveredId(cat.id)}
              onMouseLeave={() => setHoveredId(null)}
              className={`relative flex-shrink-0 px-4 py-1.5 text-xs font-semibold rounded-full transition-all duration-200 ${
                activeId === cat.id
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100'
              }`}
              style={{ backgroundColor: activeId === cat.id ? primaryColor : undefined }}
            >
              {cat.name}
              {cat.children.length > 0 && (
                <svg
                  className="w-3 h-3 inline-block ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d={activeId === cat.id ? 'M5 15l7-7 7 7' : 'M19 9l-7 7-7-7'}
                  />
                </svg>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Subcategories row — appears below when a main category is selected */}
      {activeId !== null && (() => {
        const activeCat = categories.find(c => c.id === activeId);
        if (!activeCat || activeCat.children.length === 0) return null;
        return (
          <div
            className="max-w-screen-xl mx-auto px-6 pb-2 overflow-x-auto scrollbar-hide"
            style={{ animation: 'fade-up 0.2s ease-out' }}
          >
            <div className="flex items-center gap-1.5 py-1 min-w-max">
              {activeCat.children.map((child) => (
                <span
                  key={child.id}
                  className="flex-shrink-0 px-3 py-1 text-xs text-gray-600 bg-gray-50 rounded-full cursor-default"
                >
                  {child.name}
                </span>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
