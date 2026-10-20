import React from 'react';


export type CategoryFilter =
  | 'all'
  | 'favorites'
  | 'recent'
  | 'characters'
  | 'personas'
  | 'lorebooks'
  | 'locations'
  | 'images'
  | 'wardrobe'
  | 'plugins';

interface CategoryPillsProps {
  activeCategory: CategoryFilter;
  onSelectCategory: (cat: CategoryFilter) => void;
}

export const CategoryPills: React.FC<CategoryPillsProps> = ({
  activeCategory,
  onSelectCategory,
}) => {
  const categories: Array<{ id: CategoryFilter; label: string; glyph: string; glow: string }> = [
    { id: 'all', label: 'All', glyph: '▦', glow: 'from-pink-100 to-rose-200' },
    { id: 'favorites', label: 'Favorites', glyph: '♡', glow: 'from-pink-100 to-rose-200' },
    { id: 'recent', label: 'Recent', glyph: '◷', glow: 'from-pink-100 to-rose-200' },
    { id: 'characters', label: 'Characters', glyph: '♟', glow: 'from-pink-100 to-rose-200' },
    { id: 'personas', label: 'Personas', glyph: '♙', glow: 'from-pink-100 to-rose-200' },
    { id: 'lorebooks', label: 'Lorebooks', glyph: '▤', glow: 'from-pink-100 to-rose-200' },
    { id: 'locations', label: 'Locations', glyph: '⌖', glow: 'from-pink-100 to-rose-200' },
    { id: 'images', label: 'Images', glyph: '▧', glow: 'from-pink-100 to-rose-200' },
    { id: 'wardrobe', label: 'Wardrobe', glyph: '♧', glow: 'from-pink-100 to-rose-200' },
    { id: 'plugins', label: 'Plugins', glyph: '✣', glow: 'from-pink-100 to-rose-200' },
  ];

  return (
    <div className="w-full px-4 sm:px-6 py-2">
      <div className="plf-category-strip bg-white/70 backdrop-blur-xl border border-white/90 rounded-3xl p-3 shadow-[0_8px_24px_rgba(115,44,74,.13)] overflow-x-auto no-scrollbar">
        <div className="plf-category-strip-items flex items-center justify-between min-w-[700px] gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                aria-pressed={isActive}
                className="plf-category-pill flex flex-col items-center justify-center space-y-1.5 group flex-1 py-1 transition-all"
              >
                <div
                  className={`plf-category-icon-ring relative p-1 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-tr from-white via-[#ffd3e5] to-[#c6ecf5] scale-110 shadow-[0_0_16px_rgba(219,94,146,.35)]'
                      : 'bg-white/35 hover:bg-white/55 group-hover:scale-105'
                  }`}
                >
                  <div
                    className={`plf-category-icon w-11 h-11 rounded-full flex items-center justify-center text-[#211019] border border-white/90 shadow-inner`}
                  >
                    <span aria-hidden="true" className="plf-category-glyph" style={{ color: "#211019", WebkitTextFillColor: "#211019", fontFamily: "Arial, sans-serif", fontSize: "24px", fontWeight: 700, lineHeight: 1 }}>{cat.glyph}</span>
                  </div>
                  <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                </div>

                <span
                  className={`text-xs font-semibold transition-colors ${
                    isActive ? 'text-[#211019]' : 'text-[#654552] group-hover:text-[#211019]'
                  }`}
                >
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
