import React, { useState } from 'react';
import { Play, Plus, Check, ChevronDown, Star } from 'lucide-react';

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

  return (
    <div 
      className={`relative select-none cursor-pointer group transition-transform duration-200 ease-out sm:hover:-translate-y-1.5 active:scale-[0.97] ${
        isGrid ? 'w-full' : 'shrink-0 w-32 sm:w-40 md:w-48 lg:w-52'
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Poster Container */}
      <div 
        onClick={() => onOpenDetails(movie)}
        className="specular-card cinema-card-glow relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0a0a12] border border-white/[0.12] transition-colors duration-200 sm:group-hover:border-netflix-red/70 shadow-[0_8px_24px_rgba(0,0,0,0.65)]"
      >
        {/* Reflejo diagonal dinámico al pasar el cursor (solo desktop) */}
        <div className="card-glare hidden sm:block" />

        <img 
          src={movie.poster_path} 
          alt={movie.title}
          loading="lazy"
          decoding="async"
          width="208"
          height="312"
          className="w-full h-full object-cover transition-transform duration-300 ease-out sm:group-hover:scale-105"
          onError={(e) => {
            e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=500&auto=format&fit=crop';
          }}
        />

        {/* Top Badges: 4K UHD + Rating (sin backdrop-blur pesado para 60/120 FPS en móvil) */}
        <div className="absolute top-2 inset-x-2 z-10 flex items-center justify-between pointer-events-none">
          <span className="bg-black/80 text-white/95 border border-white/15 text-[9px] font-black tracking-wider px-1.5 py-0.5 rounded-md">
            4K UHD
          </span>
          <span className="bg-black/80 text-amber-300 border border-white/15 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center">
            <Star className="w-2.5 h-2.5 text-amber-400 fill-amber-400 inline mr-1" />
            {Number(movie.vote_average || 8.4).toFixed(1)}
          </span>
        </div>

        {/* Barra de progreso de reproducción guardada (Netflix style) */}
        {movie.progressPercent > 0 && (
          <div className="absolute bottom-0 inset-x-0 h-1.5 bg-black/75 z-10 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-netflix-red to-rose-500 transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(4, movie.progressPercent))}%` }}
            />
          </div>
        )}

        {/* Hover Quick Action Overlay (Solo se monta en Desktop cuando hay hover, 0 nodos extra en móvil) */}
        {isHovered && (
          <div 
            className="hidden sm:flex absolute inset-0 bg-gradient-to-t from-[#050509] via-[#050509]/75 to-transparent flex-col justify-end p-3 z-20 animate-fadeIn"
          >
            <div className="flex items-center space-x-1.5 mb-2">
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onPlay(movie, 1, 1);
                }}
                className="btn-primary-cinema flex-1 h-8 px-3 rounded-full text-white flex items-center justify-center space-x-1.5 text-[11px] font-black cursor-pointer active:scale-95 transition-transform"
                title="Reproducir ahora en Español Latino 4K"
              >
                <Play className="w-3 h-3 fill-white text-white shrink-0" />
                <span className="truncate">Ver Ahora</span>
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleMyList(movie);
                }}
                className="w-8 h-8 rounded-full bg-black/75 hover:bg-white/25 text-white flex items-center justify-center border border-white/25 transition-all shrink-0 cursor-pointer active:scale-95"
                title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
              >
                {isInMyList ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Plus className="w-3.5 h-3.5" />}
              </button>

              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenDetails(movie);
                }}
                className="w-8 h-8 rounded-full bg-black/75 hover:bg-white/25 text-white flex items-center justify-center border border-white/25 transition-all shrink-0 cursor-pointer active:scale-95"
                title="Detalles y episodios"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex items-center space-x-1.5 text-[10px] text-white/85 font-semibold truncate">
              <span className="text-emerald-400 font-bold">{movie.match || 98}% Match</span>
              <span>·</span>
              <span>{movie.release_date?.slice(0, 4) || '2025'}</span>
              <span>·</span>
              <span className="px-1 py-0.2 rounded bg-white/15 text-[9px] font-bold text-amber-300">UHD</span>
            </div>
          </div>
        )}
      </div>

      {/* Minimal Title Caption + Meta */}
      <div className="mt-2 px-0.5 space-y-0.5" onClick={() => onOpenDetails(movie)}>
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
    </div>
  );
}
