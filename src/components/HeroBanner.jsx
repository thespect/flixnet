import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Info, Plus, Check, Volume2, VolumeX, Sparkles, Zap, Cast, ShieldCheck, Radio, Globe, Youtube, Star, ChevronRight } from 'lucide-react';
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
    <div className="relative h-[83dvh] sm:h-[88dvh] min-h-[540px] sm:min-h-[650px] max-h-[920px] w-full select-none overflow-hidden bg-[#040407]">
      
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
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.0, ease: [0.16, 1, 0.3, 1] }}
            src={movie.backdrop_path || movie.poster_path} 
            alt={movie.title}
            fetchPriority="high"
            className="w-full h-full object-cover object-center filter brightness-[0.76] contrast-[1.09] saturate-[1.15]"
          />
        )}

        {/* Cinematic Multi-Layer Gradient Mesh */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#040407] via-[#040407]/85 to-transparent w-full md:w-3/4 z-10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#040407] via-[#040407]/40 to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-[#040407]/95 via-[#040407]/50 to-transparent z-10" />
      </div>

      {/* Main Content Container */}
      <div className="relative max-w-7xl mx-auto h-full px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-24 sm:pb-32 md:pb-36 z-20">
        
        <motion.div 
          key={movie.id}
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl space-y-3 sm:space-y-4"
        >
          {/* Top Franchise Badges Stack */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-black">
            <span className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-netflix-red to-rose-600 text-white tracking-wider text-[9px] sm:text-[10px] uppercase shadow-lg shadow-red-900/50">
              <Sparkles className="w-3 h-3 mr-1 inline" /> {movie.isTv ? 'SERIE 4K ESTRELLA' : 'MASTER 4K DIGITAL'}
            </span>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center shadow">
              <Zap className="w-3 h-3 mr-1 fill-current" /> 2160p HDR10+ • ANTI-CAM
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 text-[9px] sm:text-[10px] font-black px-2.5 py-1 rounded-lg flex items-center shadow">
              <Globe className="w-3 h-3 mr-1.5 text-emerald-400 shrink-0" />
              <span>ESPAÑOL LATINO</span>
            </span>
            <span className="hidden sm:inline-flex bg-white/10 backdrop-blur-md text-white border border-white/20 text-[10px] font-black px-2.5 py-1 rounded-lg items-center">
              <ShieldCheck className="w-3 h-3 mr-1 text-emerald-400" /> 0% ANUNCIOS
            </span>
          </div>

          {/* Title with High-Impact Responsive Typography */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white tracking-tight drop-shadow-[0_10px_30px_rgba(0,0,0,0.95)] leading-[0.98] line-clamp-2">
            {movie.title}
          </h1>

          {/* Metadata, Genres & Auto-Verified Indicator */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] sm:text-xs text-gray-200 font-bold">
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30 font-black">
              <Star className="w-3 h-3 mr-1 fill-amber-400 text-amber-400" />
              {movie.vote_average || '8.8'}
            </span>
            {movie.release_date && (
              <span className="text-gray-300 font-black">{String(movie.release_date).slice(0, 4)}</span>
            )}
            <span className="text-emerald-400 font-black flex items-center">
              <Radio className="w-3.5 h-3.5 mr-1 animate-pulse" />
              Calidad Blu-Ray Verificada
            </span>
            {movie.genres?.slice(0, 3).map((genre, idx) => (
              <span key={idx} className="bg-white/10 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/10">
                {genre}
              </span>
            ))}
            <span className="hidden sm:inline-block border border-white/30 text-gray-200 text-[10px] px-2 py-0.5 rounded font-black tracking-wider">
              DOLBY ATMOS 5.1
            </span>
          </div>

          {/* Overview */}
          <p className="text-xs sm:text-sm md:text-base text-gray-300 line-clamp-2 sm:line-clamp-3 leading-relaxed drop-shadow-md max-w-xl font-normal">
            {movie.overview}
          </p>

          {/* Adaptive Buttons CTA */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 pt-1 sm:pt-2">
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => movie.isTv ? onOpenDetails(movie) : onPlay(movie, 1, 1)}
              className="flex items-center justify-center space-x-2 px-5 sm:px-7 py-3 sm:py-3.5 rounded-2xl bg-gradient-to-r from-netflix-red to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-black text-xs sm:text-base shadow-[0_12px_35px_rgba(229,9,20,0.5)] transition-all cursor-pointer border border-white/15"
            >
              <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current shrink-0" />
              <span>{movie.isTv ? 'Elegir Temporada / Capítulo' : 'Reproducir en 4K'}</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => onOpenDetails(movie)}
              className="flex items-center justify-center space-x-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-xl text-white font-bold text-xs sm:text-base transition-colors border border-white/20 cursor-pointer shadow-lg"
            >
              <Info className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{movie.isTv ? 'Temporadas y Capítulos' : 'Saga / Servidores 4K'}</span>
            </motion.button>

            <motion.button 
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => onToggleMyList(movie)}
              className="p-3 sm:p-3.5 rounded-2xl bg-black/65 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 transition-all shadow-xl cursor-pointer"
              title={isInMyList ? "Quitar de Mi Lista" : "Añadir a Mi Lista"}
            >
              {isInMyList ? <Check className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> : <Plus className="w-4 h-4 sm:w-5 sm:h-5" />}
            </motion.button>

            {onOpenCast && (
              <motion.button 
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => onOpenCast(movie)}
                className="p-3 sm:p-3.5 rounded-2xl bg-black/65 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 transition-all shadow-xl cursor-pointer"
                title="Transmitir a Smart TV (Chromecast / AirPlay)"
              >
                <Cast className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              </motion.button>
            )}
          </div>

          {/* Interactive Hero Carousel Indicators */}
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
                        ? 'w-8 sm:w-10 bg-netflix-red shadow-[0_0_10px_rgba(229,9,20,0.9)]'
                        : 'w-2.5 bg-white/25 hover:bg-white/50'
                    }`}
                    title={item.title}
                  />
                );
              })}
              {onRandomizeFeatured && (
                <button
                  onClick={onRandomizeFeatured}
                  className="ml-2 text-[11px] font-bold text-gray-300 hover:text-white flex items-center space-x-0.5 transition-colors"
                >
                  <span>Siguiente estreno</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

        </motion.div>

      </div>

      {/* Bottom Right Controls: Preview Trailer Toggle & Age Rating Badge */}
      <div className="absolute right-0 bottom-24 sm:bottom-32 md:bottom-36 z-20 flex items-center space-x-2.5 pr-4 sm:pr-8">
        {trailerKey && (
          <motion.button 
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowVideoTrailer(!showVideoTrailer)}
            className={`px-3 sm:px-3.5 py-2 rounded-full backdrop-blur-md text-[11px] sm:text-xs font-bold border flex items-center space-x-1.5 shadow-xl transition-all cursor-pointer ${
              showVideoTrailer
                ? 'bg-netflix-red text-white border-netflix-red'
                : 'bg-black/65 hover:bg-black/85 text-gray-200 border-white/20'
            }`}
            title="Activar/Desactivar vista previa de tráiler en fondo"
          >
            <Youtube className="w-4 h-4" />
            <span className="hidden sm:inline">{showVideoTrailer ? 'Ocultar Tráiler' : 'Vista Previa 4K'}</span>
          </motion.button>
        )}

        {trailerKey && showVideoTrailer && (
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsMuted(!isMuted)}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md text-white border border-white/20 flex items-center justify-center shadow-xl transition-all cursor-pointer"
            title={isMuted ? "Activar audio del tráiler" : "Silenciar"}
          >
            {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5 text-gray-300" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
          </motion.button>
        )}

        <div className="border-l-4 border-netflix-red bg-black/80 backdrop-blur-md px-3 py-1 text-[11px] sm:text-xs font-black text-gray-200 rounded-r">
          {movie.age_rating || '16+'}
        </div>
      </div>

    </div>
  );
}
