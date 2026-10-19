import React from 'react';
import {
  Grid,
  Heart,
  Flame,
  Users,
  User,
  BookOpen,
  MapPin,
  Image as ImageIcon,
  Shirt,
  Puzzle,
} from 'lucide-react';

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
  const categories: Array<{ id: CategoryFilter; label: string; icon: React.ReactNode; glow: string }> = [
    { id: 'all', label: 'All', icon: <Grid className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'favorites', label: 'Favorites', icon: <Heart className="w-4 h-4 fill-current" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'recent', label: 'Recent', icon: <Flame className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'personas', label: 'Personas', icon: <User className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'lorebooks', label: 'Lorebooks', icon: <BookOpen className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'locations', label: 'Locations', icon: <MapPin className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'images', label: 'Images', icon: <ImageIcon className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'wardrobe', label: 'Wardrobe', icon: <Shirt className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
    { id: 'plugins', label: 'Plugins', icon: <Puzzle className="w-4 h-4" />, glow: 'from-pink-100 to-rose-200' },
  ];

  return (
    <div className="w-full px-4 sm:px-6 py-2">
      <div className="bg-white/70 backdrop-blur-xl border border-white/90 rounded-3xl p-3 shadow-[0_8px_24px_rgba(115,44,74,.13)] overflow-x-auto no-scrollbar">
        <div className="flex items-center justify-between min-w-[700px] gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="flex flex-col items-center justify-center space-y-1.5 group flex-1 py-1 transition-all"
              >
                <div
                  className={`relative p-0.5 rounded-full transition-all duration-300 ${
                    isActive
                      ? 'bg-gradient-to-tr from-white via-[#ffd3e5] to-[#f4a9c6] scale-110 shadow-[0_0_16px_rgba(219,94,146,.35)]'
                      : 'bg-white/70 hover:bg-white group-hover:scale-105'
                  }`}
                >
                  <div
                    className={`w-11 h-11 rounded-full bg-gradient-to-br from-[#fffafd] via-[#ffe1ed] to-[#f4aec9] flex items-center justify-center text-[#211019] border border-white/90 shadow-inner`}
                  >
                    {cat.icon}
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
