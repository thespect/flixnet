import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Tv, Film, Star, Zap, Skull, Compass, Rocket } from 'lucide-react';

export const CATEGORY_FILTERS = [
  { id: 'all', label: 'Explorar Todo', icon: Film },
  { id: 'movies', label: 'Películas 4K', icon: Zap },
  { id: 'series', label: 'Series', icon: Tv },
  { id: 'top10', label: 'Top 10 Hoy', icon: Flame },
  { id: 'action', label: 'Acción', icon: Rocket },
  { id: 'scifi', label: 'Ciencia Ficción', icon: Compass },
  { id: 'horror', label: 'Terror & Suspenso', icon: Skull },
  { id: 'animation', label: 'Animación', icon: Sparkles },
  { id: 'topRated', label: 'Aclamadas', icon: Star },
];

export default function CategoryPills({ activeCategory, onSelectCategory }) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 select-none">
      <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar scroll-smooth py-1">
        {CATEGORY_FILTERS.map((cat) => {
          const isActive = activeCategory === cat.id;
          const Icon = cat.icon;

          return (
            <motion.button
              key={cat.id}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelectCategory(cat.id)}
              className={`relative px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 shrink-0 cursor-pointer ${
                isActive 
                  ? 'text-white shadow-[0_8px_30px_rgba(229,9,20,0.55)]' 
                  : 'text-white/85 hover:text-white bg-[#0d0d16]/90 hover:bg-white/[0.14] border border-white/[0.14] backdrop-blur-2xl shadow-md'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeCategoryPill"
                  className="absolute inset-0 bg-gradient-to-r from-netflix-red via-rose-600 to-amber-500 rounded-full border border-white/35 shadow-[0_4px_25px_rgba(229,9,20,0.65)]"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                />
              )}

              {Icon && <Icon className={`w-3.5 h-3.5 relative z-10 ${isActive ? 'text-white' : 'text-netflix-red'}`} />}
              <span className="relative z-10">{cat.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
