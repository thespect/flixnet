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
      whileHover={{ y: -10, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
    >
      {/* Poster Container */}
      <div 
        onClick={() => onOpenDetails(movie)}
        className="specular-card relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0a0a12] border border-white/[0.12] transition-all duration-300 group-hover:border-netflix-red/70 group-hover:shadow-[0_22px_50px_-10px_rgba(229,9,20,0.48)]"
      >
        {/* Reflejo diagonal dinámico al pasar el cursor */}
        <div className="card-glare" />

        <img 
          src={movie.poster_path} 
          alt={movie.title}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 filter brightness-[0.97] group-hover:brightness-105 saturate-[1.06]"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
          }}
        />

        {/* Top Badges: Español Latino 4K + Rating */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
          <span className="bg-black/75 backdrop-blur-xl text-emerald-300 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full border border-emerald-400/35 shadow-lg flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LATINO 4K</span>
          </span>
          <span className="bg-black/75 backdrop-blur-xl text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center border border-white/[0.18] shadow-lg">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 inline mr-1" />
            {Number(movie.vote_average || 8.4).toFixed(1)}
          </span>
        </div>

        {/* Hover Quick Action Overlay (Desktop / Tablet) con animación de elevación */}
        <motion.div 
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 bg-gradient-to-t from-[#050509] via-[#050509]/70 to-transparent flex flex-col justify-end p-3 z-20 pointer-events-auto"
        >
          <div className="flex items-center space-x-1.5 mb-2">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(movie, 1, 1);
              }}
              className="btn-shimmer flex-1 h-8 px-3 rounded-full bg-gradient-to-r from-netflix-red to-rose-600 text-white flex items-center justify-center space-x-1.5 hover:from-red-600 hover:to-rose-500 shadow-[0_6px_20px_rgba(229,9,20,0.55)] text-[11px] font-black cursor-pointer border border-white/20"
              title="Reproducir ahora en Español Latino 4K"
            >
              <Play className="w-3 h-3 fill-white text-white shrink-0" />
              <span className="truncate">Ver Ahora</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleMyList(movie);
              }}
              className="w-8 h-8 rounded-full bg-white/[0.16] hover:bg-white/[0.28] backdrop-blur-xl text-white flex items-center justify-center border border-white/25 transition-all shrink-0 cursor-pointer"
              title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
            >
              {isInMyList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.92 }}
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetails(movie);
              }}
              className="w-8 h-8 rounded-full bg-white/[0.16] hover:bg-white/[0.28] backdrop-blur-xl text-white flex items-center justify-center border border-white/25 transition-all shrink-0 cursor-pointer"
              title="Detalles y episodios"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </motion.button>
          </div>

          <div className="flex items-center space-x-1.5 text-[10px] text-white/85 font-semibold truncate">
            <span className="text-emerald-400 font-bold">{movie.match || 98}% Match</span>
            <span>·</span>
            <span>{movie.release_date?.slice(0, 4) || '2025'}</span>
            <span>·</span>
            <span className="px-1 py-0.2 rounded bg-white/15 text-[9px] font-bold text-amber-300">UHD</span>
          </div>
        </motion.div>
      </div>

      {/* Minimal Title Caption + Meta */}
      <div className="mt-2.5 px-0.5 space-y-0.5" onClick={() => onOpenDetails(movie)}>
        <h4 className="text-white/90 group-hover:text-white text-xs sm:text-[13px] font-bold truncate transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center space-x-1.5 text-[10px] text-white/45 group-hover:text-emerald-400/90 transition-colors font-medium truncate">
          <span>{movie.release_date?.slice(0, 4) || '2025'}</span>
          <span>•</span>
          <span className="truncate">{movie.genres?.[0] || 'Español Latino'}</span>
        </div>
      </div>
    </motion.div>
  );
}
