import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Check, ChevronDown, Star } from 'lucide-react';
import { StreamScannerService } from '../services/streamScannerService';

export default function MovieCard({ 
  movie, 
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    setIsHovered(true);
    // Pre-calentar en caché los enlaces funcionales al pasar el cursor para inicio en 0ms
    if (movie?.id) {
      StreamScannerService.scanAllWorkingLinks(movie, 1, 1).catch(() => {});
    }
  };

  return (
    <motion.div 
      className="relative shrink-0 w-36 sm:w-44 md:w-48 lg:w-52 select-none cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 400, damping: 28 }}
    >
      {/* Poster Container */}
      <div 
        onClick={() => onOpenDetails(movie)}
        className="specular-card relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0a0a10] border border-white/[0.1] transition-all duration-300 group-hover:border-white/35 group-hover:shadow-[0_22px_48px_rgba(0,0,0,0.92)]"
      >
        <img 
          src={movie.poster_path} 
          alt={movie.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 filter brightness-[0.97] group-hover:brightness-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
          }}
        />

        {/* Top Badges: Español Latino 4K + Rating */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
          <span className="bg-black/65 backdrop-blur-xl text-emerald-300 text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full border border-emerald-500/25">
            LATINO 4K
          </span>
          <span className="bg-black/65 backdrop-blur-xl text-white/95 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center border border-white/[0.14]">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 inline mr-1" />
            {Number(movie.vote_average || 8.4).toFixed(1)}
          </span>
        </div>

        {/* Hover Quick Action Overlay (Desktop / Tablet) */}
        <motion.div 
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent flex flex-col justify-end p-3 z-20 pointer-events-auto"
        >
          <div className="flex items-center space-x-1.5 mb-2">
            <motion.button 
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.95 }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(movie, 1, 1);
              }}
              className="flex-1 h-8 px-3 rounded-full bg-white text-black flex items-center justify-center space-x-1.5 hover:bg-neutral-200 shadow-lg text-[11px] font-bold cursor-pointer"
              title="Reproducir ahora"
            >
              <Play className="w-3 h-3 fill-black text-black shrink-0" />
              <span className="truncate">Ver</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMyList(movie);
              }}
              className="w-8 h-8 rounded-full bg-white/[0.14] hover:bg-white/[0.24] backdrop-blur-xl text-white flex items-center justify-center border border-white/20 transition-all shrink-0 cursor-pointer"
              title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
            >
              {isInMyList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(movie);
              }}
              className="w-8 h-8 rounded-full bg-white/[0.14] hover:bg-white/[0.24] backdrop-blur-xl text-white flex items-center justify-center border border-white/20 transition-all shrink-0 cursor-pointer"
              title="Detalles y episodios"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] text-white/75 font-medium truncate">
            <span className="text-emerald-400 font-semibold">{movie.release_date?.slice(0, 4) || '2025'}</span>
            <span>·</span>
            <span>4K</span>
            <span>·</span>
            <span className="truncate">{movie.genres?.[0] || 'Latino'}</span>
          </div>
        </motion.div>
      </div>

      {/* Minimal Title Caption */}
      <div className="mt-2 px-0.5" onClick={() => onOpenDetails(movie)}>
        <h4 className="text-white/85 group-hover:text-white text-xs sm:text-[13px] font-semibold truncate transition-colors">
          {movie.title}
        </h4>
      </div>
    </motion.div>
  );
}
