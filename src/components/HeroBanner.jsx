import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles, Zap, Cast, ShieldCheck, Globe, Youtube, Star, ChevronRight } from 'lucide-react';
import { MovieAPI } from '../services/movieService';

export default function HeroBanner({ 
  movie, 
  featuredPool = [],
  featuredIndex = 0,
  onSelectFeaturedIndex,
  onPlay, 
  onOpenDetails, 
  onToggleMyList, 
  isInMyList,
  onRandomizeFeatured,
  onOpenCast
}) {
  const [isMuted, setIsMuted] = useState(true);
  const [showVideoTrailer, setShowVideoTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(movie?.trailer_id || null);

  useEffect(() => {
    setShowVideoTrailer(false);
    if (movie) {
      if (movie.trailer_id) {
        setTrailerKey(movie.trailer_id);
      } else {
        MovieAPI.getTrailer(movie.id, movie.isTv).then(key => {
          if (key) setTrailerKey(key);
        });
      }
    }
  }, [movie]);

  if (!movie) return null;

  const topCarouselItems = featuredPool.slice(0, 6);

  return (
    <div className="relative h-[85dvh] sm:h-[90dvh] min-h-[560px] sm:min-h-[660px] max-h-[940px] w-full select-none overflow-hidden bg-[#040407]">
      
      {/* Background: High-Res 4K Backdrop or On-Demand Video Trailer */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        {trailerKey && showVideoTrailer ? (
          <div className="relative w-full h-full pointer-events-none scale-125 md:scale-110">
            <iframe 
              key={trailerKey}
              src={`https://www.youtube-nocookie.com/embed/${trailerKey}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&showinfo=0&rel=0&loop=1&playlist=${trailerKey}&modestbranding=1&vq=hd2160&hl=es`}
              title="Tráiler de Fondo 4K"
              className="w-full h-full object-cover filter brightness-[0.72] contrast-[1.12]"
              allow="autoplay; encrypted-media"
            />
          </div>
        ) : (
          <motion.img 
            key={movie.id}
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            src={movie.backdrop_path || movie.poster_path} 
            alt={movie.title}
            fetchPriority="high"
            className="w-full h-full object-cover object-center filter brightness-[0.82] contrast-[1.08] saturate-[1.12]"
          />
        )}

        {/* Cinematic Multi-Layer Vignette Gradientes (Estilo Netflix / HBO Max) */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040407] via-[#040407]/75 to-transparent w-full md:w-3/4 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040407] via-[#040407]/30 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#040407]/90 via-[#040407]/40 to-transparent z-10" />
      </div>

      {/* Main Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-24 sm:pb-32 md:pb-36 z-20">
        
        <motion.div 
          key={movie.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-3 sm:space-y-4"
        >
          {/* Studio Wordmark / Category Pill (Limpio y Elegante) */}
          <div className="flex items-center space-x-2 text-xs font-bold">
            <span className="text-[10px] font-black uppercase tracking-widest text-netflix-red bg-netflix-red/10 border border-netflix-red/30 px-2.5 py-0.5 rounded-md">
              {movie.isTv ? 'SERIE DE TELEVISIÓN' : 'ESTRENO EN CINE 4K'}
            </span>
            <span className="text-gray-400 font-bold">•</span>
            <span className="text-emerald-400 font-extrabold flex items-center space-x-1">
              <Globe className="w-3 h-3 text-emerald-400 inline" />
              <span>Español Latino Oficial</span>
            </span>
          </div>

          {/* Title with High-Impact Responsive Typography */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)] leading-[0.98] line-clamp-2">
            {movie.title}
          </h1>

          {/* Metadata Bar (Estilo Auténtico Netflix: Coincidencia, Año, Edad, 4K UHD, Audio) */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-gray-200 font-semibold">
            <span className="text-emerald-400 font-black">98% para ti</span>
            <span>•</span>
            <span className="text-gray-300 font-bold">{movie.release_date?.slice(0, 4) || '2024'}</span>
            <span>•</span>
            <span className="border border-white/30 text-gray-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
              {movie.age_rating || '16+'}
            </span>
            <span>•</span>
            <span className="border border-white/30 text-gray-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
              4K ULTRA HD
            </span>
            <span>•</span>
            <span className="border border-white/30 text-gray-300 text-[10px] font-bold px-1.5 py-0.2 rounded">
              DOLBY ATMOS
            </span>
            {movie.genres?.slice(0, 2).map((genre, idx) => (
              <span key={idx} className="hidden sm:inline text-gray-400">
                • {genre}
              </span>
            ))}
          </div>

          {/* Overview */}
          <p className="text-xs sm:text-sm md:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-md max-w-xl font-normal">
            {movie.overview}
          </p>

          {/* Botones de Acción Estilo Streaming Oficial (Play Blanco + Más Info Translúcido) */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-2">
            
            {/* Botón Principal Reproducir: Blanco Sólido con Texto Negro (Auténtico Netflix / HBO Max) */}
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => movie.isTv ? onOpenDetails(movie) : onPlay(movie, 1, 1)}
              className="flex items-center justify-center space-x-2 px-6 sm:px-8 py-3 rounded-xl bg-white hover:bg-neutral-200 text-black font-black text-xs sm:text-base shadow-[0_10px_30px_rgba(255,255,255,0.25)] transition-all cursor-pointer"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-black text-black shrink-0" />
              <span>{movie.isTv ? 'Ver Temporadas' : 'Reproducir'}</span>
            </motion.button>

            {/* Botón Secundario: Más Información Translúcido */}
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenDetails(movie)}
              className="flex items-center justify-center space-x-2 px-5 sm:px-7 py-3 rounded-xl bg-neutral-600/60 hover:bg-neutral-600/80 backdrop-blur-md text-white font-bold text-xs sm:text-base transition-colors border border-white/10 cursor-pointer shadow-lg"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>Más información</span>
            </motion.button>

            {/* Mi Lista */}
            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onToggleMyList(movie)}
              className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all shadow-xl cursor-pointer"
              title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
            >
              {isInMyList ? <Check className="w-5 h-5 text-emerald-400" /> : <Plus className="w-5 h-5" />}
            </motion.button>

            {/* Transmitir a Smart TV */}
            {onOpenCast && (
              <motion.button 
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onOpenCast(movie)}
                className="w-11 h-11 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all shadow-xl cursor-pointer"
                title="Transmitir a Smart TV (AirPlay / Chromecast)"
              >
                <Cast className="w-5 h-5 text-emerald-400" />
              </motion.button>
            )}
          </div>

          {/* Carrusel de Puntos de Navegación del Hero */}
          {topCarouselItems.length > 1 && onSelectFeaturedIndex && (
            <div className="pt-2 flex items-center space-x-2">
              {topCarouselItems.map((item, idx) => {
                const isCurr = idx === featuredIndex % topCarouselItems.length;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectFeaturedIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isCurr
                        ? 'w-8 bg-netflix-red shadow-[0_0_8px_rgba(229,9,20,0.9)]'
                        : 'w-2 bg-white/25 hover:bg-white/50'
                    }`}
                    title={item.title}
                  />
                );
              })}
              {onRandomizeFeatured && (
                <button
                  onClick={onRandomizeFeatured}
                  className="ml-2 text-[11px] font-bold text-gray-400 hover:text-white flex items-center space-x-0.5 transition-colors"
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

        </motion.div>

      </div>

      {/* Controles Inferiores Derecha: Audio del Tráiler y Calificación de Edad */}
      <div className="absolute right-0 bottom-24 sm:bottom-32 md:bottom-36 z-20 flex items-center space-x-2.5 pr-4 sm:pr-8">
        {trailerKey && (
          <motion.button 
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowVideoTrailer(!showVideoTrailer)}
            className={`px-3 sm:px-3.5 py-1.5 rounded-full backdrop-blur-md text-[11px] font-bold border flex items-center space-x-1.5 shadow-xl transition-all cursor-pointer ${
              showVideoTrailer
                ? 'bg-netflix-red text-white border-netflix-red'
                : 'bg-black/60 hover:bg-black/80 text-gray-200 border-white/20'
            }`}
            title="Activar o desactivar tráiler de fondo"
          >
            <Youtube className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{showVideoTrailer ? 'Ocultar Tráiler' : 'Ver Tráiler'}</span>
          </motion.button>
        )}

        {trailerKey && showVideoTrailer && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-xl transition-all cursor-pointer"
            title={isMuted ? "Activar audio" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-gray-300" /> : <Volume2 className="w-4 h-4 text-white" />}
          </motion.button>
        )}

        <div className="border-l-4 border-netflix-red bg-black/80 backdrop-blur-md px-3 py-1 text-[11px] font-black text-gray-200 rounded-r">
          {movie.age_rating || '16+'}
        </div>
      </div>

    </div>
  );
}
