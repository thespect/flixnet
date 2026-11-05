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
      className="relative shrink-0 w-32 sm:w-40 md:w-48 lg:w-52 select-none cursor-pointer group"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
      whileHover={{ y: -10, scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 380, damping: 24 }}
    >
      {/* Poster Container */}
      <div 
        onClick={() => onOpenDetails(movie)}
        className="specular-card cinema-card-glow relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0a0a12] border border-white/[0.12] transition-all duration-300 group-hover:border-netflix-red/70 will-change-transform"
      >
        {/* Reflejo diagonal dinámico al pasar el cursor */}
        <div className="card-glare" />

        <img 
          src={movie.poster_path} 
          alt={movie.title}
          loading="lazy"
          decoding="async"
          width="208"
          height="312"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 filter brightness-[0.98] group-hover:brightness-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
          }}
        />

        {/* Top Badges: Español Latino 4K + Rating */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none">
          <span className="cinema-badge-emerald text-emerald-300 text-[9px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LATINO 4K</span>
          </span>
          <span className="cinema-badge-amber text-amber-300 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 inline mr-1" />
            {Number(movie.vote_average || 8.4).toFixed(1)}
          </span>
        </div>

        {/* Barra de progreso de reproducción guardada (Netflix style) */}
        {movie.progressPercent > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/70 z-10 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-netflix-red to-rose-500 shadow-[0_0_10px_rgba(229,9,20,0.9)] transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(4, movie.progressPercent))}%` }}
            />
          </div>
        )}

        {/* Hover Quick Action Overlay (Desktop / Tablet) — Oculto en móviles para máximo rendimiento de scroll */}
        <motion.div 
          initial={false}
          animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 8 }}
          transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          className={`hidden sm:flex absolute inset-0 bg-gradient-to-t from-[#050509] via-[#050509]/75 to-transparent flex-col justify-end p-3 z-20 ${isHovered ? 'pointer-events-auto' : 'pointer-events-none'}`}
        >
          <div className="flex items-center space-x-1.5 mb-2">
            <motion.button 
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.94 }}
              onClick={(e) => {
                e.stopPropagation();
                onPlay(movie, 1, 1);
              }}
              className="btn-primary-cinema btn-shimmer flex-1 h-8 px-3 rounded-full text-white flex items-center justify-center space-x-1.5 text-[11px] font-black cursor-pointer"
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
          {movie.savedMinuteText ? (
            <span className="text-netflix-red font-bold truncate">
              {movie.isTv && movie.lastEpisode ? `T${movie.lastSeason || 1}:E${movie.lastEpisode} · ` : ''}
              {movie.savedMinuteText}
            </span>
          ) : (
            <>
              <span>{movie.release_date?.slice(0, 4) || '2025'}</span>
              <span>•</span>
              <span className="truncate">{movie.genres?.[0] || 'Español Latino'}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
