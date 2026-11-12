import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Play, Plus, Check, ChevronDown, Star, Sparkles, Volume2 } from 'lucide-react';

export default function MovieCard({ 
  movie, 
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList,
  isGrid = false 
}) {
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseEnter = () => {
    if (typeof window !== 'undefined' && window.matchMedia('(hover: hover)').matches) {
      setIsHovered(true);
    }
  };

  const isCam = Boolean(movie?.isCamQuality);
  const releaseYear = movie.release_date?.slice(0, 4) || movie.first_air_date?.slice(0, 4) || '2026';
  const ratingScore = Number(movie.vote_average || 8.4).toFixed(1);

  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`relative select-none cursor-pointer group ${
        isGrid ? 'w-full' : 'shrink-0 w-36 sm:w-44 md:w-52 lg:w-56'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Container with Specular Ambient Glow */}
      <div 
        onClick={() => onOpenDetails(movie)}
        className="specular-card relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#07070d] border border-white/[0.12] transition-all duration-300 group-hover:border-netflix-red/60 group-hover:shadow-[0_16px_40px_rgba(229,9,20,0.35)] shadow-[0_10px_30px_rgba(0,0,0,0.85)]"
      >
        {/* Shimmer Glare Effect */}
        <div className="card-glare hidden sm:block opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        <img 
          src={movie.poster_path} 
          alt={movie.title}
          loading="lazy"
          decoding="async"
          width="224"
          height="336"
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-108"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
          }}
        />

        {/* Ambient Gradient Overlay on Poster */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#040407] via-transparent to-black/40 opacity-80 group-hover:opacity-60 transition-opacity" />

        {/* Top Badges: Audio Dub + Quality + Rating */}
        <div className="absolute top-2.5 inset-x-2.5 z-10 flex items-center justify-between pointer-events-none gap-1">
          {/* Audio Tag: Latino Oficial */}
          <div className="flex items-center space-x-1 bg-emerald-500/90 text-black border border-emerald-300/40 text-[9px] font-black tracking-wider px-2 py-0.5 rounded-full shadow-[0_2px_10px_rgba(16,185,129,0.4)] backdrop-blur-md">
            <Volume2 className="w-2.5 h-2.5 text-black stroke-[3]" />
            <span>LATINO</span>
          </div>

          <div className="flex items-center space-x-1.5">
            {isCam ? (
              <span className="bg-amber-500/90 text-black text-[9px] font-black px-1.5 py-0.5 rounded-md shadow">
                CAM CINE
              </span>
            ) : (
              <span className="bg-black/75 text-white/90 border border-white/20 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-md backdrop-blur-md">
                4K HDR
              </span>
            )}
            <span className="bg-black/75 text-amber-300 border border-amber-400/30 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center backdrop-blur-md">
              <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 inline mr-0.5" />
              {ratingScore}
            </span>
          </div>
        </div>

        {/* Progress bar if playback was recorded */}
        {movie.progressPercent > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/80 z-10 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-netflix-red via-rose-500 to-amber-400 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(4, movie.progressPercent))}%` }}
            />
          </div>
        )}

        {/* Desktop Quick Action Overlay */}
        {isHovered && (
          <div 
            className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-[#040407] via-[#040407]/80 to-transparent flex-col justify-end p-3.5 z-20 animate-fadeIn"
          >
            <div className="flex items-center space-x-2 mb-2.5">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(movie, 1, 1);
                }}
                className="btn-primary-cinema flex-1 h-9 px-3 rounded-full text-white flex items-center justify-center space-x-1.5 text-xs font-black cursor-pointer active:scale-95 transition-all shadow-[0_4px_20px_rgba(229,9,20,0.65)]"
                title="Reproducir ahora en 4K con Audio en Español Latino"
              >
                <Play className="w-3.5 h-3.5 fill-white text-white shrink-0" />
                <span className="truncate">Ver 4K</span>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMyList(movie);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 transition-all shrink-0 cursor-pointer active:scale-95"
                title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
              >
                {isInMyList ? <Check className="w-4 h-4 text-emerald-400" /> : <Plus className="w-4 h-4" />}
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(movie);
                }}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center border border-white/20 transition-all shrink-0 cursor-pointer active:scale-95"
                title="Ver detalles, temporadas y servidores"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center space-x-2 text-[10px] text-white/80 font-semibold truncate">
              <span className="text-emerald-400 font-bold">{movie.match || 98}% Match</span>
              <span>•</span>
              <span>{releaseYear}</span>
              <span>•</span>
              <span className="px-1.5 py-0.5 rounded bg-white/15 text-[9px] font-bold text-amber-300">DOLBY 5.1</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Info Box: Clear Typography & Metadata */}
      <div className="mt-2.5 px-0.5 space-y-1" onClick={() => onOpenDetails(movie)}>
        <h4 className="text-white/95 group-hover:text-white text-xs sm:text-[13px] font-black truncate tracking-tight transition-colors">
          {movie.title}
        </h4>
        <div className="flex items-center space-x-1.5 text-[10px] text-gray-400 group-hover:text-gray-300 transition-colors font-medium truncate">
          {movie.savedMinuteText ? (
            <span className="text-netflix-red font-bold truncate">
              {movie.isTv && movie.lastEpisode ? `T${movie.lastSeason || 1}:E${movie.lastEpisode} · ` : ''}
              {movie.savedMinuteText}
            </span>
          ) : (
            <>
              <span className="font-semibold text-white/70">{releaseYear}</span>
              <span>•</span>
              <span className="truncate text-emerald-400 font-semibold">{movie.genres?.[0] || 'Español Latino'}</span>
              <span>•</span>
              <span className="text-gray-500">{movie.isTv ? 'Serie' : 'Película'}</span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
