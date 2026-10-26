import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Tv, Film, Star, Zap, Skull, Compass, Rocket } from 'lucide-react';

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'Todo el Catálogo', icon: Film },
  { id: 'movies', label: 'Películas 4K', icon: Zap, badge: 'Ultra HD' },
  { id: 'series', label: 'Series Completas', icon: Tv, badge: 'Temporadas' },
  { id: 'top10', label: 'Top 10 Hoy', icon: Flame, badge: 'Tendencia' },
  { id: 'action', label: 'Acción & Adrenalina', icon: Rocket },
  { id: 'scifi', label: 'Ciencia Ficción', icon: Compass },
  { id: 'horror', label: 'Terror & Suspenso', icon: Skull },
  { id: 'animation', label: 'Animación & Anime', icon: Sparkles },
  { id: 'topRated', label: 'Obras Maestras', icon: Star },
];

export default function CategoryPills({ activeCategory, onSelectCategory }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 select-none">
      <div className="flex items-center space-x-2.5 overflow-x-auto no-scrollbar scroll-smooth py-1">
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-2 shrink-0 ${
                isActive 
                  ? 'text-white shadow-xl shadow-red-900/40' 
                  : 'text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/5'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-netflix-red rounded-xl"
                  transition={{ type: "spring", stiffness: 450, damping: 30 }}
                />
              )}

              {Icon && <Icon className="w-3.5 h-3.5 relative z-10" />}
              <span className="relative z-10">{cat.label}</span>
              
              {cat.badge && (
                <span className={`relative z-10 text-[9px] px-1.5 py-0.2 rounded-md font-black ${
                  isActive ? 'bg-black/40 text-amber-300' : 'bg-white/10 text-amber-400'
                }`}>
                  {cat.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
